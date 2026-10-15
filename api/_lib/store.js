/**
 * Order + enquiry persistence.
 * - Supabase Postgres when SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.
 * - Local JSON files in data/ otherwise, for local development only
 *   (data/ is git-ignored and never deployed).
 * Both backends return orders in the same shape, so callers don't care which is live.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const env = require('./env');
const supabase = require('./supabase');

const DATA_DIR = process.env.HIPA_DATA_DIR || path.join(__dirname, '..', '..', 'data');
const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const PAYMENT_STATUSES = ['unpaid', 'paid', 'failed', 'refunded'];

class StoreUnavailableError extends Error {}

function backend() {
  if (supabase.isConfigured()) return 'supabase';
  if (env.isProduction()) {
    throw new StoreUnavailableError('The store database is not configured yet. Please contact us to order.');
  }
  return 'file';
}

function newOrderNumber() {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `HIPA-${ymd}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

const titleCase = s => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

// ---------------------------------------------------------------------------
// File backend (local dev)
// ---------------------------------------------------------------------------
function filePath(name) {
  return path.join(DATA_DIR, `${name}.json`);
}

function readFile(name) {
  try {
    return JSON.parse(fs.readFileSync(filePath(name), 'utf8'));
  } catch (e) {
    return [];
  }
}

function writeFile(name, rows) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(filePath(name), JSON.stringify(rows, null, 2), 'utf8');
}

function normalizeFileOrder(o) {
  return {
    ...o,
    order_status: titleCase(String(o.order_status || 'pending').toLowerCase()),
    payment_status: String(o.payment_status || 'unpaid').toUpperCase()
  };
}

// ---------------------------------------------------------------------------
// Supabase backend
// ---------------------------------------------------------------------------
function normalizeDbOrder(row) {
  return {
    id: row.id,
    order_number: row.order_number,
    created_at: row.created_at,
    user_id: row.user_id,
    order_status: titleCase(row.status),
    payment_status: String(row.payment_status || '').toUpperCase(),
    razorpay_order_id: row.razorpay_order_id,
    razorpay_payment_id: row.razorpay_payment_id,
    customer: { name: row.customer_name, phone: row.customer_phone, email: row.customer_email },
    shipping_address: row.shipping_address || {},
    items: (row.order_items || []).map(i => ({
      slug: i.product_slug,
      name: i.product_name,
      size: i.pack_size,
      unitPrice: Number(i.unit_price),
      quantity: i.quantity,
      lineTotal: Number(i.total_price),
      image: i.image
    })),
    subtotal: Number(row.subtotal),
    shipping: Number(row.shipping),
    total: Number(row.total)
  };
}

const ORDER_SELECT = 'select=*,order_items(*)';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
async function createPendingOrder({ userId, customer, address, priced, razorpayOrderId }) {
  const orderNumber = newOrderNumber();

  if (backend() === 'file') {
    const orders = readFile('orders');
    const order = {
      id: 'ord_' + Date.now(),
      order_number: orderNumber,
      created_at: new Date().toISOString(),
      user_id: userId || null,
      order_status: 'pending',
      payment_status: 'unpaid',
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: null,
      customer,
      shipping_address: address,
      items: priced.lines,
      subtotal: priced.subtotal,
      shipping: priced.shipping,
      total: priced.total
    };
    orders.unshift(order);
    writeFile('orders', orders);
    return normalizeFileOrder(order);
  }

  const [row] = await supabase.db.insert('orders', {
    user_id: userId || null,
    order_number: orderNumber,
    status: 'pending',
    payment_status: 'unpaid',
    payment_method: 'razorpay',
    razorpay_order_id: razorpayOrderId,
    customer_name: customer.name,
    customer_email: customer.email,
    customer_phone: customer.phone,
    shipping_address: address,
    subtotal: priced.subtotal,
    shipping: priced.shipping,
    total: priced.total
  });

  try {
    await supabase.db.insert('order_items', priced.lines.map(l => ({
      order_id: row.id,
      product_slug: l.slug,
      product_name: l.name,
      pack_size: l.size,
      quantity: l.quantity,
      unit_price: l.unitPrice,
      total_price: l.lineTotal,
      image: l.image
    })));
  } catch (e) {
    await supabase.db.update('orders', `id=eq.${row.id}`, { status: 'cancelled' }).catch(() => {});
    throw e;
  }

  return normalizeDbOrder({ ...row, order_items: [] });
}

async function findByRazorpayOrderId(razorpayOrderId) {
  if (backend() === 'file') {
    const order = readFile('orders').find(o => o.razorpay_order_id === razorpayOrderId);
    return order ? normalizeFileOrder(order) : null;
  }
  const rows = await supabase.db.select('orders', `${ORDER_SELECT}&razorpay_order_id=eq.${encodeURIComponent(razorpayOrderId)}&limit=1`);
  return rows && rows[0] ? normalizeDbOrder(rows[0]) : null;
}

/** Marks an order paid + confirmed. Safe to call more than once. */
async function markPaid(razorpayOrderId, razorpayPaymentId) {
  if (backend() === 'file') {
    const orders = readFile('orders');
    const order = orders.find(o => o.razorpay_order_id === razorpayOrderId);
    if (!order) return null;
    if (order.payment_status !== 'paid') {
      order.payment_status = 'paid';
      order.order_status = 'confirmed';
      order.razorpay_payment_id = razorpayPaymentId;
      writeFile('orders', orders);
    }
    return normalizeFileOrder(order);
  }

  await supabase.db.update(
    'orders',
    `razorpay_order_id=eq.${encodeURIComponent(razorpayOrderId)}&payment_status=neq.paid`,
    { payment_status: 'paid', status: 'confirmed', razorpay_payment_id: razorpayPaymentId }
  );
  return findByRazorpayOrderId(razorpayOrderId);
}

async function listOrders() {
  if (backend() === 'file') return readFile('orders').map(normalizeFileOrder);
  const rows = await supabase.db.select('orders', `${ORDER_SELECT}&order=created_at.desc&limit=500`);
  return rows.map(normalizeDbOrder);
}

async function updateOrder(idOrNumber, { order_status, payment_status }) {
  const status = order_status ? String(order_status).toLowerCase() : undefined;
  const payment = payment_status ? String(payment_status).toLowerCase() : undefined;
  if (status && !ORDER_STATUSES.includes(status)) throw new Error('Invalid order status.');
  if (payment && !PAYMENT_STATUSES.includes(payment)) throw new Error('Invalid payment status.');

  if (backend() === 'file') {
    const orders = readFile('orders');
    const order = orders.find(o => o.order_number === idOrNumber || o.id === idOrNumber);
    if (!order) return null;
    if (status) order.order_status = status;
    if (payment) order.payment_status = payment;
    writeFile('orders', orders);
    return normalizeFileOrder(order);
  }

  const patch = {};
  if (status) patch.status = status;
  if (payment) patch.payment_status = payment;
  const rows = await supabase.db.update('orders', `order_number=eq.${encodeURIComponent(idOrNumber)}`, patch);
  return rows && rows[0] ? normalizeDbOrder({ ...rows[0], order_items: [] }) : null;
}

const ENQUIRY_TABLES = { contact: 'contact_enquiries', b2b: 'b2b_enquiries' };

async function addEnquiry(kind, record) {
  if (backend() === 'file') {
    const rows = readFile(`${kind}-enquiries`);
    const row = { id: `${kind}_${Date.now()}`, status: 'new', created_at: new Date().toISOString(), ...record };
    rows.unshift(row);
    writeFile(`${kind}-enquiries`, rows);
    return row;
  }
  const [row] = await supabase.db.insert(ENQUIRY_TABLES[kind], record);
  return row;
}

async function listEnquiries(kind) {
  if (backend() === 'file') return readFile(`${kind}-enquiries`);
  return supabase.db.select(ENQUIRY_TABLES[kind], 'select=*&order=created_at.desc&limit=500');
}

module.exports = {
  StoreUnavailableError,
  createPendingOrder,
  findByRazorpayOrderId,
  markPaid,
  listOrders,
  updateOrder,
  addEnquiry,
  listEnquiries
};

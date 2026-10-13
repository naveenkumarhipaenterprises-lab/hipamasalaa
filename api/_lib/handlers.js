/**
 * All API route handlers. Each api/*.js file on Vercel re-exports one of these,
 * and scripts/server.js mounts the same functions for local development.
 */
const crypto = require('crypto');
const env = require('./env');
const supabase = require('./supabase');
const razorpay = require('./razorpay');
const store = require('./store');
const adminAuth = require('./admin-auth');
const { priceCart } = require('./catalog');
const { readJson, readRawBody, sendJson, bearerToken, methodGuard, clean } = require('./http');

const PHONE_RE = /^[6-9]\d{9}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PINCODE_RE = /^\d{6}$/;

function wrap(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (err) {
      if (err instanceof store.StoreUnavailableError) {
        return sendJson(res, 503, { error: err.message });
      }
      console.error(`[api] ${req.method} ${req.url} failed:`, err);
      if (!res.headersSent) sendJson(res, 500, { error: 'Something went wrong on our side. Please try again.' });
    }
  };
}

/** Resolves the signed-in customer. Returns { userId } or sends an error and returns null. */
async function requireCustomer(req, res) {
  if (env.supabaseUrl()) {
    const user = await supabase.getUser(bearerToken(req));
    if (!user) {
      sendJson(res, 401, { error: 'Please sign in to place your order.', code: 'AUTH_REQUIRED' });
      return null;
    }
    return { userId: user.id, email: user.email };
  }
  if (env.isProduction()) {
    sendJson(res, 503, { error: 'Customer accounts are not configured yet.' });
    return null;
  }
  // Local development without Supabase: the browser uses a local mock login.
  return { userId: null };
}

function validateCheckout(body) {
  const c = body.customer || {};
  const a = body.address || {};
  const customer = { name: clean(c.name, 100), phone: clean(c.phone, 10), email: clean(c.email, 200).toLowerCase() };
  const address = {
    street: clean(a.street, 300),
    city: clean(a.city, 100),
    state: clean(a.state, 100),
    pincode: clean(a.pincode, 6),
    landmark: clean(a.landmark, 150)
  };
  if (customer.name.length < 2) return { error: 'Please enter your full name.' };
  if (!PHONE_RE.test(customer.phone)) return { error: 'Please enter a valid 10-digit Indian mobile number.' };
  if (!EMAIL_RE.test(customer.email)) return { error: 'Please enter a valid email address.' };
  if (address.street.length < 5) return { error: 'Please enter your full delivery address.' };
  if (!address.city || !address.state) return { error: 'Please enter your city and state.' };
  if (!PINCODE_RE.test(address.pincode)) return { error: 'Please enter a valid 6-digit PIN code.' };
  return { customer, address };
}

// ---------------------------------------------------------------------------
// Checkout
// ---------------------------------------------------------------------------
const createOrder = wrap(async (req, res) => {
  if (!methodGuard(req, res, 'POST')) return;
  const body = await readJson(req);

  const who = await requireCustomer(req, res);
  if (!who) return;

  const checked = validateCheckout(body);
  if (checked.error) return sendJson(res, 400, { error: checked.error });

  const priced = priceCart(body.items);
  if (priced.error) return sendJson(res, 400, { error: priced.error });

  const amount = Math.round(priced.total * 100);
  let mode;
  let razorpayOrderId;

  if (razorpay.isConfigured()) {
    const rp = await razorpay.createOrder(amount, `rcpt_${Date.now()}`, {
      customer_name: checked.customer.name,
      customer_phone: checked.customer.phone
    });
    razorpayOrderId = rp.id;
    mode = 'razorpay';
  } else if (env.allowTestPayments()) {
    razorpayOrderId = `order_test_${crypto.randomBytes(8).toString('hex')}`;
    mode = 'test';
  } else {
    return sendJson(res, 503, { error: 'Online payments are not available right now. Please order on WhatsApp.' });
  }

  const order = await store.createPendingOrder({
    userId: who.userId,
    customer: checked.customer,
    address: checked.address,
    priced,
    razorpayOrderId
  });

  return sendJson(res, 200, {
    success: true,
    mode,
    keyId: mode === 'razorpay' ? env.razorpayKeyId() : null,
    razorpayOrderId,
    orderNumber: order.order_number,
    amount,
    currency: 'INR',
    subtotal: priced.subtotal,
    shipping: priced.shipping,
    total: priced.total,
    items: priced.lines
  });
});

const verifyPayment = wrap(async (req, res) => {
  if (!methodGuard(req, res, 'POST')) return;
  const body = await readJson(req);
  const orderId = clean(body.razorpay_order_id, 100);
  const paymentId = clean(body.razorpay_payment_id, 100);
  const signature = clean(body.razorpay_signature, 200);

  if (!orderId || !paymentId) return sendJson(res, 400, { error: 'Missing payment details.' });

  const order = await store.findByRazorpayOrderId(orderId);
  if (!order) return sendJson(res, 404, { error: 'We could not find this order.' });

  if (order.user_id && env.supabaseUrl()) {
    const user = await supabase.getUser(bearerToken(req));
    if (!user || user.id !== order.user_id) return sendJson(res, 403, { error: 'This order belongs to a different account.' });
  }

  const isTestOrder = orderId.startsWith('order_test_');
  const valid = isTestOrder ? env.allowTestPayments() : razorpay.verifyPaymentSignature(orderId, paymentId, signature);
  if (!valid) return sendJson(res, 400, { error: 'Payment verification failed.' });

  const paid = await store.markPaid(orderId, paymentId);
  return sendJson(res, 200, {
    success: true,
    orderNumber: paid.order_number,
    total: paid.total,
    status: paid.order_status,
    paymentStatus: paid.payment_status
  });
});

const paymentWebhook = wrap(async (req, res) => {
  if (!methodGuard(req, res, 'POST')) return;
  if (!env.razorpayWebhookSecret()) return sendJson(res, 503, { error: 'Webhook secret not configured.' });

  const raw = await readRawBody(req);
  if (!razorpay.verifyWebhookSignature(raw, req.headers['x-razorpay-signature'])) {
    return sendJson(res, 400, { error: 'Invalid webhook signature.' });
  }

  const event = JSON.parse(raw);
  if (event.event === 'payment.captured' || event.event === 'order.paid') {
    const payment = event.payload && event.payload.payment && event.payload.payment.entity;
    if (payment && payment.order_id) await store.markPaid(payment.order_id, payment.id);
  }
  return sendJson(res, 200, { status: 'ok' });
});

// ---------------------------------------------------------------------------
// Enquiries
// ---------------------------------------------------------------------------
const contact = wrap(async (req, res) => {
  if (!methodGuard(req, res, 'POST')) return;
  const b = await readJson(req);
  const record = {
    name: clean(b.name, 100),
    email: clean(b.email, 200),
    phone: clean(b.phone, 20),
    subject: clean(b.subject, 150),
    message: clean(b.message, 2000)
  };
  if (record.name.length < 2 || !record.message) return sendJson(res, 400, { error: 'Please fill in your name and message.' });
  if (!EMAIL_RE.test(record.email) && !/^\d{10}$/.test(record.phone)) {
    return sendJson(res, 400, { error: 'Please give us a valid email or phone number.' });
  }
  const row = await store.addEnquiry('contact', record);
  return sendJson(res, 200, { success: true, refCode: `HP-${String(row.id).replace(/\D/g, '').slice(-5) || Date.now().toString().slice(-5)}` });
});

const b2bEnquiry = wrap(async (req, res) => {
  if (!methodGuard(req, res, 'POST')) return;
  const b = await readJson(req);
  const refCode = /^B2B-\d{4,6}$/.test(b.refCode || '') ? b.refCode : `B2B-${crypto.randomInt(10000, 99999)}`;
  const record = {
    ref_code: refCode,
    full_name: clean(b.fullName, 100),
    company_name: clean(b.companyName, 150),
    phone: clean(b.phone, 20),
    email: clean(b.email, 200),
    city: clean(b.city, 100),
    business_type: clean(b.businessType, 100),
    products: Array.isArray(b.products) ? b.products.slice(0, 20).map(p => clean(p, 60)) : [],
    bulk_requirement: clean(b.bulkRequirement, 200),
    message: clean(b.message, 2000)
  };
  if (record.full_name.length < 2 || !record.phone) return sendJson(res, 400, { error: 'Please fill in your name and phone number.' });
  await store.addEnquiry('b2b', record);
  return sendJson(res, 200, { success: true, refCode });
});

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------
const adminLogin = wrap(async (req, res) => {
  if (!methodGuard(req, res, 'POST')) return;
  if (!env.adminSecret() || env.adminSecret().length < 12) {
    return sendJson(res, 503, { error: 'Admin access is not configured. Set ADMIN_SECRET_KEY (12+ characters).' });
  }
  const body = await readJson(req);
  if (!adminAuth.checkPassword(body.password)) {
    await new Promise(r => setTimeout(r, 500));
    return sendJson(res, 401, { success: false, error: 'Invalid admin passphrase.' });
  }
  return sendJson(res, 200, { success: true, token: adminAuth.issueToken() });
});

const adminOrders = wrap(async (req, res) => {
  if (!methodGuard(req, res, 'GET')) return;
  if (!adminAuth.requireAdmin(req, res)) return;
  return sendJson(res, 200, { orders: await store.listOrders() });
});

const adminOrderUpdate = wrap(async (req, res) => {
  if (!methodGuard(req, res, 'PATCH')) return;
  if (!adminAuth.requireAdmin(req, res)) return;
  const id = clean(req.query && req.query.id, 100);
  const body = await readJson(req);
  let order;
  try {
    order = await store.updateOrder(id, body);
  } catch (e) {
    return sendJson(res, 400, { error: e.message });
  }
  if (!order) return sendJson(res, 404, { error: 'Order not found.' });
  return sendJson(res, 200, { success: true, order });
});

const adminB2b = wrap(async (req, res) => {
  if (!methodGuard(req, res, 'GET')) return;
  if (!adminAuth.requireAdmin(req, res)) return;
  const rows = await store.listEnquiries('b2b');
  const enquiries = rows.map(r => ({
    refCode: r.ref_code || r.refCode,
    fullName: r.full_name || r.fullName,
    companyName: r.company_name || r.companyName,
    phone: r.phone,
    email: r.email,
    city: r.city,
    businessType: r.business_type || r.businessType,
    products: r.products || [],
    bulkRequirement: r.bulk_requirement || r.bulkRequirement,
    message: r.message,
    status: r.status,
    created_at: r.created_at
  }));
  return sendJson(res, 200, { enquiries });
});

const adminContact = wrap(async (req, res) => {
  if (!methodGuard(req, res, 'GET')) return;
  if (!adminAuth.requireAdmin(req, res)) return;
  return sendJson(res, 200, { messages: await store.listEnquiries('contact') });
});

// ---------------------------------------------------------------------------
// Public browser config (only public values: Supabase anon key is safe to expose, RLS protects data)
// ---------------------------------------------------------------------------
const publicConfig = (req, res) => {
  const config = {
    supabaseUrl: env.supabaseUrl(),
    supabaseAnonKey: env.supabaseAnonKey(),
    razorpayKeyId: env.razorpayKeyId()
  };
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.end(`window.__HIPA_PUBLIC_CONFIG__ = ${JSON.stringify(config)};\n`);
};

module.exports = {
  createOrder,
  verifyPayment,
  paymentWebhook,
  contact,
  b2bEnquiry,
  adminLogin,
  adminOrders,
  adminOrderUpdate,
  adminB2b,
  adminContact,
  publicConfig
};

/**
 * End-to-end API smoke test against the local server (no Supabase/Razorpay needed).
 * Starts scripts/server.js on a spare port with a throwaway data folder, then checks
 * pricing, checkout, payment verification, admin auth and that secrets aren't served.
 *
 *   npm test
 */
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');

const PORT = 3900 + Math.floor(Math.random() * 90);
const BASE = `http://localhost:${PORT}`;
const DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'hipa-test-'));
const ADMIN_KEY = 'test-admin-passphrase-123';

const server = spawn(process.execPath, [path.join(__dirname, 'server.js')], {
  // Blank values override anything in a local .env, so the test always runs offline in dev mode.
  env: {
    ...process.env,
    PORT: String(PORT),
    HIPA_DATA_DIR: DATA_DIR,
    ADMIN_SECRET_KEY: ADMIN_KEY,
    NODE_ENV: 'development',
    VERCEL_ENV: '',
    SUPABASE_URL: '',
    SUPABASE_ANON_KEY: '',
    SUPABASE_SERVICE_ROLE_KEY: '',
    RAZORPAY_KEY_ID: '',
    RAZORPAY_KEY_SECRET: '',
    ALLOW_TEST_PAYMENTS: 'true'
  },
  stdio: ['ignore', 'pipe', 'pipe']
});
let serverLog = '';
server.stdout.on('data', d => { serverLog += d; });
server.stderr.on('data', d => { serverLog += d; });

async function waitForServer() {
  for (let i = 0; i < 50; i++) {
    try {
      await fetch(BASE + '/');
      return;
    } catch (e) {
      await new Promise(r => setTimeout(r, 100));
    }
  }
  throw new Error('Server did not start:\n' + serverLog);
}

const post = (url, body, headers = {}) => fetch(BASE + url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', ...headers },
  body: JSON.stringify(body)
});

const customer = { name: 'Test Customer', phone: '9876543210', email: 'test@example.com' };
const address = { street: '5 Thirumurugan Nagar 2nd St', city: 'Chennai', state: 'Tamil Nadu', pincode: '600117', landmark: '' };

const results = [];
async function test(name, fn) {
  try {
    await fn();
    results.push(['PASS', name]);
  } catch (err) {
    results.push(['FAIL', name, err.message]);
  }
}

(async () => {
  await waitForServer();

  await test('home page and clean URLs are served', async () => {
    assert.strictEqual((await fetch(BASE + '/')).status, 200);
    assert.strictEqual((await fetch(BASE + '/shop')).status, 200);
    assert.strictEqual((await fetch(BASE + '/checkout.html')).status, 200);
  });

  await test('secrets, server code and local data are not downloadable', async () => {
    for (const p of ['/.env', '/.env.example', '/data/orders.json', '/scripts/server.js', '/api/_lib/env.js', '/package.json', '/%2e%2e/%2e%2e/etc/hosts', '/.git/config']) {
      const status = (await fetch(BASE + p)).status;
      assert.strictEqual(status, 404, `${p} returned ${status}`);
    }
  });

  await test('public config only exposes public values', async () => {
    const res = await fetch(BASE + '/api/public-config');
    const text = await res.text();
    assert.ok(text.startsWith('window.__HIPA_PUBLIC_CONFIG__'));
    assert.ok(!/service_role|SECRET/i.test(text));
  });

  await test('server ignores tampered prices and charges catalog prices', async () => {
    const res = await post('/api/payment/create-order', {
      items: [{ slug: 'pepper-powder', size: '1kg', quantity: 2, price: 1 }],
      customer, address
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200, JSON.stringify(data));
    assert.strictEqual(data.total, 1980);
    assert.strictEqual(data.mode, 'test');
  });

  await test('orders under ₹999 are rejected', async () => {
    const res = await post('/api/payment/create-order', { items: [{ slug: 'sambar-powder', size: '100g', quantity: 1 }], customer, address });
    assert.strictEqual(res.status, 400);
  });

  await test('unknown products or sizes are rejected', async () => {
    const res = await post('/api/payment/create-order', { items: [{ slug: 'gold-dust', size: '1kg', quantity: 10 }], customer, address });
    assert.strictEqual(res.status, 400);
  });

  await test('invalid phone / PIN code are rejected', async () => {
    const items = [{ slug: 'pepper-powder', size: '1kg', quantity: 2 }];
    assert.strictEqual((await post('/api/payment/create-order', { items, customer: { ...customer, phone: '12345' }, address })).status, 400);
    assert.strictEqual((await post('/api/payment/create-order', { items, customer, address: { ...address, pincode: '12' } })).status, 400);
  });

  let orderNumber;
  await test('full checkout: create order -> verify payment -> order is paid', async () => {
    const created = await (await post('/api/payment/create-order', {
      items: [{ slug: 'sambar-powder', size: '1kg', quantity: 1 }, { slug: 'garam-masala', size: '1kg', quantity: 1 }],
      customer, address
    })).json();
    assert.ok(created.success, JSON.stringify(created));
    assert.strictEqual(created.total, 450 + 740);

    const verified = await (await post('/api/payment/verify', {
      razorpay_order_id: created.razorpayOrderId,
      razorpay_payment_id: 'pay_test_1',
      razorpay_signature: ''
    })).json();
    assert.ok(verified.success, JSON.stringify(verified));
    assert.strictEqual(verified.orderNumber, created.orderNumber);
    assert.strictEqual(verified.paymentStatus, 'PAID');
    orderNumber = verified.orderNumber;

    const saved = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'orders.json'), 'utf8'));
    const row = saved.find(o => o.order_number === orderNumber);
    assert.strictEqual(row.payment_status, 'paid');
    assert.strictEqual(row.total, 1190);
  });

  await test('verifying an unknown order fails', async () => {
    const res = await post('/api/payment/verify', { razorpay_order_id: 'order_fake', razorpay_payment_id: 'pay_x', razorpay_signature: 'x' });
    assert.strictEqual(res.status, 404);
  });

  await test('admin endpoints reject missing or forged tokens', async () => {
    assert.strictEqual((await fetch(BASE + '/api/admin/orders')).status, 401);
    assert.strictEqual((await fetch(BASE + '/api/admin/orders', { headers: { Authorization: 'Bearer anything' } })).status, 401);
    assert.strictEqual((await post('/api/admin/login', { password: 'hipa_admin_2026' })).status, 401);
  });

  await test('admin can sign in, list orders and update status', async () => {
    const { token } = await (await post('/api/admin/login', { password: ADMIN_KEY })).json();
    assert.ok(token);
    const auth = { Authorization: 'Bearer ' + token };
    const { orders } = await (await fetch(BASE + '/api/admin/orders', { headers: auth })).json();
    assert.ok(orders.some(o => o.order_number === orderNumber && o.payment_status === 'PAID'));
    const patched = await fetch(`${BASE}/api/admin/orders/${orderNumber}`, {
      method: 'PATCH',
      headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_status: 'Shipped' })
    });
    assert.strictEqual(patched.status, 200);
    assert.strictEqual((await patched.json()).order.order_status, 'Shipped');
  });

  await test('contact and B2B enquiries are saved', async () => {
    const c = await post('/api/contact', { name: 'Asha', email: 'asha@example.com', phone: '9876543210', subject: 'Hi', message: 'Do you ship to Madurai?' });
    assert.strictEqual(c.status, 200);
    const b = await post('/api/b2b-enquiry', { fullName: 'Ravi', companyName: 'Ravi Stores', phone: '9876543210', products: ['Sambar Powder'] });
    assert.strictEqual(b.status, 200);
    assert.strictEqual(JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'contact-enquiries.json'), 'utf8')).length, 1);
    assert.strictEqual(JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'b2b-enquiries.json'), 'utf8')).length, 1);
  });

  server.kill();
  fs.rmSync(DATA_DIR, { recursive: true, force: true });

  for (const [status, name, err] of results) console.log(`${status}  ${name}${err ? `\n      ${err}` : ''}`);
  const failed = results.filter(r => r[0] === 'FAIL').length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
})().catch(err => {
  console.error(err);
  server.kill();
  process.exit(1);
});

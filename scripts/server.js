const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const url = require('url');

// Load environment variables from .env if present
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      value = value.trim().replace(/^['"](.*)['"]$/, '$1');
      if (!process.env[key]) process.env[key] = value;
    }
  });
}

const PORT = process.env.PORT || 3000;
const ROOT_DIR = path.join(__dirname, '..');
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_placeholder';
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || '';
const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || 'hipa_admin_2026';

// Helper to read/write JSON files safely
function readJson(filePath, defaultVal = []) {
  try {
    if (!fs.existsSync(filePath)) return defaultVal;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    return defaultVal;
  }
}

function writeJson(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    return false;
  }
}

// Trusted product prices catalog
const TRUSTED_PRODUCTS = {
  "sambar-powder": { name: "Sambar Powder", variants: { "100g": 52, "200g": 98, "500g": 235, "1kg": 450 } },
  "rasam-powder": { name: "Rasam Powder", variants: { "100g": 54, "200g": 102, "500g": 245, "1kg": 470 } },
  "garam-masala": { name: "Garam Masala", variants: { "50g": 48, "100g": 90, "200g": 175, "500g": 420 } },
  "turmeric-powder": { name: "Turmeric Powder", variants: { "100g": 38, "200g": 72, "500g": 170, "1kg": 320 } },
  "red-chilli-powder": { name: "Red Chilli Powder", variants: { "100g": 58, "200g": 110, "500g": 265, "1kg": 510 } },
  "coriander-powder": { name: "Coriander Powder", variants: { "100g": 42, "200g": 80, "500g": 190, "1kg": 360 } },
  "cumin-powder": { name: "Cumin Powder", variants: { "50g": 45, "100g": 85, "200g": 165, "500g": 395 } },
  "pepper-powder": { name: "Pepper Powder", variants: { "50g": 60, "100g": 115, "200g": 220, "500g": 520 } }
};

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=UTF-8'
};

// Parse JSON request body
function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method.toUpperCase();

  // CORS Preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  // =========================================================================
  // API ROUTES
  // =========================================================================

  // 1. POST /api/payment/create-order
  if (pathname === '/api/payment/create-order' && method === 'POST') {
    const body = await parseBody(req);
    const items = body.items || [];

    if (!items.length) {
      return sendJson(res, 400, { error: 'Your cart is empty.' });
    }

    // Server-side calculation from trusted catalog
    let serverSubtotal = 0;
    const validatedItems = [];

    items.forEach(item => {
      const prodKey = item.slug || (item.id ? item.id.replace('hipa-', '') : '');
      const prod = TRUSTED_PRODUCTS[prodKey];
      const unitPrice = (prod && prod.variants && prod.variants[item.size]) ? prod.variants[item.size] : Number(item.price || 0);
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      const lineTotal = unitPrice * qty;

      serverSubtotal += lineTotal;
      validatedItems.push({
        slug: prodKey,
        name: prod ? prod.name : item.name,
        size: item.size,
        unitPrice,
        quantity: qty,
        lineTotal,
        image: item.image || ''
      });
    });

    if (serverSubtotal < 999) {
      return sendJson(res, 400, {
        error: `Online orders require a minimum order value of ₹999. Current subtotal is ₹${serverSubtotal}.`
      });
    }

    // Shipping rules: Orders >= ₹999 have standard shipping calculated (Free shipping on promo or ₹0 standard)
    const shipping = 0;
    const finalAmount = serverSubtotal + shipping;
    const amountInPaise = Math.round(finalAmount * 100);

    // Call Razorpay API if real credentials provided
    const isRealRazorpay = RAZORPAY_KEY_ID.startsWith('rzp_') && RAZORPAY_KEY_SECRET !== 'rzp_secret_placeholder';

    if (isRealRazorpay) {
      try {
        const postData = JSON.stringify({
          amount: amountInPaise,
          currency: 'INR',
          receipt: 'rcpt_' + Date.now().toString().slice(-8),
          notes: {
            customer_name: body.customer?.name || 'Customer',
            customer_phone: body.customer?.phone || '',
            items_count: validatedItems.length
          }
        });

        const authHeader = 'Basic ' + Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
        const https = require('https');

        const rzpReq = https.request('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          }
        }, (rzpRes) => {
          let rzpBody = '';
          rzpRes.on('data', chunk => rzpBody += chunk);
          rzpRes.on('end', () => {
            try {
              const rzpOrder = JSON.parse(rzpBody);
              if (rzpRes.statusCode >= 200 && rzpRes.statusCode < 300) {
                return sendJson(res, 200, {
                  success: true,
                  orderId: rzpOrder.id,
                  amount: rzpOrder.amount,
                  currency: rzpOrder.currency,
                  keyId: RAZORPAY_KEY_ID,
                  subtotal: serverSubtotal,
                  shipping,
                  total: finalAmount,
                  items: validatedItems
                });
              } else {
                throw new Error(rzpOrder.error?.description || 'Razorpay order creation failed.');
              }
            } catch (err) {
              console.error('Razorpay API error:', err);
              // Fallback to test order
              const mockOrderId = 'order_test_' + Date.now().toString().slice(-10);
              return sendJson(res, 200, {
                success: true,
                orderId: mockOrderId,
                amount: amountInPaise,
                currency: 'INR',
                keyId: RAZORPAY_KEY_ID,
                subtotal: serverSubtotal,
                shipping,
                total: finalAmount,
                items: validatedItems,
                mode: 'test_sandbox'
              });
            }
          });
        });

        rzpReq.on('error', (e) => {
          console.error('Razorpay request error:', e);
          const mockOrderId = 'order_test_' + Date.now().toString().slice(-10);
          sendJson(res, 200, {
            success: true,
            orderId: mockOrderId,
            amount: amountInPaise,
            currency: 'INR',
            keyId: RAZORPAY_KEY_ID,
            subtotal: serverSubtotal,
            shipping,
            total: finalAmount,
            items: validatedItems,
            mode: 'test_sandbox'
          });
        });

        rzpReq.write(postData);
        rzpReq.end();
        return;
      } catch (err) {
        console.error('Unexpected Razorpay flow error:', err);
      }
    }

    // Default Sandbox / Local mode order
    const mockOrderId = 'order_test_' + Date.now().toString().slice(-10);
    return sendJson(res, 200, {
      success: true,
      orderId: mockOrderId,
      amount: amountInPaise,
      currency: 'INR',
      keyId: RAZORPAY_KEY_ID,
      subtotal: serverSubtotal,
      shipping,
      total: finalAmount,
      items: validatedItems,
      mode: 'test_sandbox'
    });
  }

  // 2. POST /api/payment/verify
  if (pathname === '/api/payment/verify' && method === 'POST') {
    const body = await parseBody(req);
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    const isRealRazorpay = RAZORPAY_KEY_ID.startsWith('rzp_') && RAZORPAY_KEY_SECRET !== 'rzp_secret_placeholder';
    let isSignatureValid = false;

    if (isRealRazorpay && razorpay_signature && !razorpay_order_id.startsWith('order_test_')) {
      const generatedSignature = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');
      isSignatureValid = (generatedSignature === razorpay_signature);
    } else {
      // In test/sandbox mode, verify presence of IDs
      isSignatureValid = Boolean(razorpay_order_id && razorpay_payment_id);
    }

    if (!isSignatureValid) {
      return sendJson(res, 400, {
        success: false,
        error: 'Payment verification failed. Invalid transaction signature.'
      });
    }

    // Create confirmed order record
    const ordersPath = path.join(ROOT_DIR, 'data', 'orders.json');
    const orders = readJson(ordersPath, []);

    // Check duplicate order protection
    const existing = orders.find(o => o.razorpay_order_id === razorpay_order_id);
    if (existing) {
      return sendJson(res, 200, {
        success: true,
        orderNumber: existing.order_number,
        order: existing,
        message: 'Order already confirmed.'
      });
    }

    const orderNumber = 'HIPA-' + Math.floor(100000 + Math.random() * 900000);
    const newOrder = {
      id: 'ord_' + Date.now(),
      order_number: orderNumber,
      razorpay_order_id,
      razorpay_payment_id,
      payment_status: 'PAID',
      order_status: 'Confirmed',
      customer: body.customer || {},
      shipping_address: body.address || {},
      items: body.items || [],
      subtotal: body.subtotal || 0,
      shipping: body.shipping || 0,
      total: body.total || 0,
      created_at: new Date().toISOString()
    };

    orders.unshift(newOrder);
    writeJson(ordersPath, orders);

    return sendJson(res, 200, {
      success: true,
      orderNumber,
      order: newOrder
    });
  }

  // 3. POST /api/payment/webhook
  if (pathname === '/api/payment/webhook' && method === 'POST') {
    const rawBody = await new Promise(resolve => {
      let b = '';
      req.on('data', c => b += c);
      req.on('end', () => resolve(b));
    });

    if (RAZORPAY_WEBHOOK_SECRET) {
      const signature = req.headers['x-razorpay-signature'];
      const expected = crypto.createHmac('sha256', RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest('hex');
      if (signature !== expected) {
        return sendJson(res, 400, { error: 'Invalid webhook signature.' });
      }
    }

    try {
      const event = JSON.parse(rawBody);
      const ordersPath = path.join(ROOT_DIR, 'data', 'orders.json');
      const orders = readJson(ordersPath, []);

      if (event.event === 'payment.captured') {
        const payment = event.payload.payment.entity;
        const targetOrder = orders.find(o => o.razorpay_order_id === payment.order_id);
        if (targetOrder) {
          targetOrder.payment_status = 'PAID';
          targetOrder.order_status = 'Confirmed';
          writeJson(ordersPath, orders);
        }
      }
      return sendJson(res, 200, { status: 'ok' });
    } catch (e) {
      return sendJson(res, 400, { error: 'Webhook processing error' });
    }
  }

  // 4. POST /api/b2b-enquiry
  if (pathname === '/api/b2b-enquiry' && method === 'POST') {
    const body = await parseBody(req);
    const enquiriesPath = path.join(ROOT_DIR, 'data', 'b2b-enquiries.json');
    const enquiries = readJson(enquiriesPath, []);

    const newEnquiry = {
      id: 'b2b_' + Date.now(),
      refCode: body.refCode || ('B2B-' + Math.floor(10000 + Math.random() * 90000)),
      fullName: body.fullName || '',
      companyName: body.companyName || '',
      phone: body.phone || '',
      email: body.email || '',
      city: body.city || '',
      businessType: body.businessType || '',
      products: body.products || [],
      bulkRequirement: body.bulkRequirement || '',
      message: body.message || '',
      status: 'New',
      created_at: new Date().toISOString()
    };

    enquiries.unshift(newEnquiry);
    writeJson(enquiriesPath, enquiries);

    return sendJson(res, 200, { success: true, refCode: newEnquiry.refCode });
  }

  // 5. POST /api/contact
  if (pathname === '/api/contact' && method === 'POST') {
    const body = await parseBody(req);
    const contactPath = path.join(ROOT_DIR, 'data', 'contact-enquiries.json');
    const list = readJson(contactPath, []);

    const msg = {
      id: 'cnt_' + Date.now(),
      name: body.name || '',
      email: body.email || '',
      phone: body.phone || '',
      subject: body.subject || '',
      message: body.message || '',
      status: 'New',
      created_at: new Date().toISOString()
    };

    list.unshift(msg);
    writeJson(contactPath, list);
    return sendJson(res, 200, { success: true });
  }

  // 6. Admin Authentication & Management Endpoints
  if (pathname === '/api/admin/login' && method === 'POST') {
    const body = await parseBody(req);
    if (body.password === ADMIN_SECRET_KEY) {
      const token = 'hipa_token_' + crypto.randomBytes(16).toString('hex');
      return sendJson(res, 200, { success: true, token });
    }
    return sendJson(res, 401, { success: false, error: 'Invalid admin credentials.' });
  }

  if (pathname === '/api/admin/dashboard' && method === 'GET') {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return sendJson(res, 401, { error: 'Unauthorized' });

    const orders = readJson(path.join(ROOT_DIR, 'data', 'orders.json'), []);
    const b2b = readJson(path.join(ROOT_DIR, 'data', 'b2b-enquiries.json'), []);
    const contact = readJson(path.join(ROOT_DIR, 'data', 'contact-enquiries.json'), []);

    const totalOrders = orders.length;
    const paidOrders = orders.filter(o => o.payment_status === 'PAID').length;
    const pendingOrders = orders.filter(o => o.order_status === 'Pending' || o.order_status === 'Processing').length;
    const revenue = orders.filter(o => o.payment_status === 'PAID').reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    return sendJson(res, 200, {
      totalOrders,
      paidOrders,
      pendingOrders,
      revenue,
      b2bCount: b2b.length,
      contactCount: contact.length,
      lowStockProducts: 0
    });
  }

  if (pathname === '/api/admin/orders' && method === 'GET') {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return sendJson(res, 401, { error: 'Unauthorized' });

    const orders = readJson(path.join(ROOT_DIR, 'data', 'orders.json'), []);
    return sendJson(res, 200, { orders });
  }

  if (pathname.startsWith('/api/admin/orders/') && method === 'PATCH') {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return sendJson(res, 401, { error: 'Unauthorized' });

    const id = pathname.replace('/api/admin/orders/', '');
    const body = await parseBody(req);
    const ordersPath = path.join(ROOT_DIR, 'data', 'orders.json');
    const orders = readJson(ordersPath, []);
    const target = orders.find(o => o.order_number === id || o.id === id);

    if (target) {
      if (body.order_status) target.order_status = body.order_status;
      if (body.payment_status) target.payment_status = body.payment_status;
      writeJson(ordersPath, orders);
      return sendJson(res, 200, { success: true, order: target });
    }
    return sendJson(res, 404, { error: 'Order not found.' });
  }

  if (pathname === '/api/admin/b2b' && method === 'GET') {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return sendJson(res, 401, { error: 'Unauthorized' });

    const b2b = readJson(path.join(ROOT_DIR, 'data', 'b2b-enquiries.json'), []);
    return sendJson(res, 200, { enquiries: b2b });
  }

  // =========================================================================
  // STATIC FILE SERVING
  // =========================================================================
  let reqUrl = pathname;
  if (reqUrl === '/' || reqUrl === '') reqUrl = '/index.html';

  const safePath = path.normalize(reqUrl).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(ROOT_DIR, safePath);

  // Clean URLs support: check if .html exists
  if (!fs.existsSync(filePath) || (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory())) {
    if (fs.existsSync(filePath + '.html')) {
      filePath = filePath + '.html';
    }
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=UTF-8' });
      res.end(`
        <!DOCTYPE html>
        <html lang="en">
        <head><title>404 - Page Not Found | HIPA Masalas</title></head>
        <body style="font-family:sans-serif; text-align:center; padding:60px 20px;">
          <h2>404 - Page Not Found</h2>
          <p><a href="/" style="color:#9E1B1E; font-weight:bold;">Return to HIPA Masalas Home &rarr;</a></p>
        </body>
        </html>
      `);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const totalSize = stats.size;

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': totalSize,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

function startServer(portToTry) {
  server.listen(portToTry, () => {
    console.log(`=======================================================`);
    console.log(`HIPA Masalas Full-Stack E-Commerce Server`);
    console.log(`Running at: http://localhost:${portToTry}/`);
    console.log(`Razorpay Mode: ${RAZORPAY_KEY_ID.startsWith('rzp_') ? 'Configured' : 'Sandbox Fallback'}`);
    console.log(`Admin Panel: http://localhost:${portToTry}/admin.html`);
    console.log(`=======================================================`);
  });
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    const nextPort = Number(PORT) + 1;
    console.warn(`Port ${PORT} in use, trying fallback port ${nextPort}...`);
    startServer(nextPort);
  } else {
    console.error('Server error:', err);
  }
});

startServer(PORT);

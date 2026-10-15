/**
 * HIPA Masala local development server.
 * Serves the static storefront and mounts the exact same API handlers that run
 * as Vercel functions in production (api/_lib/handlers.js).
 *
 *   npm run dev   ->  http://localhost:3000
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const env = require('../api/_lib/env');
const handlers = require('../api/_lib/handlers');
const supabase = require('../api/_lib/supabase');
const razorpay = require('../api/_lib/razorpay');

const PORT = Number(env.get('PORT')) || 3000;
const ROOT_DIR = path.join(__dirname, '..');

const ROUTES = {
  'POST /api/payment/create-order': handlers.createOrder,
  'POST /api/payment/verify': handlers.verifyPayment,
  'POST /api/payment/webhook': handlers.paymentWebhook,
  'POST /api/contact': handlers.contact,
  'POST /api/b2b-enquiry': handlers.b2bEnquiry,
  'GET /api/public-config': handlers.publicConfig,
  'POST /api/admin/login': handlers.adminLogin,
  'GET /api/admin/orders': handlers.adminOrders,
  'GET /api/admin/b2b': handlers.adminB2b,
  'GET /api/admin/contact': handlers.adminContact
};

// Never serve secrets, server code, local data or tooling as static files.
const BLOCKED = /^\/(\.|api\/|data\/|scripts\/|sql\/|node_modules\/|package(-lock)?\.json$|vercel\.json$)/i;

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
  '.txt': 'text/plain; charset=UTF-8',
  '.pdf': 'application/pdf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.woff2': 'font/woff2'
};

function notFound(res) {
  res.writeHead(404, { 'Content-Type': 'text/html; charset=UTF-8' });
  res.end('<!DOCTYPE html><html lang="en"><head><title>404 - Page Not Found | HIPA Masala</title></head>' +
    '<body style="font-family:sans-serif;text-align:center;padding:60px 20px;"><h2>404 - Page Not Found</h2>' +
    '<p><a href="/" style="color:#9E1B1E;font-weight:bold;">Return to HIPA Masala Home &rarr;</a></p></body></html>');
}

function serveStatic(req, res, pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch (e) {
    return notFound(res);
  }
  if (decoded === '/' || decoded === '') decoded = '/index.html';
  if (BLOCKED.test(decoded) || decoded.includes('\0')) return notFound(res);

  let filePath = path.resolve(ROOT_DIR, '.' + decoded);
  if (!filePath.startsWith(ROOT_DIR + path.sep)) return notFound(res);

  // Clean URLs (/shop -> shop.html), matching vercel.json "cleanUrls"
  if (!path.extname(filePath) && fs.existsSync(filePath + '.html')) filePath += '.html';

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) return notFound(res);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const range = req.headers.range;

    if (range && (ext === '.mp4' || ext === '.webm')) {
      const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
      const start = parseInt(startStr, 10);
      const end = endStr ? parseInt(endStr, 10) : stats.size - 1;
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stats.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': end - start + 1,
        'Content-Type': contentType
      });
      return fs.createReadStream(filePath, { start, end }).pipe(res);
    }

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Cache-Control': 'no-cache'
    });
    fs.createReadStream(filePath).pipe(res);
  });
}

const server = http.createServer((req, res) => {
  const { pathname, searchParams } = new URL(req.url, 'http://localhost');
  req.query = Object.fromEntries(searchParams);
  const method = req.method.toUpperCase();

  if (pathname.startsWith('/api/')) {
    const handler = ROUTES[`${method} ${pathname}`];
    if (handler) return handler(req, res);

    const orderMatch = pathname.match(/^\/api\/admin\/orders\/([^/]+)$/);
    if (orderMatch && method === 'PATCH') {
      req.query.id = decodeURIComponent(orderMatch[1]);
      return handlers.adminOrderUpdate(req, res);
    }
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Not found' }));
  }

  serveStatic(req, res, pathname);
});

function start(port, attemptsLeft = 5) {
  server.once('error', err => {
    if (err.code === 'EADDRINUSE' && attemptsLeft > 0) {
      console.warn(`Port ${port} is in use, trying ${port + 1}...`);
      start(port + 1, attemptsLeft - 1);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });
  server.listen(port, () => {
    console.log('=======================================================');
    console.log('HIPA Masala storefront');
    console.log(`Running at:  http://localhost:${port}/`);
    console.log(`Database:    ${supabase.isConfigured() ? 'Supabase' : 'local JSON files in data/ (dev only)'}`);
    console.log(`Auth:        ${env.supabaseUrl() && env.supabaseAnonKey() ? 'Supabase Auth' : 'local mock login (dev only)'}`);
    console.log(`Payments:    ${razorpay.isConfigured() ? 'Razorpay' : env.allowTestPayments() ? 'simulated test payments' : 'disabled'}`);
    console.log(`Admin panel: http://localhost:${port}/admin.html${env.adminSecret() ? '' : '  (set ADMIN_SECRET_KEY to enable)'}`);
    console.log('=======================================================');
  });
}

start(PORT);

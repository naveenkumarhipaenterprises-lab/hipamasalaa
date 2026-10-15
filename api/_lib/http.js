/**
 * Small request/response helpers shared by the Vercel functions and the local server.
 */

function readRawBody(req) {
  if (typeof req.rawBody === 'string') return Promise.resolve(req.rawBody);
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1e6) {
        reject(new Error('Request body too large'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

async function readJson(req) {
  // Vercel pre-parses JSON bodies into req.body
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch (e) { return {}; }
  }
  try {
    const raw = await readRawBody(req);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function sendJson(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=UTF-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
}

function bearerToken(req) {
  const header = req.headers['authorization'] || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : '';
}

function methodGuard(req, res, allowed) {
  if (req.method === allowed) return true;
  res.setHeader('Allow', allowed);
  sendJson(res, 405, { error: 'Method not allowed' });
  return false;
}

function clean(value, max = 500) {
  return String(value == null ? '' : value).trim().slice(0, max);
}

module.exports = { readRawBody, readJson, sendJson, bearerToken, methodGuard, clean };

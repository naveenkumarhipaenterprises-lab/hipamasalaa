/**
 * Stateless admin session tokens: HMAC-signed with ADMIN_SECRET_KEY, valid for 12 hours.
 * Works the same on the local server and on Vercel (no server memory needed).
 */
const crypto = require('crypto');
const env = require('./env');
const { bearerToken, sendJson } = require('./http');

const TTL_MS = 12 * 60 * 60 * 1000;

function sign(payload, secret) {
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
}

function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

function checkPassword(password) {
  const secret = env.adminSecret();
  if (!secret || secret.length < 12) return false;
  return safeEqual(password || '', secret);
}

function issueToken() {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + TTL_MS })).toString('base64url');
  return `${payload}.${sign(payload, env.adminSecret())}`;
}

function verifyToken(token) {
  const secret = env.adminSecret();
  if (!secret || !token || !token.includes('.')) return false;
  const [payload, signature] = token.split('.');
  if (!safeEqual(signature, sign(payload, secret))) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return typeof exp === 'number' && exp > Date.now();
  } catch (e) {
    return false;
  }
}

/** Returns true when the request carries a valid admin token, otherwise responds 401. */
function requireAdmin(req, res) {
  if (verifyToken(bearerToken(req))) return true;
  sendJson(res, 401, { error: 'Admin session expired. Please sign in again.' });
  return false;
}

module.exports = { checkPassword, issueToken, verifyToken, requireAdmin };

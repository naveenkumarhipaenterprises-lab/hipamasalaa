/**
 * Razorpay helpers: order creation and signature checks.
 */
const crypto = require('crypto');
const env = require('./env');

function isConfigured() {
  return Boolean(env.razorpayKeyId().startsWith('rzp_') && env.razorpayKeySecret());
}

async function createOrder(amountInPaise, receipt, notes) {
  const auth = Buffer.from(`${env.razorpayKeyId()}:${env.razorpayKeySecret()}`).toString('base64');
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: amountInPaise, currency: 'INR', receipt, notes })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.id) {
    throw new Error((data.error && data.error.description) || 'Could not start the payment. Please try again.');
  }
  return data;
}

function hmacMatches(secret, payload, signature) {
  if (!secret || !signature) return false;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function verifyPaymentSignature(orderId, paymentId, signature) {
  return hmacMatches(env.razorpayKeySecret(), `${orderId}|${paymentId}`, signature);
}

function verifyWebhookSignature(rawBody, signature) {
  return hmacMatches(env.razorpayWebhookSecret(), rawBody, signature);
}

module.exports = { isConfigured, createOrder, verifyPaymentSignature, verifyWebhookSignature };

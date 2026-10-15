/**
 * Environment loader + typed accessors.
 * Locally, values come from the project-root .env file (never committed).
 * On Vercel, values come from the project's Environment Variables.
 */
const fs = require('fs');
const path = require('path');

let loaded = false;

function loadDotEnv() {
  if (loaded) return;
  loaded = true;
  const envPath = path.join(__dirname, '..', '..', '.env');
  if (!fs.existsSync(envPath)) return;
  fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (!match || line.trim().startsWith('#')) return;
    const value = match[2].trim().replace(/^['"](.*)['"]$/, '$1');
    if (process.env[match[1]] === undefined) process.env[match[1]] = value;
  });
}

function get(name) {
  loadDotEnv();
  const value = process.env[name];
  if (!value || /YourSupabase|YourRazorpay|YourTestKey|placeholder/i.test(value)) return '';
  return value.trim();
}

const env = {
  get,
  isProduction() {
    loadDotEnv();
    return process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';
  },
  supabaseUrl: () => get('SUPABASE_URL').replace(/\/+$/, ''),
  supabaseAnonKey: () => get('SUPABASE_ANON_KEY'),
  supabaseServiceKey: () => get('SUPABASE_SERVICE_ROLE_KEY'),
  razorpayKeyId: () => get('RAZORPAY_KEY_ID'),
  razorpayKeySecret: () => get('RAZORPAY_KEY_SECRET'),
  razorpayWebhookSecret: () => get('RAZORPAY_WEBHOOK_SECRET'),
  adminSecret: () => get('ADMIN_SECRET_KEY'),
  // Simulated payments are for local testing only. They are never allowed in
  // production unless explicitly switched on.
  allowTestPayments() {
    const flag = get('ALLOW_TEST_PAYMENTS');
    if (flag) return flag === 'true';
    return !env.isProduction();
  }
};

module.exports = env;

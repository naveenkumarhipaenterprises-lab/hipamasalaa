/**
 * Minimal Supabase server client (PostgREST + Auth over fetch, no dependencies).
 * Uses the service-role key, which bypasses RLS, so it must only ever run on the server.
 */
const env = require('./env');

function isConfigured() {
  return Boolean(env.supabaseUrl() && env.supabaseServiceKey());
}

function serviceHeaders(extra = {}) {
  const key = env.supabaseServiceKey();
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    ...extra
  };
}

async function rest(method, pathAndQuery, body, extraHeaders) {
  const res = await fetch(`${env.supabaseUrl()}/rest/v1/${pathAndQuery}`, {
    method,
    headers: serviceHeaders({ Prefer: 'return=representation', ...extraHeaders }),
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const message = (data && (data.message || data.error)) || `Supabase ${method} ${pathAndQuery} failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

const db = {
  select: (table, query = '') => rest('GET', `${table}?${query}`),
  insert: (table, rows) => rest('POST', table, rows),
  update: (table, query, patch) => rest('PATCH', `${table}?${query}`, patch)
};

/** Resolves a Supabase access token to its user, or null when invalid. */
async function getUser(accessToken) {
  if (!accessToken || !env.supabaseUrl()) return null;
  const apikey = env.supabaseAnonKey() || env.supabaseServiceKey();
  try {
    const res = await fetch(`${env.supabaseUrl()}/auth/v1/user`, {
      headers: { apikey, Authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok) return null;
    const user = await res.json();
    return user && user.id ? user : null;
  } catch (e) {
    return null;
  }
}

module.exports = { isConfigured, db, getUser };

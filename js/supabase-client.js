/**
 * HIPA MASALA AUTH CONTROLLER
 * Supabase Auth (email + password, Google) when keys are configured.
 * Without keys (local development only) it falls back to a mock login kept in this browser.
 *
 * Browsing never needs a login. Checkout does: use HipaAuth.requireAuth().
 * Always wait for HipaAuth.ready before reading the session on page load.
 */

const HipaAuth = {
  client: null,
  currentUser: null,
  subscribers: [],
  ready: null,
  _resolveReady: null,

  isLive: function() {
    return !!this.client;
  },

  init: function() {
    this.ready = new Promise(resolve => { this._resolveReady = resolve; });

    const config = window.HIPA_CONFIG && window.HIPA_CONFIG.supabase;
    const hasKeys = config && config.url && config.anonKey;

    if (hasKeys && window.supabase && typeof window.supabase.createClient === 'function') {
      try {
        this.client = window.supabase.createClient(config.url, config.anonKey, {
          auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
        });
        this.client.auth.onAuthStateChange((event, session) => {
          const wasSignedIn = !!this.currentUser;
          this.currentUser = session ? session.user : null;
          if (event === 'SIGNED_IN' && !wasSignedIn) this.onLoginSuccess(this.currentUser);
          if (event === 'PASSWORD_RECOVERY' && !/account\.html/.test(window.location.pathname)) {
            window.location.href = 'account.html?tab=security&recovery=1';
          }
          this.notifySubscribers();
          this.updateNavbarUI();
        });
        this.client.auth.getSession()
          .then(({ data }) => { this.currentUser = data && data.session ? data.session.user : null; })
          .catch(() => { this.currentUser = null; })
          .finally(() => this.markReady());
      } catch (e) {
        console.warn('Supabase could not start; using local login fallback.', e);
        this.client = null;
        this.initLocalAuth();
        this.markReady();
      }
    } else {
      if (hasKeys) console.warn('Supabase SDK not loaded on this page; using local login fallback.');
      this.initLocalAuth();
      this.markReady();
    }
  },

  markReady: function() {
    this.updateNavbarUI();
    this.notifySubscribers();
    this._resolveReady(this.currentUser);
  },

  // ---------------------------------------------------------------------------
  // Local mock auth (development without Supabase keys). Never used when keys are set.
  // ---------------------------------------------------------------------------
  initLocalAuth: function() {
    try {
      const saved = localStorage.getItem('hipa_auth_user');
      this.currentUser = saved ? JSON.parse(saved) : null;
    } catch (e) {
      this.currentUser = null;
    }
  },

  _localUsers: function() {
    try { return JSON.parse(localStorage.getItem('hipa_registered_users') || '[]'); } catch (e) { return []; }
  },

  _hash: async function(text) {
    if (!window.crypto || !window.crypto.subtle) return text;
    const buf = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode('hipa:' + text));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  },

  _setLocalSession: function(user) {
    this.currentUser = user;
    localStorage.setItem('hipa_auth_user', JSON.stringify(user));
  },

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------
  /** Returns { user, needsConfirmation } */
  signUp: async function(fullName, email, password) {
    if (this.client) {
      const { data, error } = await this.client.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: window.location.origin + '/login.html'
        }
      });
      if (error) throw error;
      // When "Confirm email" is on in Supabase, there is no session until the link is clicked.
      if (!data.session) return { user: data.user, needsConfirmation: true };
      this.currentUser = data.user;
      return { user: data.user, needsConfirmation: false };
    }

    const users = this._localUsers();
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('An account with this email already exists. Please log in.');
    }
    const newUser = {
      id: 'usr_' + Date.now(),
      email,
      user_metadata: { full_name: fullName },
      created_at: new Date().toISOString()
    };
    users.push({ ...newUser, passwordHash: await this._hash(password) });
    localStorage.setItem('hipa_registered_users', JSON.stringify(users));
    this._setLocalSession(newUser);
    this.onLoginSuccess(newUser);
    return { user: newUser, needsConfirmation: false };
  },

  signIn: async function(email, password) {
    if (this.client) {
      const { data, error } = await this.client.auth.signInWithPassword({ email, password });
      if (error) {
        if (/confirm/i.test(error.message)) throw new Error('Please confirm your email first. Check your inbox for the link.');
        throw new Error('Incorrect email or password.');
      }
      this.currentUser = data.user;
      return data;
    }

    const hash = await this._hash(password);
    const user = this._localUsers().find(u =>
      u.email.toLowerCase() === email.toLowerCase() && (u.passwordHash === hash || u.password === password));
    if (!user) throw new Error('Incorrect email or password.');
    const sessionUser = { id: user.id, email: user.email, user_metadata: user.user_metadata || {}, created_at: user.created_at };
    this._setLocalSession(sessionUser);
    this.onLoginSuccess(sessionUser);
    return { user: sessionUser };
  },

  /** Google sign-in. Needs the Google provider enabled in Supabase > Authentication > Providers. */
  signInWithGoogle: async function(returnUrl) {
    if (!this.client) throw new Error('Google sign-in is not available yet.');
    const target = this.safeReturnUrl(returnUrl) || 'account.html';
    const { error } = await this.client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/' + target }
    });
    if (error) throw error;
  },

  sendPasswordReset: async function(email) {
    if (!this.client) throw new Error('Password reset needs the live account system. Please contact us.');
    const { error } = await this.client.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/account.html?tab=security&recovery=1'
    });
    if (error) throw error;
  },

  updatePassword: async function(newPassword) {
    if (!this.client) throw new Error('Password changes need the live account system.');
    const { error } = await this.client.auth.updateUser({ password: newPassword });
    if (error) throw error;
  },

  updateProfile: async function(fields) {
    const user = this.currentUser;
    if (!user) throw new Error('Please sign in again.');

    if (this.client) {
      const { data, error } = await this.client.auth.updateUser({ data: { full_name: fields.fullName } });
      if (error) throw error;
      this.currentUser = data.user;
      const patch = { full_name: fields.fullName };
      if (fields.phone !== undefined) patch.phone = fields.phone;
      const { error: profileError } = await this.client.from('profiles').update(patch).eq('user_id', user.id);
      if (profileError) console.warn('Profile row not updated:', profileError.message);
    } else {
      user.user_metadata = { ...(user.user_metadata || {}), full_name: fields.fullName, phone: fields.phone };
      this._setLocalSession(user);
    }
    this.updateNavbarUI();
    this.notifySubscribers();
  },

  getProfile: async function() {
    const user = this.currentUser;
    if (!user) return null;
    if (!this.client) return { full_name: user.user_metadata && user.user_metadata.full_name, phone: user.user_metadata && user.user_metadata.phone, email: user.email };
    const { data } = await this.client.from('profiles').select('full_name, phone, email, default_address').eq('user_id', user.id).maybeSingle();
    return data;
  },

  saveDefaultAddress: async function(address, phone) {
    if (!this.client || !this.currentUser) return;
    await this.client.from('profiles').update({ default_address: address, phone }).eq('user_id', this.currentUser.id);
  },

  /** Access token to send to our API as "Authorization: Bearer <token>". */
  getAccessToken: async function() {
    if (!this.client) return null;
    const { data } = await this.client.auth.getSession();
    return data && data.session ? data.session.access_token : null;
  },

  signOut: async function() {
    if (this.client) {
      try { await this.client.auth.signOut(); } catch (e) { console.error(e); }
    }
    this.currentUser = null;
    localStorage.removeItem('hipa_auth_user');
    this.notifySubscribers();
    this.updateNavbarUI();
    window.location.href = 'index.html';
  },

  getUser: function() {
    return this.currentUser;
  },

  getDisplayName: function(user) {
    const u = user || this.currentUser;
    if (!u) return '';
    const meta = u.user_metadata || {};
    return meta.full_name || meta.name || (u.email ? u.email.split('@')[0] : 'Customer');
  },

  isAuthenticated: function() {
    return !!this.currentUser;
  },

  onLoginSuccess: function(user) {
    if (!user) return;
    // Supabase re-announces the session on every page load; merge only once per tab session.
    const flag = 'hipa_synced_' + user.id;
    try {
      if (sessionStorage.getItem(flag)) return;
      sessionStorage.setItem(flag, '1');
    } catch (e) {}
    if (window.Cart && typeof window.Cart.syncWithUser === 'function') window.Cart.syncWithUser(user);
    if (window.Wishlist && typeof window.Wishlist.syncWithUser === 'function') window.Wishlist.syncWithUser(user);
  },

  subscribe: function(callback) {
    this.subscribers.push(callback);
    callback(this.currentUser);
  },

  notifySubscribers: function() {
    this.subscribers.forEach(cb => {
      try { cb(this.currentUser); } catch (e) { console.error(e); }
    });
  },

  /** Only allow redirects back to our own pages (prevents open redirects). */
  safeReturnUrl: function(url) {
    if (!url) return '';
    const cleaned = String(url).replace(/^\/+/, '');
    return /^[a-z0-9-]+\.html(\?[\w=&%.-]*)?$/i.test(cleaned) ? cleaned : '';
  },

  /** Sends guests to login and back here afterwards. Returns true when signed in. */
  requireAuth: function(returnUrl, reason) {
    if (this.isAuthenticated()) return true;
    const here = window.location.pathname.split('/').pop() + window.location.search;
    const destination = this.safeReturnUrl(returnUrl || here) || 'index.html';
    let target = `login.html?returnUrl=${encodeURIComponent(destination)}`;
    if (reason) target += `&reason=${encodeURIComponent(reason)}`;
    window.location.href = target;
    return false;
  },

  escape: function(text) {
    return String(text == null ? '' : text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  },

  updateNavbarUI: function() {
    const authLinks = document.querySelectorAll('.js-auth-action');
    const user = this.currentUser;
    const name = user ? this.escape(this.getDisplayName(user)) : '';
    const email = user ? this.escape(user.email || '') : '';

    authLinks.forEach(el => {
      if (user) {
        el.innerHTML = `
          <div class="user-nav-dropdown-trigger" onclick="HipaAuth.toggleDropdown(event)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            <span class="user-nav-name">${name}</span>
            <svg class="dropdown-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </div>
          <div class="user-nav-dropdown" id="userNavDropdown">
            <div class="dropdown-header">
              <div class="dropdown-user-name">${name}</div>
              <div class="dropdown-user-email">${email}</div>
            </div>
            <div class="dropdown-divider"></div>
            <a href="account.html" class="dropdown-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              <span>My Account</span>
            </a>
            <a href="wishlist.html" class="dropdown-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
              <span>My Wishlist</span>
            </a>
            <a href="account.html?tab=orders" class="dropdown-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
              <span>My Orders</span>
            </a>
            <div class="dropdown-divider"></div>
            <button type="button" class="dropdown-item logout-item" onclick="HipaAuth.signOut()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              <span>Sign Out</span>
            </button>
          </div>
        `;
      } else {
        el.innerHTML = `
          <a href="login.html" class="nav-auth-link" title="Customer Login">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            <span>Login</span>
          </a>
        `;
      }
    });

    const mobileAuthContainer = document.getElementById('mobileAuthNav');
    if (mobileAuthContainer) {
      if (user) {
        mobileAuthContainer.innerHTML = `
          <div class="mobile-user-profile">
            <div class="mobile-user-avatar">${name.charAt(0).toUpperCase()}</div>
            <div>
              <div class="mobile-user-name">${name}</div>
              <div class="mobile-user-email">${email}</div>
            </div>
          </div>
          <a href="account.html" class="mobile-nav-link">My Account</a>
          <a href="wishlist.html" class="mobile-nav-link">My Wishlist</a>
          <a href="account.html?tab=orders" class="mobile-nav-link">My Orders</a>
          <button type="button" class="mobile-nav-link mobile-logout-btn" onclick="HipaAuth.signOut()">Sign Out</button>
        `;
      } else {
        mobileAuthContainer.innerHTML = `
          <div class="mobile-auth-guest-row">
            <a href="login.html" class="btn btn-primary btn-sm btn-block">Customer Login</a>
            <a href="signup.html" class="btn btn-secondary btn-sm btn-block">Create Account</a>
          </div>
        `;
      }
    }
  },

  toggleDropdown: function(e) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const dropdown = document.getElementById('userNavDropdown');
    if (dropdown) dropdown.classList.toggle('is-open');
  }
};

document.addEventListener('click', (e) => {
  const dropdown = document.getElementById('userNavDropdown');
  if (dropdown && !e.target.closest('.user-nav-dropdown-trigger') && !e.target.closest('.user-nav-dropdown')) {
    dropdown.classList.remove('is-open');
  }
});

// Start immediately so HipaAuth.ready exists for every later script on the page.
HipaAuth.init();
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => HipaAuth.updateNavbarUI());
}

window.HipaAuth = HipaAuth;

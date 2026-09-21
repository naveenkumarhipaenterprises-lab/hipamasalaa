/**
 * HIPA MASALA SUPABASE CLIENT & AUTH CONTROLLER
 * Supports real Supabase Auth + PostgreSQL with seamless local fallback
 */

const HipaAuth = {
  client: null,
  currentUser: null,
  subscribers: [],

  init: function() {
    const config = window.HIPA_CONFIG && window.HIPA_CONFIG.supabase;
    const isLiveConfig = config && config.url && !config.url.includes('placeholder') && config.anonKey && !config.anonKey.includes('placeholder');

    if (window.supabase && isLiveConfig) {
      try {
        this.client = window.supabase.createClient(config.url, config.anonKey);
        this.client.auth.onAuthStateChange((event, session) => {
          this.currentUser = session ? session.user : null;
          this.notifySubscribers();
          this.updateNavbarUI();
        });
      } catch (e) {
        console.warn('Supabase initialization failed, running in resilient local auth mode', e);
        this.initLocalAuth();
      }
    } else {
      this.initLocalAuth();
    }

    this.updateNavbarUI();
  },

  initLocalAuth: function() {
    const saved = localStorage.getItem('hipa_auth_user');
    if (saved) {
      try {
        this.currentUser = JSON.parse(saved);
      } catch (e) {
        this.currentUser = null;
      }
    }
  },

  signUp: async function(fullName, email, password) {
    if (this.client) {
      const { data, error } = await this.client.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName }
        }
      });
      if (error) throw error;
      this.currentUser = data.user;
      this.onLoginSuccess(this.currentUser);
      return data;
    }

    // Local resilient auth fallback
    const users = JSON.parse(localStorage.getItem('hipa_registered_users') || '[]');
    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      throw new Error('An account with this email already exists. Please login.');
    }

    const newUser = {
      id: 'usr_' + Date.now(),
      email: email,
      user_metadata: { full_name: fullName },
      created_at: new Date().toISOString()
    };
    users.push({ ...newUser, password });
    localStorage.setItem('hipa_registered_users', JSON.stringify(users));

    this.currentUser = newUser;
    localStorage.setItem('hipa_auth_user', JSON.stringify(newUser));
    this.onLoginSuccess(this.currentUser);
    return { user: newUser };
  },

  signIn: async function(email, password) {
    if (this.client) {
      const { data, error } = await this.client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      this.currentUser = data.user;
      this.onLoginSuccess(this.currentUser);
      return data;
    }

    // Local resilient auth fallback
    const users = JSON.parse(localStorage.getItem('hipa_registered_users') || '[]');
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!user) {
      throw new Error('Invalid email or password. Please verify your credentials.');
    }

    const sessionUser = {
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata || { full_name: user.full_name || 'Customer' },
      created_at: user.created_at
    };
    this.currentUser = sessionUser;
    localStorage.setItem('hipa_auth_user', JSON.stringify(sessionUser));
    this.onLoginSuccess(this.currentUser);
    return { user: sessionUser };
  },

  signOut: async function() {
    if (this.client) {
      try {
        await this.client.auth.signOut();
      } catch (e) {
        console.error(e);
      }
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

  isAuthenticated: function() {
    return !!this.currentUser;
  },

  onLoginSuccess: function(user) {
    // 1. Trigger cart synchronization
    if (window.Cart && typeof window.Cart.syncWithUser === 'function') {
      window.Cart.syncWithUser(user);
    }
    // 2. Trigger wishlist synchronization
    if (window.Wishlist && typeof window.Wishlist.syncWithUser === 'function') {
      window.Wishlist.syncWithUser(user);
    }
    this.notifySubscribers();
    this.updateNavbarUI();
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

  requireAuth: function(returnUrl) {
    if (!this.isAuthenticated()) {
      const destination = returnUrl || window.location.pathname + window.location.search;
      window.location.href = `login.html?returnUrl=${encodeURIComponent(destination)}`;
      return false;
    }
    return true;
  },

  updateNavbarUI: function() {
    const authLinks = document.querySelectorAll('.js-auth-action');
    const user = this.currentUser;

    authLinks.forEach(el => {
      if (user) {
        const name = (user.user_metadata && user.user_metadata.full_name) || user.email.split('@')[0];
        el.innerHTML = `
          <div class="user-nav-dropdown-trigger" onclick="HipaAuth.toggleDropdown(event)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            <span class="user-nav-name">${name}</span>
            <svg class="dropdown-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </div>
          <div class="user-nav-dropdown" id="userNavDropdown">
            <div class="dropdown-header">
              <div class="dropdown-user-name">${name}</div>
              <div class="dropdown-user-email">${user.email}</div>
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

    // Mobile nav drawer auth items
    const mobileAuthContainer = document.getElementById('mobileAuthNav');
    if (mobileAuthContainer) {
      if (user) {
        const name = (user.user_metadata && user.user_metadata.full_name) || 'Customer';
        mobileAuthContainer.innerHTML = `
          <div class="mobile-user-profile">
            <div class="mobile-user-avatar">${name.charAt(0).toUpperCase()}</div>
            <div>
              <div class="mobile-user-name">${name}</div>
              <div class="mobile-user-email">${user.email}</div>
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
    if (dropdown) {
      dropdown.classList.toggle('is-open');
    }
  }
};

// Global click listener to close auth dropdown
document.addEventListener('click', (e) => {
  const dropdown = document.getElementById('userNavDropdown');
  if (dropdown && !e.target.closest('.user-nav-dropdown-trigger') && !e.target.closest('.user-nav-dropdown')) {
    dropdown.classList.remove('is-open');
  }
});

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => HipaAuth.init());
} else {
  HipaAuth.init();
}

window.HipaAuth = HipaAuth;

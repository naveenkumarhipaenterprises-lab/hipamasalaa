/**
 * HIPA Masala USER ACCOUNT CONTROLLER
 * Profile, order history (from Supabase when live), wishlist summary, password change.
 */

const Account = {
  user: null,

  init: async function() {
    if (!window.HipaAuth) return;
    await window.HipaAuth.ready;
    if (!window.HipaAuth.requireAuth('account.html')) return;

    this.user = window.HipaAuth.getUser();
    this.renderUserProfile();
    this.loadProfileExtras();
    this.renderOrders();
    this.renderWishlistSummary();
    this.handleUrlTab();
    this.initEventListeners();

    window.HipaAuth.subscribe(user => {
      if (!user) return;
      this.user = user;
      this.renderUserProfile();
    });
  },

  esc: function(text) {
    return window.HipaAuth.escape(text);
  },

  showAlert: function(id, message, type) {
    const box = document.getElementById(id);
    if (!box) return;
    box.className = `auth-alert-box is-${type}`;
    box.textContent = message;
  },

  renderUserProfile: function() {
    if (!this.user) return;
    const name = window.HipaAuth.getDisplayName(this.user);
    const email = this.user.email || '';

    const avatarEl = document.getElementById('accountAvatar');
    const nameEl = document.getElementById('accountName');
    const emailEl = document.getElementById('accountEmail');
    if (avatarEl) avatarEl.textContent = name.charAt(0).toUpperCase();
    if (nameEl) nameEl.textContent = name;
    if (emailEl) emailEl.textContent = email;

    const inputName = document.getElementById('profileName');
    const inputEmail = document.getElementById('profileEmail');
    const inputCreated = document.getElementById('profileCreated');
    if (inputName && document.activeElement !== inputName) inputName.value = name;
    if (inputEmail) inputEmail.value = email;
    if (inputCreated) {
      inputCreated.value = this.user.created_at
        ? new Date(this.user.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
        : 'Recent';
    }
  },

  loadProfileExtras: async function() {
    try {
      const profile = await window.HipaAuth.getProfile();
      const phoneEl = document.getElementById('profilePhone');
      if (profile && phoneEl && profile.phone) phoneEl.value = profile.phone;
    } catch (e) {}
  },

  fetchOrders: async function() {
    const auth = window.HipaAuth;
    if (auth.isLive()) {
      const { data, error } = await auth.client
        .from('orders')
        .select('order_number, created_at, total, status, payment_status, order_items(product_name, pack_size, quantity, unit_price)')
        .eq('payment_status', 'paid')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data.map(o => ({
        order_number: o.order_number,
        created_at: o.created_at,
        total: Number(o.total),
        status: o.status,
        items: (o.order_items || []).map(i => ({ name: i.product_name, size: i.pack_size, quantity: i.quantity }))
      }));
    }
    // Local development without Supabase: orders saved in this browser by checkout.js
    return JSON.parse(localStorage.getItem('hipa_user_orders') || '[]');
  },

  renderOrders: async function() {
    const ordersContainer = document.getElementById('ordersContainer');
    if (!ordersContainer) return;
    ordersContainer.innerHTML = '<p style="color:#6B7280;">Loading your orders...</p>';

    let orders;
    try {
      orders = await this.fetchOrders();
    } catch (e) {
      console.error('Could not load orders', e);
      ordersContainer.innerHTML = '<p style="color:#991B1B;">We could not load your orders right now. Please refresh the page.</p>';
      return;
    }

    if (!orders.length) {
      ordersContainer.innerHTML = `
        <div class="empty-tab-box">
          <div class="empty-tab-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
          </div>
          <h3 style="font-size:1.25rem; font-weight:800; margin-bottom:6px;">No Orders Placed Yet</h3>
          <p style="color:#6B7280; margin-bottom:20px;">Your orders will appear here once you check out.</p>
          <a href="shop.html" class="btn btn-primary btn-sm">Explore Masala Powders</a>
        </div>
      `;
      return;
    }

    const ordersHtml = orders.map(order => {
      const status = String(order.status || 'confirmed').toLowerCase();
      const label = status.charAt(0).toUpperCase() + status.slice(1);
      return `
      <div class="order-card">
        <div class="order-card-header">
          <div>
            <div class="order-number">Order #${this.esc(order.order_number)}</div>
            <div class="order-date">${new Date(order.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
          </div>
          <span class="order-status-badge status-${this.esc(status)}">${this.esc(label)}</span>
        </div>
        <div class="order-items-summary">
          <strong>Items:</strong> ${(order.items || []).map(i => `${this.esc(i.name)} (${this.esc(i.size)}) × ${Number(i.quantity)}`).join(', ')}
        </div>
        <div class="order-total-row">
          <span>Total paid</span>
          <span>₹${Number(order.total || order.total_amount || 0)}</span>
        </div>
      </div>`;
    }).join('');

    ordersContainer.innerHTML = `<div class="orders-list">${ordersHtml}</div>`;
  },

  renderWishlistSummary: function() {
    const countEl = document.getElementById('accountWishlistCount');
    const items = window.Wishlist ? window.Wishlist.getItems() : [];
    if (countEl) countEl.textContent = items.length;
  },

  switchTab: function(tabName) {
    document.querySelectorAll('.account-nav-btn[data-tab]').forEach(b => b.classList.toggle('is-active', b.getAttribute('data-tab') === tabName));
    document.querySelectorAll('.account-tab-pane').forEach(p => p.classList.toggle('is-active', p.id === `tab-${tabName}`));

    const url = new URL(window.location);
    url.searchParams.set('tab', tabName);
    url.searchParams.delete('recovery');
    window.history.replaceState({}, '', url);
  },

  handleUrlTab: function() {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab && document.getElementById(`tab-${tab}`)) this.switchTab(tab);
    if (params.get('recovery')) {
      this.showAlert('passwordAlert', 'Choose a new password for your account below.', 'success');
    }
  },

  initEventListeners: function() {
    document.querySelectorAll('.account-nav-btn[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => this.switchTab(btn.getAttribute('data-tab')));
    });

    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
      profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fullName = document.getElementById('profileName').value.trim();
        const phoneEl = document.getElementById('profilePhone');
        const phone = phoneEl ? phoneEl.value.replace(/\D/g, '') : undefined;
        if (fullName.length < 2) {
          this.showAlert('profileAlert', 'Please enter your full name.', 'error');
          return;
        }
        if (phone && !/^[6-9]\d{9}$/.test(phone)) {
          this.showAlert('profileAlert', 'Please enter a valid 10-digit mobile number.', 'error');
          return;
        }
        try {
          await window.HipaAuth.updateProfile({ fullName, phone: phone || null });
          this.user = window.HipaAuth.getUser();
          this.renderUserProfile();
          this.showAlert('profileAlert', 'Profile saved.', 'success');
        } catch (err) {
          this.showAlert('profileAlert', err.message || 'Could not save your profile.', 'error');
        }
      });
    }

    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
      passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newPass = document.getElementById('newPassword').value;
        const confirmPass = document.getElementById('confirmNewPassword').value;
        if (newPass.length < 6) {
          this.showAlert('passwordAlert', 'New password must be at least 6 characters.', 'error');
          return;
        }
        if (newPass !== confirmPass) {
          this.showAlert('passwordAlert', 'The two passwords do not match.', 'error');
          return;
        }
        try {
          await window.HipaAuth.updatePassword(newPass);
          passwordForm.reset();
          this.showAlert('passwordAlert', 'Password updated.', 'success');
        } catch (err) {
          this.showAlert('passwordAlert', err.message || 'Could not update your password.', 'error');
        }
      });
    }
  }
};

document.addEventListener('DOMContentLoaded', () => Account.init());

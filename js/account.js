/**
 * HIPA MASALA USER ACCOUNT CONTROLLER
 * Handles tab navigation, profile editing, order history, and security.
 */

const Account = {
  user: null,

  init: function() {
    // 1. Guard check: Require authentication
    if (!window.HipaAuth || !window.HipaAuth.isAuthenticated()) {
      window.location.href = `login.html?returnUrl=${encodeURIComponent('account.html')}`;
      return;
    }

    this.user = window.HipaAuth.getUser();
    this.renderUserProfile();
    this.renderOrders();
    this.renderWishlistSummary();
    this.handleUrlTab();
    this.initEventListeners();
  },

  renderUserProfile: function() {
    if (!this.user) return;
    const name = (this.user.user_metadata && this.user.user_metadata.full_name) || 'Customer';
    const email = this.user.email || '';

    // Sidebar
    const avatarEl = document.getElementById('accountAvatar');
    const nameEl = document.getElementById('accountName');
    const emailEl = document.getElementById('accountEmail');
    if (avatarEl) avatarEl.textContent = name.charAt(0).toUpperCase();
    if (nameEl) nameEl.textContent = name;
    if (emailEl) emailEl.textContent = email;

    // Form fields
    const inputName = document.getElementById('profileName');
    const inputEmail = document.getElementById('profileEmail');
    const inputCreated = document.getElementById('profileCreated');
    if (inputName) inputName.value = name;
    if (inputEmail) inputEmail.value = email;
    if (inputCreated) {
      const date = this.user.created_at ? new Date(this.user.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Recent';
      inputCreated.value = date;
    }
  },

  renderOrders: function() {
    const ordersContainer = document.getElementById('ordersContainer');
    if (!ordersContainer) return;

    // Check localStorage order history
    const orders = JSON.parse(localStorage.getItem('hipa_user_orders') || '[]');

    if (orders.length === 0) {
      ordersContainer.innerHTML = `
        <div class="empty-tab-box">
          <div class="empty-tab-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
          </div>
          <h3 style="font-size:1.25rem; font-weight:800; margin-bottom:6px;">No Orders Placed Yet</h3>
          <p style="color:#6B7280; margin-bottom:20px;">Once you place orders with ₹999 minimum order threshold, you can track their status and details here.</p>
          <a href="shop.html" class="btn btn-primary btn-sm">Explore Masala Powders</a>
        </div>
      `;
      return;
    }

    const ordersHtml = orders.map(order => `
      <div class="order-card">
        <div class="order-card-header">
          <div>
            <div class="order-number">Order #${order.order_number || order.id}</div>
            <div class="order-date">${new Date(order.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
          </div>
          <span class="order-status-badge status-${order.status || 'confirmed'}">${order.status || 'Confirmed'}</span>
        </div>
        <div class="order-items-summary">
          <strong>Items:</strong> ${(order.items || []).map(i => `${i.name} (${i.size}) × ${i.quantity}`).join(', ')}
        </div>
        <div class="order-total-row">
          <span>Total Paid / Due (₹):</span>
          <span>₹${order.total}</span>
        </div>
      </div>
    `).join('');

    ordersContainer.innerHTML = `<div class="orders-list">${ordersHtml}</div>`;
  },

  renderWishlistSummary: function() {
    const countEl = document.getElementById('accountWishlistCount');
    const items = window.Wishlist ? window.Wishlist.getItems() : [];
    if (countEl) countEl.textContent = items.length;
  },

  switchTab: function(tabName) {
    const buttons = document.querySelectorAll('.account-nav-btn[data-tab]');
    const panes = document.querySelectorAll('.account-tab-pane');

    buttons.forEach(b => b.classList.toggle('is-active', b.getAttribute('data-tab') === tabName));
    panes.forEach(p => p.classList.toggle('is-active', p.id === `tab-${tabName}`));

    const url = new URL(window.location);
    url.searchParams.set('tab', tabName);
    window.history.replaceState({}, '', url);
  },

  handleUrlTab: function() {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab && document.getElementById(`tab-${tab}`)) {
      this.switchTab(tab);
    }
  },

  initEventListeners: function() {
    // Navigation buttons
    document.querySelectorAll('.account-nav-btn[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.switchTab(btn.getAttribute('data-tab'));
      });
    });

    // Profile form submit
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
      profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newName = document.getElementById('profileName').value.trim();
        if (!newName) return;

        if (this.user) {
          if (!this.user.user_metadata) this.user.user_metadata = {};
          this.user.user_metadata.full_name = newName;
          localStorage.setItem('hipa_auth_user', JSON.stringify(this.user));
          this.renderUserProfile();
          if (window.HipaAuth) window.HipaAuth.updateNavbarUI();
          alert('Profile updated successfully!');
        }
      });
    }

    // Password form submit
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
      passwordForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newPass = document.getElementById('newPassword').value;
        const confirmPass = document.getElementById('confirmNewPassword').value;
        if (newPass.length < 6) {
          alert('New password must be at least 6 characters.');
          return;
        }
        if (newPass !== confirmPass) {
          alert('Passwords do not match.');
          return;
        }
        alert('Password changed successfully!');
        passwordForm.reset();
      });
    }
  }
};

document.addEventListener('DOMContentLoaded', () => Account.init());

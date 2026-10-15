/**
 * HIPA Masala — ADMIN CONSOLE CONTROLLER (js/admin.js)
 * Admin sign-in (server-checked passphrase), KPIs, orders, B2B leads and contact messages.
 * Every value from customers is HTML-escaped before display.
 */

(function () {
  'use strict';

  const esc = (text) => String(text == null ? '' : text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const STATUSES = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

  const AdminApp = {
    token: null,
    orders: [],
    b2bEnquiries: [],
    contactMessages: [],

    init: function () {
      this.token = sessionStorage.getItem('hipa_admin_token');
      this.bindEvents();
      if (this.token) this.showDashboard();
      else this.showLogin();
    },

    bindEvents: function () {
      const loginForm = document.getElementById('adminLoginForm');
      if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
          e.preventDefault();
          this.handleLogin();
        });
      }

      const logoutBtn = document.getElementById('adminLogoutBtn');
      if (logoutBtn) logoutBtn.addEventListener('click', () => this.handleLogout());

      const refreshBtn = document.getElementById('adminRefreshBtn');
      if (refreshBtn) refreshBtn.addEventListener('click', () => this.fetchData());

      document.querySelectorAll('.admin-nav-item').forEach(btn => {
        btn.addEventListener('click', () => this.switchTab(btn.getAttribute('data-tab')));
      });

      const searchInput = document.getElementById('orderSearchInput');
      const statusFilter = document.getElementById('orderStatusFilter');
      if (searchInput) searchInput.addEventListener('input', () => this.renderOrders());
      if (statusFilter) statusFilter.addEventListener('change', () => this.renderOrders());
    },

    handleLogin: async function () {
      const keyInput = document.getElementById('adminSecretKey');
      const errEl = document.getElementById('adminLoginError');
      const key = keyInput ? keyInput.value.trim() : '';
      if (!key) return;

      const showError = (msg) => {
        if (!errEl) return;
        errEl.textContent = msg;
        errEl.style.display = 'block';
      };

      try {
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: key })
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success && data.token) {
          this.token = data.token;
          sessionStorage.setItem('hipa_admin_token', data.token);
          if (errEl) errEl.style.display = 'none';
          if (keyInput) keyInput.value = '';
          this.showDashboard();
        } else {
          showError(data.error || 'Invalid administrator passphrase.');
        }
      } catch (err) {
        showError('Could not reach the server. Please try again.');
      }
    },

    handleLogout: function () {
      this.token = null;
      sessionStorage.removeItem('hipa_admin_token');
      this.showLogin();
    },

    showLogin: function () {
      document.getElementById('adminLoginScreen').style.display = 'flex';
      document.getElementById('adminDashboardScreen').style.display = 'none';
    },

    showDashboard: function () {
      document.getElementById('adminLoginScreen').style.display = 'none';
      document.getElementById('adminDashboardScreen').style.display = 'flex';
      this.fetchData();
      this.renderProducts();
    },

    switchTab: function (tabId) {
      document.querySelectorAll('.admin-nav-item').forEach(b => {
        b.classList.toggle('is-active', b.getAttribute('data-tab') === tabId);
      });
      document.querySelectorAll('.admin-tab-pane').forEach(p => {
        p.style.display = (p.id === tabId) ? 'block' : 'none';
      });
      const titleEl = document.getElementById('adminSectionTitle');
      if (titleEl) {
        const titles = {
          tabOrders: 'Orders Management',
          tabProducts: 'Products & Inventory',
          tabB2b: 'B2B Commercial Enquiries',
          tabContact: 'Customer Messages'
        };
        titleEl.textContent = titles[tabId] || 'Admin Console';
      }
    },

    api: async function (path, options = {}) {
      const res = await fetch(path, {
        ...options,
        headers: { ...(options.headers || {}), Authorization: 'Bearer ' + this.token }
      });
      if (res.status === 401) {
        this.handleLogout();
        throw new Error('Session expired');
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      return data;
    },

    fetchData: async function () {
      const [orders, b2b, contact] = await Promise.allSettled([
        this.api('/api/admin/orders'),
        this.api('/api/admin/b2b'),
        this.api('/api/admin/contact')
      ]);
      if (!this.token) return;

      this.orders = orders.status === 'fulfilled' ? orders.value.orders || [] : [];
      this.b2bEnquiries = b2b.status === 'fulfilled' ? b2b.value.enquiries || [] : [];
      this.contactMessages = contact.status === 'fulfilled' ? contact.value.messages || [] : [];

      const failed = [orders, b2b, contact].find(r => r.status === 'rejected');
      if (failed) console.error('Admin data load failed:', failed.reason);

      this.updateKPIs();
      this.renderOrders(failed && orders.status === 'rejected' ? failed.reason.message : '');
      this.renderB2B();
      this.renderContact();
    },

    updateKPIs: function () {
      const paid = this.orders.filter(o => o.payment_status === 'PAID');
      const totalRev = paid.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
      const openCount = paid.filter(o => o.order_status !== 'Delivered' && o.order_status !== 'Cancelled').length;

      document.getElementById('kpiRevenue').textContent = `₹${totalRev.toLocaleString('en-IN')}`;
      document.getElementById('kpiOrders').textContent = this.orders.length;
      document.getElementById('kpiPaidOrders').textContent = paid.length;
      document.getElementById('kpiPendingOrders').textContent = openCount;
      document.getElementById('kpiB2bCount').textContent = this.b2bEnquiries.length;
    },

    renderOrders: function (errorMessage) {
      const tbody = document.getElementById('ordersTableBody');
      if (!tbody) return;

      if (errorMessage) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:32px; color:#991B1B;">Could not load orders: ${esc(errorMessage)}</td></tr>`;
        return;
      }

      const q = (document.getElementById('orderSearchInput')?.value || '').toLowerCase().trim();
      const statusF = document.getElementById('orderStatusFilter')?.value || 'ALL';

      const list = this.orders.filter(o => {
        const matchQ = !q || (o.order_number && o.order_number.toLowerCase().includes(q)) ||
          (o.customer?.name && o.customer.name.toLowerCase().includes(q)) ||
          (o.customer?.phone && o.customer.phone.includes(q));
        const matchS = (statusF === 'ALL') || (o.order_status === statusF);
        return matchQ && matchS;
      });

      if (!list.length) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:32px; color:var(--admin-text-muted);">No matching orders found.</td></tr>`;
        return;
      }

      tbody.innerHTML = list.map(o => {
        const dateStr = o.created_at ? new Date(o.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent';
        const itemCount = Array.isArray(o.items) ? o.items.reduce((acc, it) => acc + (Number(it.quantity) || 1), 0) : 0;
        const ref = esc(o.order_number || o.id);
        const options = STATUSES.map(s => `<option value="${s}" ${o.order_status === s ? 'selected' : ''}>${s}</option>`).join('');

        return `
          <tr>
            <td><strong>${ref}</strong></td>
            <td>${dateStr}</td>
            <td>
              <div>${esc(o.customer?.name || 'Customer')}</div>
              <div style="font-size:0.75rem; color:var(--admin-text-muted);">${esc(o.customer?.phone || '')}</div>
            </td>
            <td>${itemCount} item(s)</td>
            <td><strong>₹${Number(o.total) || 0}</strong></td>
            <td><span class="status-badge ${esc(String(o.payment_status || '').toLowerCase())}">${esc(o.payment_status || '')}</span></td>
            <td>
              <select data-order="${ref}" class="js-order-status" style="padding:4px 8px; border-radius:4px; font-size:0.8125rem; font-family:inherit;">
                ${options}
              </select>
            </td>
            <td>
              <button class="btn-admin-action js-order-view" data-order="${ref}">View</button>
            </td>
          </tr>
        `;
      }).join('');

      tbody.querySelectorAll('.js-order-status').forEach(sel => {
        sel.addEventListener('change', () => this.updateOrderStatus(sel.getAttribute('data-order'), sel.value));
      });
      tbody.querySelectorAll('.js-order-view').forEach(btn => {
        btn.addEventListener('click', () => this.openOrderDetails(btn.getAttribute('data-order')));
      });
    },

    updateOrderStatus: async function (orderId, newStatus) {
      try {
        await this.api(`/api/admin/orders/${encodeURIComponent(orderId)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_status: newStatus })
        });
        const target = this.orders.find(o => o.order_number === orderId || o.id === orderId);
        if (target) target.order_status = newStatus;
      } catch (e) {
        alert(`Could not update order ${orderId}: ${e.message}`);
      }
      this.updateKPIs();
      this.renderOrders();
    },

    openOrderDetails: function (orderId) {
      const order = this.orders.find(o => o.order_number === orderId || o.id === orderId);
      if (!order) return;

      document.getElementById('modalOrderNumber').textContent = `Order ${order.order_number || order.id}`;
      const content = document.getElementById('modalOrderContent');
      if (!content) return;

      const a = order.shipping_address || {};
      const itemsHtml = (order.items || []).map(i => `
        <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #F3F4F6; font-size:0.875rem;">
          <div><strong>${esc(i.name)}</strong> (${esc(i.size || '')}) × ${Number(i.quantity) || 1}</div>
          <div>₹${Number(i.lineTotal) || (Number(i.unitPrice) * Number(i.quantity)) || 0}</div>
        </div>
      `).join('');

      content.innerHTML = `
        <div style="margin-bottom:16px;">
          <h4 style="margin:0 0 6px;">Customer & Delivery Details</h4>
          <div style="font-size:0.875rem; color:#4B5563; line-height:1.6;">
            <strong>Name:</strong> ${esc(order.customer?.name || 'Customer')}<br>
            <strong>Phone:</strong> ${esc(order.customer?.phone || '-')}<br>
            <strong>Email:</strong> ${esc(order.customer?.email || '-')}<br>
            <strong>Address:</strong> ${esc(a.street || '-')}, ${esc(a.city || '')} ${esc(a.state || '')} - ${esc(a.pincode || '')}
            ${a.landmark ? `<br><strong>Landmark:</strong> ${esc(a.landmark)}` : ''}
          </div>
        </div>

        <div style="margin-bottom:16px;">
          <h4 style="margin:0 0 6px;">Payment Information</h4>
          <div style="font-size:0.875rem; color:#4B5563; line-height:1.6;">
            <strong>Payment Status:</strong> <span class="status-badge ${esc(String(order.payment_status || '').toLowerCase())}">${esc(order.payment_status)}</span><br>
            <strong>Razorpay Order ID:</strong> ${esc(order.razorpay_order_id || 'N/A')}<br>
            <strong>Razorpay Payment ID:</strong> ${esc(order.razorpay_payment_id || 'N/A')}
          </div>
        </div>

        <div style="margin-bottom:16px;">
          <h4 style="margin:0 0 6px;">Order Items</h4>
          ${itemsHtml}
          <div style="display:flex; justify-content:space-between; margin-top:12px; font-size:1rem; font-weight:800;">
            <span>Total:</span>
            <span>₹${Number(order.total) || 0}</span>
          </div>
        </div>
      `;

      document.getElementById('orderDetailModal').style.display = 'flex';
    },

    closeModal: function () {
      document.getElementById('orderDetailModal').style.display = 'none';
    },

    renderProducts: function () {
      const tbody = document.getElementById('productsTableBody');
      if (!tbody || !window.HIPA_PRODUCTS) return;

      tbody.innerHTML = window.HIPA_PRODUCTS.map(p => {
        const variantsList = (p.variants || []).map(v => `${v.size} (₹${v.price})`).join(', ');
        return `
          <tr>
            <td>
              <div style="display:flex; align-items:center; gap:10px;">
                <img src="${p.image}" alt="${esc(p.name)}" style="width:36px; height:36px; object-fit:contain; border-radius:4px; background:#FAFAFA;">
                <div>
                  <strong>${esc(p.name)}</strong>
                  <div style="font-size:0.75rem; color:var(--admin-text-muted);">${esc(p.tamilName || '')}</div>
                </div>
              </div>
            </td>
            <td><span style="text-transform:capitalize;">${esc(p.categoryName || p.category)}</span></td>
            <td><span style="font-size:0.8125rem;">${variantsList}</span></td>
            <td><strong>₹${p.variants[0]?.price || 0}</strong></td>
            <td><span class="status-badge paid">In Stock</span></td>
            <td>
              <a href="product.html?slug=${encodeURIComponent(p.slug)}" target="_blank" rel="noopener" class="btn-admin-action">Preview</a>
            </td>
          </tr>
        `;
      }).join('');
    },

    renderB2B: function () {
      const tbody = document.getElementById('b2bTableBody');
      if (!tbody) return;

      if (!this.b2bEnquiries.length) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:32px; color:var(--admin-text-muted);">No B2B enquiries yet.</td></tr>`;
        return;
      }

      tbody.innerHTML = this.b2bEnquiries.map(b => {
        const dateStr = b.created_at ? new Date(b.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'Recent';
        const prods = Array.isArray(b.products) && b.products.length ? b.products.join(', ') : 'All Products';
        const waMsg = encodeURIComponent(`Hello ${b.fullName}, regarding your HIPA Masala commercial enquiry (${b.refCode})...`);
        const phoneDigits = String(b.phone || '').replace(/\D/g, '').slice(-10);

        return `
          <tr>
            <td><strong>${esc(b.refCode)}</strong></td>
            <td>${dateStr}</td>
            <td>
              <div><strong>${esc(b.companyName)}</strong></div>
              <div style="font-size:0.8125rem; color:var(--admin-text-muted);">${esc(b.fullName)} (${esc(b.phone)})</div>
            </td>
            <td>${esc(b.city || '-')}</td>
            <td><span class="status-badge shipped">${esc(b.businessType || 'Wholesale')}</span></td>
            <td>
              <div style="font-size:0.8125rem;"><strong>${esc(b.bulkRequirement)}</strong></div>
              <div style="font-size:0.75rem; color:var(--admin-text-muted);">${esc(prods)}</div>
            </td>
            <td><span class="status-badge new">${esc(b.status || 'new')}</span></td>
            <td>
              <a href="https://wa.me/91${phoneDigits}?text=${waMsg}" target="_blank" rel="noopener" class="btn-admin-action" style="background:#25D366; color:#FFF; border:none;">WhatsApp</a>
            </td>
          </tr>
        `;
      }).join('');
    },

    renderContact: function () {
      const tbody = document.getElementById('contactTableBody');
      if (!tbody) return;

      if (!this.contactMessages.length) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:32px; color:var(--admin-text-muted);">No customer support messages logged.</td></tr>`;
        return;
      }

      tbody.innerHTML = this.contactMessages.map(m => {
        const dateStr = m.created_at ? new Date(m.created_at).toLocaleDateString('en-IN') : 'Recent';
        return `
          <tr>
            <td>${dateStr}</td>
            <td><strong>${esc(m.name)}</strong></td>
            <td>${esc(m.email || '-')}<br><span style="font-size:0.75rem; color:var(--admin-text-muted);">${esc(m.phone || '')}</span></td>
            <td>${esc(m.subject || 'Customer Enquiry')}</td>
            <td style="white-space:pre-wrap;">${esc(m.message)}</td>
          </tr>
        `;
      }).join('');
    }
  };

  document.addEventListener('DOMContentLoaded', () => AdminApp.init());
  window.AdminApp = AdminApp;
})();

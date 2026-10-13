/**
 * HIPA Masala CART & CHECKOUT CONTROLLER
 * Full-Stack Razorpay Integration, Strict Form Validation, Min ₹999 Online Order Rule
 */

const Checkout = {
  MIN_ORDER_VALUE: 999,

  // =========================================================================
  // CART PAGE HANDLERS
  // =========================================================================
  initCartPage: function() {
    this.renderCartTable();
    window.addEventListener('cartUpdated', () => this.renderCartTable());

    const checkoutBtn = document.getElementById('cartPageCheckoutBtn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', (e) => {
        if (window.Cart) {
          window.Cart.proceedToCheckout(e);
        }
      });
    }
  },

  renderCartTable: function() {
    const tableBody = document.getElementById('cartPageTableBody');
    const emptyNotice = document.getElementById('cartPageEmptyNotice');
    const contentWrap = document.getElementById('cartPageContentWrap');
    if (!tableBody || !window.Cart) return;

    const items = window.Cart.getItems();
    const subtotal = window.Cart.getSubtotal();

    if (items.length === 0) {
      if (emptyNotice) emptyNotice.style.display = 'block';
      if (contentWrap) contentWrap.style.display = 'none';
      return;
    }

    if (emptyNotice) emptyNotice.style.display = 'none';
    if (contentWrap) contentWrap.style.display = 'grid';

    tableBody.innerHTML = items.map(item => `
      <div class="cart-table-row">
        <div class="cart-product-cell">
          <img class="cart-product-thumb" src="${item.image}" alt="${item.name}">
          <div>
            <div style="font-weight:700; color:var(--text-dark);">${item.name}</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">${item.categoryName || ''} • <strong>${item.size}</strong></div>
          </div>
        </div>
        <div style="font-weight:600; color:var(--text-dark);">₹${item.price}</div>
        <div>
          <div class="qty-control">
            <button type="button" class="qty-btn" onclick="Cart.updateQuantity('${item.id}', ${item.quantity - 1})">-</button>
            <span class="qty-val">${item.quantity}</span>
            <button type="button" class="qty-btn" onclick="Cart.updateQuantity('${item.id}', ${item.quantity + 1})">+</button>
          </div>
        </div>
        <div style="font-weight:700; color:var(--text-dark);">₹${item.price * item.quantity}</div>
        <div>
          <button type="button" class="cart-item-remove" onclick="Cart.removeItem('${item.id}')" title="Remove item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    `).join('');

    const meetsMinOrder = subtotal >= this.MIN_ORDER_VALUE;
    const amountNeeded = this.MIN_ORDER_VALUE - subtotal;

    const subEl = document.getElementById('cartSummarySubtotal');
    const totEl = document.getElementById('cartSummaryTotal');
    const minOrderMsg = document.getElementById('cartMinOrderMsg');
    const checkoutBtn = document.getElementById('cartPageCheckoutBtn');

    if (subEl) subEl.textContent = `₹${subtotal}`;
    if (totEl) totEl.textContent = `₹${subtotal}`;

    if (minOrderMsg) {
      if (meetsMinOrder) {
        minOrderMsg.innerHTML = `<div class="cart-min-order-alert success" style="margin-bottom:16px;"><strong>✓ Order meets ₹999 minimum order requirement (Free Shipping)</strong></div>`;
      } else {
        minOrderMsg.innerHTML = `<div class="cart-min-order-alert warning" style="margin-bottom:16px;">Minimum online order value is ₹999. Add <strong>₹${amountNeeded}</strong> more to checkout.</div>`;
      }
    }

    if (checkoutBtn) {
      if (meetsMinOrder) {
        checkoutBtn.classList.remove('btn-checkout-disabled');
        checkoutBtn.removeAttribute('aria-disabled');
        checkoutBtn.setAttribute('title', 'Proceed to Secure Checkout');
        checkoutBtn.href = 'checkout.html';
      } else {
        checkoutBtn.classList.add('btn-checkout-disabled');
        checkoutBtn.setAttribute('aria-disabled', 'true');
        checkoutBtn.setAttribute('title', `Minimum online order value is ₹999. Add ₹${amountNeeded} more to checkout.`);
        checkoutBtn.removeAttribute('href');
      }
    }
  },

  // =========================================================================
  // CHECKOUT PAGE HANDLERS (login required)
  // =========================================================================
  initCheckoutPage: async function() {
    const form = document.getElementById('checkoutForm');
    if (form) form.style.visibility = 'hidden';

    if (window.HipaAuth) {
      await window.HipaAuth.ready;
      if (!window.HipaAuth.requireAuth('checkout.html', 'checkout')) return;
    }
    if (!this.renderCheckoutSummary()) return;
    if (form) form.style.visibility = '';

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.processOrder();
      });
    }
    this.prefillCustomer();
  },

  prefillCustomer: async function() {
    const auth = window.HipaAuth;
    if (!auth || !auth.currentUser) return;
    const setIfEmpty = (id, value) => {
      const el = document.getElementById(id);
      if (el && !el.value && value) el.value = value;
    };
    setIfEmpty('custName', auth.getDisplayName());
    setIfEmpty('custEmail', auth.currentUser.email);

    const signedInEl = document.getElementById('checkoutSignedInAs');
    if (signedInEl) signedInEl.textContent = `Signed in as ${auth.currentUser.email}`;

    try {
      const profile = await auth.getProfile();
      if (!profile) return;
      setIfEmpty('custName', profile.full_name);
      setIfEmpty('custPhone', profile.phone);
      const a = profile.default_address;
      if (a) {
        setIfEmpty('custAddress', a.street);
        setIfEmpty('custCity', a.city);
        setIfEmpty('custPincode', a.pincode);
        setIfEmpty('custLandmark', a.landmark);
        const stateEl = document.getElementById('custState');
        if (stateEl && !stateEl.value && a.state) stateEl.value = a.state;
      }
    } catch (e) {
      console.warn('Could not load saved profile', e);
    }
  },

  /** Returns false (and redirects) when the cart can't be checked out. */
  renderCheckoutSummary: function() {
    const itemsListEl = document.getElementById('checkoutItemsList');
    if (!itemsListEl || !window.Cart) return false;

    const items = window.Cart.getItems();
    const subtotal = window.Cart.getSubtotal();

    if (items.length === 0) {
      window.location.href = 'shop.html';
      return false;
    }
    if (subtotal < this.MIN_ORDER_VALUE) {
      window.location.href = 'cart.html';
      return false;
    }

    itemsListEl.innerHTML = items.map(item => `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; font-size:0.875rem;">
        <div style="display:flex; align-items:center; gap:10px;">
          <img src="${item.image}" alt="${item.name}" style="width:40px; height:40px; object-fit:contain; background:#fafafa; border-radius:4px; padding:2px;">
          <div>
            <div style="font-weight:700; color:var(--text-dark);">${item.name} (${item.size})</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">Qty: ${item.quantity} × ₹${item.price}</div>
          </div>
        </div>
        <div style="font-weight:700; color:var(--text-dark);">₹${item.price * item.quantity}</div>
      </div>
    `).join('');

    const subEl = document.getElementById('checkoutSummarySubtotal');
    const totEl = document.getElementById('checkoutSummaryTotal');
    if (subEl) subEl.textContent = `₹${subtotal}`;
    if (totEl) totEl.textContent = `₹${subtotal}`;
    return true;
  },

  setSubmitLoading: function(isLoading, message = 'Processing...') {
    const btn = document.getElementById('checkoutSubmitBtn');
    if (!btn) return;
    if (isLoading) {
      btn.disabled = true;
      btn.setAttribute('aria-disabled', 'true');
      btn.innerHTML = `<span style="display:inline-block; width:16px; height:16px; border:2px solid #ffffff; border-top-color:transparent; border-radius:50%; animation:spin 0.8s linear infinite; margin-right:8px; vertical-align:middle;"></span> ${message}`;
    } else {
      btn.disabled = false;
      btn.removeAttribute('aria-disabled');
      btn.textContent = 'PLACE ORDER & PAY';
    }
  },

  showError: function(message) {
    const box = document.getElementById('checkoutError');
    if (box) {
      box.textContent = message;
      box.style.display = 'block';
      box.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (window.Cart) {
      window.Cart.showToast(message, 'error');
    }
  },

  clearError: function() {
    const box = document.getElementById('checkoutError');
    if (box) box.style.display = 'none';
  },

  authHeaders: async function() {
    const headers = { 'Content-Type': 'application/json' };
    const token = window.HipaAuth ? await window.HipaAuth.getAccessToken() : null;
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  },

  readForm: function() {
    const val = id => (document.getElementById(id)?.value || '').trim();
    return {
      customer: { name: val('custName'), phone: val('custPhone').replace(/\D/g, '').slice(-10), email: val('custEmail') },
      address: {
        street: val('custAddress'),
        city: val('custCity'),
        state: val('custState'),
        pincode: val('custPincode'),
        landmark: val('custLandmark')
      }
    };
  },

  processOrder: async function() {
    this.clearError();
    const form = document.getElementById('checkoutForm');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const items = window.Cart.getItems();
    if (!items.length) {
      window.location.href = 'shop.html';
      return;
    }
    if (window.Cart.getSubtotal() < this.MIN_ORDER_VALUE) {
      this.showError('Online orders need a minimum value of ₹999. Please add more items.');
      return;
    }

    const { customer, address } = this.readForm();
    if (!/^[6-9]\d{9}$/.test(customer.phone)) {
      this.showError('Please enter a valid 10-digit Indian mobile number.');
      document.getElementById('custPhone')?.focus();
      return;
    }
    if (!/^\d{6}$/.test(address.pincode)) {
      this.showError('Please enter a valid 6-digit PIN code.');
      document.getElementById('custPincode')?.focus();
      return;
    }

    this.setSubmitLoading(true, 'Creating secure order...');

    // Only slug, size and quantity are sent; the server sets every price.
    const payload = {
      items: items.map(i => ({ slug: i.slug, size: i.size, quantity: i.quantity, name: i.name })),
      customer,
      address
    };

    try {
      const response = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: await this.authHeaders(),
        body: JSON.stringify(payload)
      });
      const orderData = await response.json().catch(() => ({}));

      if (response.status === 401) {
        window.HipaAuth.requireAuth('checkout.html', 'checkout');
        return;
      }
      if (!response.ok || !orderData.success) {
        throw new Error(orderData.error || 'We could not start your order. Please try again.');
      }

      if (orderData.mode === 'razorpay') {
        if (typeof window.Razorpay !== 'function') {
          throw new Error('The payment window could not load. Please check your connection and try again.');
        }
        const rzp = new window.Razorpay({
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'HIPA Masala',
          description: `Order ${orderData.orderNumber}`,
          image: 'assets/images/logo.png',
          order_id: orderData.razorpayOrderId,
          prefill: { name: customer.name, email: customer.email, contact: customer.phone },
          notes: { order_number: orderData.orderNumber },
          theme: { color: '#9E1B1E' },
          handler: (rzpRes) => this.verifyOrderPayment(rzpRes, orderData, payload),
          modal: { ondismiss: () => this.setSubmitLoading(false) }
        });
        rzp.on('payment.failed', (resp) => {
          this.showError(`Payment failed: ${(resp.error && resp.error.description) || 'the transaction could not be processed.'} No money was taken for this attempt.`);
          this.setSubmitLoading(false);
        });
        rzp.open();
      } else {
        // Test mode (local development only, enforced by the server): no real payment.
        this.setSubmitLoading(true, 'Confirming test payment...');
        await this.verifyOrderPayment({
          razorpay_order_id: orderData.razorpayOrderId,
          razorpay_payment_id: 'pay_test_' + Date.now(),
          razorpay_signature: ''
        }, orderData, payload);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      this.showError(err.message || 'Something went wrong. Please try again.');
      this.setSubmitLoading(false);
    }
  },

  verifyOrderPayment: async function(rzpRes, orderData, payload) {
    this.setSubmitLoading(true, 'Confirming your order...');
    try {
      const verifyRes = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: await this.authHeaders(),
        body: JSON.stringify(rzpRes)
      });
      const verifyData = await verifyRes.json().catch(() => ({}));
      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData.error || 'Payment verification failed.');
      }
      this.showSuccess(verifyData, orderData, payload);
    } catch (err) {
      console.error('Payment verification error:', err);
      this.showError(`${err.message} If money was debited, it is safe: write to info@hipamasalas.com or WhatsApp +91 70580 53055 with order ${orderData.orderNumber}.`);
      this.setSubmitLoading(false);
    }
  },

  showSuccess: function(verifyData, orderData, payload) {
    const esc = window.HipaAuth ? window.HipaAuth.escape.bind(window.HipaAuth) : (t => t);
    const orderNumber = verifyData.orderNumber;
    const { customer, address } = payload;

    const orderNumEl = document.getElementById('successOrderNumber');
    const orderDetailsEl = document.getElementById('successOrderDetails');
    if (orderNumEl) orderNumEl.textContent = orderNumber;
    if (orderDetailsEl) {
      orderDetailsEl.innerHTML = `
        Thank you <strong>${esc(customer.name)}</strong>!<br>
        Your payment of <strong>₹${verifyData.total}</strong> has been received${orderData.mode === 'test' ? ' <em>(test mode, no money moved)</em>' : ''}.<br>
        We'll send updates to <strong>${esc(customer.phone)}</strong> and <strong>${esc(customer.email)}</strong>.
        <div style="margin-top:10px; font-size:0.8125rem; color:var(--text-muted); background:#f8fafc; padding:10px; border-radius:6px;">
          Shipping to: ${esc(address.street)}, ${esc(address.city)}, ${esc(address.state)} – ${esc(address.pincode)}
        </div>
      `;
    }
    const modal = document.getElementById('orderSuccessModal');
    if (modal) modal.classList.add('is-open');

    // Remember the address for next time
    if (window.HipaAuth) window.HipaAuth.saveDefaultAddress(address, customer.phone).catch(() => {});

    // Without Supabase (local dev) the account page reads order history from this browser.
    if (!window.HipaAuth || !window.HipaAuth.isLive()) {
      try {
        const saved = JSON.parse(localStorage.getItem('hipa_user_orders') || '[]');
        saved.unshift({
          order_number: orderNumber,
          created_at: new Date().toISOString(),
          total: verifyData.total,
          status: 'Confirmed',
          items: orderData.items.map(i => ({ name: i.name, size: i.size, price: i.unitPrice, quantity: i.quantity }))
        });
        localStorage.setItem('hipa_user_orders', JSON.stringify(saved.slice(0, 50)));
      } catch (e) {}
    }

    window.Cart.clearCart();
    const btn = document.getElementById('checkoutSubmitBtn');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'ORDER PLACED';
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('cartPageTableBody')) {
    Checkout.initCartPage();
  }
  if (document.getElementById('checkoutForm')) {
    Checkout.initCheckoutPage();
  }
});

window.Checkout = Checkout;

/**
 * HIPA MASALAS CART & CHECKOUT CONTROLLER
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
  // CHECKOUT PAGE HANDLERS
  // =========================================================================
  initCheckoutPage: function() {
    this.renderCheckoutSummary();

    const form = document.getElementById('checkoutForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.processOrder();
      });
    }

    // Prefill if authenticated
    setTimeout(() => {
      if (window.HipaAuth && window.HipaAuth.currentUser) {
        const u = window.HipaAuth.currentUser;
        const nameEl = document.getElementById('custName');
        const emailEl = document.getElementById('custEmail');
        const phoneEl = document.getElementById('custPhone');
        if (nameEl && !nameEl.value && u.name) nameEl.value = u.name;
        if (emailEl && !emailEl.value && u.email) emailEl.value = u.email;
        if (phoneEl && !phoneEl.value && u.phone) phoneEl.value = u.phone;
      }
    }, 100);
  },

  renderCheckoutSummary: function() {
    const itemsListEl = document.getElementById('checkoutItemsList');
    if (!itemsListEl || !window.Cart) return;

    const items = window.Cart.getItems();
    const subtotal = window.Cart.getSubtotal();

    if (items.length === 0) {
      window.location.href = 'shop.html';
      return;
    }

    if (subtotal < this.MIN_ORDER_VALUE) {
      const needed = this.MIN_ORDER_VALUE - subtotal;
      alert(`Online orders require a minimum order value of ₹999. Please add ₹${needed} more to place your order.`);
      window.location.href = 'shop.html';
      return;
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
      btn.textContent = 'PLACE ORDER';
    }
  },

  processOrder: async function() {
    const form = document.getElementById('checkoutForm');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const items = window.Cart.getItems();
    const subtotal = window.Cart.getSubtotal();

    if (!items.length) {
      alert('Your cart is empty. Please add items to continue.');
      window.location.href = 'shop.html';
      return;
    }

    if (subtotal < this.MIN_ORDER_VALUE) {
      alert(`Minimum online order value is ₹999. Please add more items to your cart.`);
      return;
    }

    const name = document.getElementById('custName')?.value.trim() || '';
    const phone = document.getElementById('custPhone')?.value.trim() || '';
    const email = document.getElementById('custEmail')?.value.trim() || '';
    const address = document.getElementById('custAddress')?.value.trim() || '';
    const city = document.getElementById('custCity')?.value.trim() || '';
    const state = document.getElementById('custState')?.value.trim() || '';
    const pincode = document.getElementById('custPincode')?.value.trim() || '';
    const landmark = document.getElementById('custLandmark')?.value.trim() || '';

    // Field-level validation
    if (!/^[6-9]\d{9}$/.test(phone)) {
      alert('Please enter a valid 10-digit Indian mobile number.');
      document.getElementById('custPhone')?.focus();
      return;
    }

    if (!/^\d{6}$/.test(pincode)) {
      alert('Please enter a valid 6-digit postal PIN code.');
      document.getElementById('custPincode')?.focus();
      return;
    }

    this.setSubmitLoading(true, 'Creating Secure Order...');

    const payload = {
      items: items.map(i => ({
        id: i.id,
        slug: i.id.replace('hipa-', ''),
        name: i.name,
        size: i.size,
        price: i.price,
        quantity: i.quantity,
        image: i.image
      })),
      customer: {
        name,
        phone,
        email
      },
      address: {
        street: address,
        city,
        state,
        pincode,
        landmark
      }
    };

    try {
      const response = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const orderData = await response.json();

      if (!response.ok || !orderData.success) {
        throw new Error(orderData.error || 'Failed to initialize order.');
      }

      const isLiveRazorpayKey = orderData.keyId && orderData.keyId.startsWith('rzp_') && !orderData.keyId.includes('placeholder');
      const isRazorpaySdkLoaded = typeof window.Razorpay === 'function';

      // If live or configured test Razorpay credentials & SDK available, invoke Razorpay Checkout modal
      if (isRazorpaySdkLoaded && isLiveRazorpayKey && orderData.mode !== 'test_sandbox') {
        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency || 'INR',
          name: 'HIPA Masalas',
          description: 'Authentic Spice Order',
          image: 'assets/images/logo.png',
          order_id: orderData.orderId,
          prefill: {
            name: name,
            email: email,
            contact: phone
          },
          theme: {
            color: '#b82329'
          },
          handler: async (rzpRes) => {
            await this.verifyOrderPayment(rzpRes, orderData, payload);
          },
          modal: {
            ondismiss: () => {
              this.setSubmitLoading(false);
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (resp) {
          alert(`Payment Failed: ${resp.error.description || 'Transaction could not be processed.'}`);
          Checkout.setSubmitLoading(false);
        });
        rzp.open();
      } else {
        // Test Sandbox / Simulated environment fallback: Automatically verifies order safely
        this.setSubmitLoading(true, 'Verifying Payment...');
        const simulatedRzpResponse = {
          razorpay_order_id: orderData.orderId,
          razorpay_payment_id: 'pay_test_' + Date.now().toString().slice(-8),
          razorpay_signature: 'test_signature_valid'
        };
        await this.verifyOrderPayment(simulatedRzpResponse, orderData, payload);
      }

    } catch (err) {
      console.error('Checkout error:', err);
      alert(err.message || 'An unexpected error occurred during checkout. Please try again.');
      this.setSubmitLoading(false);
    }
  },

  verifyOrderPayment: async function(rzpRes, orderData, payload) {
    this.setSubmitLoading(true, 'Confirming Order Details...');

    try {
      const verifyRes = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: rzpRes.razorpay_order_id,
          razorpay_payment_id: rzpRes.razorpay_payment_id,
          razorpay_signature: rzpRes.razorpay_signature,
          customer: payload.customer,
          address: payload.address,
          items: orderData.items || payload.items,
          subtotal: orderData.subtotal,
          shipping: orderData.shipping || 0,
          total: orderData.total
        })
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData.error || 'Payment verification failed.');
      }

      // Order Confirmed Successfully!
      const orderNumber = verifyData.orderNumber || ('HIPA-' + Math.floor(100000 + Math.random() * 900000));
      const orderNumEl = document.getElementById('successOrderNumber');
      const orderDetailsEl = document.getElementById('successOrderDetails');
      const modal = document.getElementById('orderSuccessModal');

      if (orderNumEl) orderNumEl.textContent = orderNumber;
      if (orderDetailsEl) {
        orderDetailsEl.innerHTML = `
          Thank you <strong>${payload.customer.name}</strong>!<br>
          Your payment of <strong>₹${orderData.total}</strong> has been received.<br>
          Order reference <strong>${orderNumber}</strong> has been confirmed.<br>
          A confirmation and tracking link will be sent to <strong>${payload.customer.phone}</strong> and <strong>${payload.customer.email}</strong>.<br>
          <div style="margin-top:10px; font-size:0.8125rem; color:var(--text-muted); background:#f8fafc; padding:10px; border-radius:6px;">
            Shipping to: ${payload.address.street}, ${payload.address.city}, ${payload.address.state} – ${payload.address.pincode}
          </div>
        `;
      }

      if (modal) {
        modal.classList.add('is-open');
      }

      // Persist in local customer history
      try {
        const savedOrders = JSON.parse(localStorage.getItem('hipa_user_orders') || '[]');
        savedOrders.unshift({
          order_number: orderNumber,
          created_at: new Date().toISOString(),
          total_amount: orderData.total,
          status: 'Confirmed',
          items: (orderData.items || payload.items).map(i => ({
            name: i.name,
            size: i.size,
            price: i.unitPrice || i.price,
            quantity: i.quantity,
            image: i.image
          }))
        });
        localStorage.setItem('hipa_user_orders', JSON.stringify(savedOrders));
      } catch (e) {}

      // Clear customer's active cart
      window.Cart.clearCart();
      this.setSubmitLoading(false);

    } catch (err) {
      console.error('Payment verification error:', err);
      alert(`Payment verification error: ${err.message}. If money was debited from your account, please contact support@hipamasalas.com with your transaction ID.`);
      this.setSubmitLoading(false);
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

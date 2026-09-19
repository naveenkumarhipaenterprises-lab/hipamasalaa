/**
 * HIPA MASALA CART & CHECKOUT CONTROLLER
 * Minimum ₹999 Online Order Enforcement, Form Validation, Order Processing
 */

const Checkout = {
  MIN_ORDER_VALUE: 999,

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
            <div style="font-size:0.75rem; color:var(--text-muted);">${item.categoryName} • <strong>${item.size}</strong></div>
          </div>
        </div>
        <div style="font-weight:600; color:var(--text-dark);">₹${item.price}</div>
        <div>
          <div class="qty-control">
            <button class="qty-btn" onclick="Cart.updateQuantity('${item.id}', ${item.quantity - 1})">-</button>
            <span class="qty-val">${item.quantity}</span>
            <button class="qty-btn" onclick="Cart.updateQuantity('${item.id}', ${item.quantity + 1})">+</button>
          </div>
        </div>
        <div style="font-weight:700; color:var(--text-dark);">₹${item.price * item.quantity}</div>
        <div>
          <button class="cart-item-remove" onclick="Cart.removeItem('${item.id}')" title="Remove item">
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
        minOrderMsg.innerHTML = `<div class="cart-min-order-alert success" style="margin-bottom:16px;"><strong>✓ Order meets ₹999 minimum order requirement</strong></div>`;
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

  initCheckoutPage: function() {
    this.renderCheckoutSummary();

    const form = document.getElementById('checkoutForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.processOrder();
      });
    }
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

  processOrder: function() {
    const form = document.getElementById('checkoutForm');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const subtotal = window.Cart.getSubtotal();
    if (subtotal < this.MIN_ORDER_VALUE) {
      alert(`Minimum online order value is ₹999. Please add more items to your cart.`);
      return;
    }

    const orderRef = 'HIPA-' + Math.floor(100000 + Math.random() * 900000);
    const name = document.getElementById('custName')?.value || 'Valued Customer';
    const email = document.getElementById('custEmail')?.value || '';
    const phone = document.getElementById('custPhone')?.value || '';
    const items = window.Cart.getItems();
    const total = document.getElementById('checkoutSummaryTotal')?.textContent || '₹0';

    const orderNumEl = document.getElementById('successOrderNumber');
    const orderDetailsEl = document.getElementById('successOrderDetails');
    const modal = document.getElementById('orderSuccessModal');

    if (orderNumEl) orderNumEl.textContent = orderRef;
    if (orderDetailsEl) {
      orderDetailsEl.innerHTML = `
        Thank you <strong>${name}</strong>!<br>
        Your order of <strong>${items.length} item(s)</strong> (${total}) has been placed successfully.<br>
        A confirmation has been prepared for <strong>${phone}</strong> / <strong>${email}</strong>.
      `;
    }

    if (modal) {
      modal.classList.add('is-open');
    }

    window.Cart.clearCart();
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

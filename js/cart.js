/**
 * HIPA MASALA E-COMMERCE CART ENGINE
 * LocalStorage-backed cart state, ₹999 Minimum Online Order Value enforcement, Drawer UI
 */

const Cart = {
  STORAGE_KEY: 'hipa_masala_cart_v2',
  MIN_ORDER_VALUE: 999,

  getItems: function() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error loading cart', e);
      return [];
    }
  },

  saveItems: function(items) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
      this.updateBadges();
      this.renderDrawer();
      window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { items } }));
    } catch (e) {
      console.error('Error saving cart', e);
    }
  },

  addItem: function(productSlug, variantSize, quantity = 1, openDrawer = true) {
    if (!window.HIPA_PRODUCTS) return;
    const product = window.HIPA_PRODUCTS.find(p => p.slug === productSlug || p.id === productSlug);
    if (!product) return;

    const variant = product.variants.find(v => v.size === variantSize) || product.variants[0];
    const items = this.getItems();
    const existingIndex = items.findIndex(item => item.slug === product.slug && item.size === variant.size);

    if (existingIndex > -1) {
      items[existingIndex].quantity += quantity;
    } else {
      items.push({
        id: `${product.slug}_${variant.size}`,
        slug: product.slug,
        name: product.name,
        image: product.image,
        categoryName: product.categoryName,
        size: variant.size,
        price: variant.price,
        quantity: quantity
      });
    }

    this.saveItems(items);
    this.showToast(`Added ${product.name} (${variant.size}) to cart!`);
    if (openDrawer) {
      this.openDrawer();
    }
  },

  buyNow: function(productSlug, variantSize, quantity = 1) {
    this.addItem(productSlug, variantSize, quantity, false);
    window.location.href = 'checkout.html';
  },

  updateQuantity: function(itemId, newQty) {
    let items = this.getItems();
    if (newQty <= 0) {
      items = items.filter(item => item.id !== itemId);
    } else {
      const item = items.find(i => i.id === itemId);
      if (item) item.quantity = newQty;
    }
    this.saveItems(items);
  },

  removeItem: function(itemId) {
    const items = this.getItems().filter(item => item.id !== itemId);
    this.saveItems(items);
    this.showToast('Item removed from cart');
  },

  clearCart: function() {
    this.saveItems([]);
  },

  getCount: function() {
    const items = this.getItems();
    return items.reduce((total, item) => total + item.quantity, 0);
  },

  getSubtotal: function() {
    const items = this.getItems();
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  },

  updateBadges: function() {
    const count = this.getCount();
    document.querySelectorAll('.cart-count-badge').forEach(badge => {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    });
  },

  openDrawer: function() {
    const drawer = document.getElementById('cartDrawer');
    const overlay = document.getElementById('cartBackdrop');
    if (drawer) drawer.classList.add('is-open');
    if (overlay) overlay.classList.add('is-active');
    document.body.style.overflow = 'hidden';
    this.renderDrawer();
  },

  closeDrawer: function() {
    const drawer = document.getElementById('cartDrawer');
    const overlay = document.getElementById('cartBackdrop');
    if (drawer) drawer.classList.remove('is-open');
    if (overlay) overlay.classList.remove('is-active');
    document.body.style.overflow = '';
  },

  renderDrawer: function() {
    const bodyEl = document.getElementById('cartDrawerBody');
    const footerEl = document.getElementById('cartDrawerFooter');
    if (!bodyEl) return;

    const items = this.getItems();
    const subtotal = this.getSubtotal();

    if (items.length === 0) {
      bodyEl.innerHTML = `
        <div class="cart-empty-state">
          <svg class="cart-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
          <h4 style="font-size:1.1rem; color:var(--text-dark); margin:0;">Your shopping cart is empty</h4>
          <p style="font-size:0.875rem; color:var(--text-muted); margin:0;">Explore HIPA authentic spice powders and add fresh blends to your cart.</p>
          <div style="font-size:0.75rem; color:var(--text-muted); background:var(--bg-light); padding:8px 12px; border-radius:4px;">
            ℹ️ Online orders accepted for orders above ₹999.
          </div>
          <a href="shop.html" class="btn btn-primary btn-sm" onclick="Cart.closeDrawer()">Explore Products</a>
        </div>
      `;
      if (footerEl) footerEl.style.display = 'none';
      return;
    }

    if (footerEl) footerEl.style.display = 'block';

    const meetsMinOrder = subtotal >= this.MIN_ORDER_VALUE;
    const amountNeeded = this.MIN_ORDER_VALUE - subtotal;
    const progressPercent = Math.min(100, Math.round((subtotal / this.MIN_ORDER_VALUE) * 100));

    let itemsHtml = items.map(item => `
      <div class="cart-item">
        <div class="cart-item-img-wrap">
          <img class="cart-item-img" src="${item.image}" alt="${item.name}">
        </div>
        <div class="cart-item-info">
          <div class="cart-item-title">${item.name}</div>
          <div class="cart-item-variant">Pack: <strong>${item.size}</strong> • ₹${item.price}</div>
          <div class="cart-item-bottom">
            <div class="qty-control">
              <button class="qty-btn" onclick="Cart.updateQuantity('${item.id}', ${item.quantity - 1})" aria-label="Decrease quantity">-</button>
              <span class="qty-val">${item.quantity}</span>
              <button class="qty-btn" onclick="Cart.updateQuantity('${item.id}', ${item.quantity + 1})" aria-label="Increase quantity">+</button>
            </div>
            <span class="cart-item-price">₹${item.price * item.quantity}</span>
          </div>
        </div>
        <button class="cart-item-remove" onclick="Cart.removeItem('${item.id}')" aria-label="Remove item">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    `).join('');

    bodyEl.innerHTML = `
      <div class="cart-min-order-alert ${meetsMinOrder ? 'success' : 'warning'}">
        ${meetsMinOrder 
          ? `<strong>✓ Your order meets the minimum online order value of ₹999.</strong>`
          : `Minimum online order value is <strong>₹999</strong>. Add <strong>₹${amountNeeded}</strong> more to place your online order.`}
        <div class="min-order-progress-bar">
          <div class="min-order-progress-fill ${meetsMinOrder ? 'complete' : ''}" style="width:${progressPercent}%;"></div>
        </div>
      </div>
      <div class="cart-items-list">${itemsHtml}</div>
    `;

    const subtotalDisplay = document.getElementById('drawerSubtotal');
    if (subtotalDisplay) subtotalDisplay.textContent = `₹${subtotal}`;

    const checkoutBtn = document.getElementById('drawerCheckoutBtn');
    if (checkoutBtn) {
      if (meetsMinOrder) {
        checkoutBtn.classList.remove('btn-checkout-disabled');
        checkoutBtn.removeAttribute('aria-disabled');
        checkoutBtn.href = 'checkout.html';
      } else {
        checkoutBtn.classList.add('btn-checkout-disabled');
        checkoutBtn.setAttribute('aria-disabled', 'true');
        checkoutBtn.removeAttribute('href');
      }
    }
  },

  showToast: function(message) {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast toast-success is-visible';
    toast.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#25D366" stroke-width="2.2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.remove('is-visible');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  init: function() {
    this.updateBadges();

    // Bind triggers
    document.querySelectorAll('.js-cart-trigger').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.openDrawer();
      });
    });

    const closeBtn = document.getElementById('cartDrawerClose');
    if (closeBtn) closeBtn.addEventListener('click', () => this.closeDrawer());

    const backdrop = document.getElementById('cartBackdrop');
    if (backdrop) backdrop.addEventListener('click', () => this.closeDrawer());
  }
};

document.addEventListener('DOMContentLoaded', () => Cart.init());
window.Cart = Cart;

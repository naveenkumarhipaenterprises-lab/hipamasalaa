/**
 * HIPA MASALA PRODUCT DETAIL PAGE (PDP) CONTROLLER
 * Loads product by slug/id, controls variant pack size, quantity, specs tabs, and buy now
 */

const ProductPage = {
  currentProduct: null,
  selectedSize: '',
  currentQty: 1,

  init: function() {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug') || params.get('id') || 'sambar-powder';

    if (!window.HipaStore) return;
    this.currentProduct = window.HipaStore.getProductBySlug(slug) || window.HipaStore.getAllProducts()[0];
    this.selectedSize = this.currentProduct.variants[0].size;
    this.currentQty = 1;

    this.render();
    this.bindEvents();
  },

  render: function() {
    const p = this.currentProduct;
    if (!p) return;

    // Document Title & Meta
    document.title = `${p.name} (${p.tamilName || ''}) | Buy Online | HIPA Masala`;

    // Breadcrumbs
    const bcCat = document.getElementById('pdpBreadcrumbCategory');
    const bcTitle = document.getElementById('pdpBreadcrumbTitle');
    if (bcCat) {
      bcCat.textContent = p.categoryName;
      bcCat.href = `shop.html?category=${p.category}`;
    }
    if (bcTitle) bcTitle.textContent = p.name;

    // Images
    const imgEl = document.getElementById('pdpMainImg');
    if (imgEl) {
      imgEl.src = p.image;
      imgEl.alt = p.imageAlt;
    }

    // Product Header
    const catBadge = document.getElementById('pdpCategoryBadge');
    if (catBadge) catBadge.textContent = p.categoryName;

    const titleEl = document.getElementById('pdpTitle');
    if (titleEl) titleEl.textContent = p.name;

    const tamilEl = document.getElementById('pdpTamilName');
    if (tamilEl) tamilEl.textContent = p.tamilName || '';

    const ratingCount = document.getElementById('pdpReviewCount');
    if (ratingCount) ratingCount.textContent = `(${p.reviewCount} customer reviews)`;

    // Description
    const descEl = document.getElementById('pdpDesc');
    if (descEl) descEl.textContent = p.description;

    // Pack Size Buttons
    this.renderSizeOptions();

    // Price updates
    this.updatePriceDisplay();

    // Specification Tabs Content
    this.renderTabs();

    // Related Products Grid
    this.renderRelated();

    // Update Wishlist button active state
    this.updateWishlistButtonState();
  },

  renderSizeOptions: function() {
    const container = document.getElementById('pdpSizeOptions');
    if (!container) return;

    container.innerHTML = this.currentProduct.variants.map(v => `
      <button 
        type="button" 
        class="pdp-size-btn ${v.size === this.selectedSize ? 'is-active' : ''}" 
        onclick="ProductPage.selectSize('${v.size}')">
        ${v.size}
      </button>
    `).join('');
  },

  selectSize: function(size) {
    this.selectedSize = size;
    this.renderSizeOptions();
    this.updatePriceDisplay();
  },

  updatePriceDisplay: function() {
    const variant = this.currentProduct.variants.find(v => v.size === this.selectedSize) || this.currentProduct.variants[0];
    const discount = Math.round(((variant.mrp - variant.price) / variant.mrp) * 100);

    const priceEl = document.getElementById('pdpPrice');
    const mrpEl = document.getElementById('pdpMrp');
    const discountEl = document.getElementById('pdpDiscount');

    if (priceEl) priceEl.textContent = `₹${variant.price}`;
    if (mrpEl) mrpEl.textContent = `₹${variant.mrp}`;
    if (discountEl) discountEl.textContent = `${discount}% OFF`;
  },

  updateQty: function(delta) {
    this.currentQty = Math.max(1, this.currentQty + delta);
    const qtyEl = document.getElementById('pdpQtyVal');
    if (qtyEl) qtyEl.textContent = this.currentQty;
  },

  addToCart: function() {
    if (window.Cart && this.currentProduct) {
      window.Cart.addItem(this.currentProduct.slug, this.selectedSize, this.currentQty);
    }
  },

  buyNow: function() {
    if (window.Cart && this.currentProduct) {
      window.Cart.buyNow(this.currentProduct.slug, this.selectedSize, this.currentQty);
    }
  },

  renderTabs: function() {
    const p = this.currentProduct;

    // Tab 1: Full Description
    const tabDesc = document.getElementById('tabFullDesc');
    if (tabDesc) {
      tabDesc.innerHTML = `
        <p style="margin-bottom:16px;">${p.description}</p>
        <h4 style="font-size:1.05rem; font-weight:700; color:var(--text-dark); margin-bottom:12px;">Key Highlights</h4>
        <ul style="padding-left:20px; display:flex; flex-direction:column; gap:8px;">
          ${p.features.map(f => `<li>${f}</li>`).join('')}
        </ul>
      `;
    }

    // Tab 2: Ingredients
    const tabIng = document.getElementById('tabIngredients');
    if (tabIng) {
      tabIng.innerHTML = `
        <ul class="ingredients-list">
          ${p.ingredients.map(ing => `
            <li>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span><strong>${ing}</strong></span>
            </li>
          `).join('')}
        </ul>
      `;
    }

    // Tab 3: How to Use
    const tabUse = document.getElementById('tabHowToUse');
    if (tabUse) {
      tabUse.innerHTML = `
        <ul class="how-to-use-list">
          ${p.howToUse.map((step, idx) => `
            <li>
              <span style="display:inline-flex; align-items:center; justify-content:center; width:22px; height:22px; border-radius:50%; background:var(--color-primary); color:#fff; font-size:0.75rem; font-weight:700; flex-shrink:0;">${idx + 1}</span>
              <span>${step}</span>
            </li>
          `).join('')}
        </ul>
      `;
    }

    // Tab 4: Storage
    const tabStorage = document.getElementById('tabStorage');
    if (tabStorage) {
      tabStorage.innerHTML = `
        <div style="background-color:var(--bg-light); border:1px solid var(--border-color); border-radius:var(--radius-sm); padding:20px;">
          <h4 style="font-size:1rem; font-weight:700; color:var(--text-dark); margin-bottom:8px;">Storage & Shelf Life</h4>
          <p style="margin-bottom:12px;">${p.storageInfo}</p>
          <div style="font-size:0.875rem; color:var(--text-muted);">
            • <strong>Shelf Life:</strong> 9–12 months from manufacturing date.<br>
            • <strong>Packaging:</strong> Multi-layer aroma-barrier food-grade foil pouch.
          </div>
        </div>
      `;
    }
  },

  renderRelated: function() {
    const relatedContainer = document.getElementById('pdpRelatedGrid');
    if (!relatedContainer || !window.HipaStore) return;

    const related = window.HipaStore.getRelatedProducts(this.currentProduct.slug, 4);
    relatedContainer.innerHTML = related.map(p => window.App ? window.App.renderProductCard(p) : '').join('');
  },

  updateWishlistButtonState: function() {
    const btn = document.getElementById('pdpWishlistBtn');
    if (!btn || !this.currentProduct || !window.Wishlist) return;
    const isSaved = window.Wishlist.has(this.currentProduct.slug);
    btn.classList.toggle('is-in-wishlist', isSaved);
    btn.setAttribute('title', isSaved ? 'Remove from Wishlist' : 'Add to Wishlist');
    btn.innerHTML = `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="${isSaved ? '#DC2626' : 'none'}" stroke="${isSaved ? '#DC2626' : 'currentColor'}" stroke-width="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
      </svg>
    `;
  },

  toggleWishlist: function(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!this.currentProduct || !window.Wishlist) return;
    window.Wishlist.toggle(this.currentProduct.slug, e);
    this.updateWishlistButtonState();
  },

  bindEvents: function() {
    window.addEventListener('hipa:wishlist-updated', () => {
      this.updateWishlistButtonState();
    });

    // Specs tabs switching
    document.querySelectorAll('.js-pdp-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetTab = e.currentTarget.getAttribute('data-tab');

        document.querySelectorAll('.js-pdp-tab-btn').forEach(b => b.classList.remove('is-active'));
        e.currentTarget.classList.add('is-active');

        document.querySelectorAll('.pdp-tab-pane').forEach(pane => {
          pane.classList.toggle('is-active', pane.id === targetTab);
        });
      });
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('pdpMainImg')) {
    ProductPage.init();
  }
});
window.ProductPage = ProductPage;
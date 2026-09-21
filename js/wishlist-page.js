/**
 * HIPA MASALA WISHLIST PAGE CONTROLLER
 * Renders wishlisted products or empty state and handles remove, add-to-cart, buy-now.
 */

const WishlistPage = {
  container: null,

  init: function() {
    this.container = document.getElementById('wishlistContainer');
    if (!this.container) return;

    this.render();

    window.addEventListener('wishlistUpdated', () => this.render());
  },

  render: function() {
    if (!this.container) return;
    const slugs = window.Wishlist ? window.Wishlist.getItems() : [];

    if (slugs.length === 0) {
      this.renderEmptyState();
      return;
    }

    const allProducts = window.HIPA_PRODUCTS || [];
    const wishlistedProducts = slugs.map(slug => allProducts.find(p => p.slug === slug)).filter(Boolean);

    if (wishlistedProducts.length === 0) {
      this.renderEmptyState();
      return;
    }

    const cardsHtml = wishlistedProducts.map(product => {
      const defaultVariant = product.variants[0];
      return `
        <article class="wishlist-card" id="wishlist-card-${product.slug}">
          <button 
            type="button" 
            class="wishlist-card-remove-btn" 
            onclick="Wishlist.remove('${product.slug}', event)" 
            title="Remove from wishlist" 
            aria-label="Remove ${product.name} from wishlist">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          <a href="product.html?slug=${product.slug}" class="wishlist-card-media">
            <img class="wishlist-card-img" src="${product.image}" alt="${product.imageAlt}" loading="lazy">
          </a>

          <div class="wishlist-card-badge">${product.categoryName}</div>
          <h3 class="wishlist-card-title">
            <a href="product.html?slug=${product.slug}">${product.name}</a>
          </h3>
          <div class="wishlist-card-meta">Pack Size: <strong>${defaultVariant.size}</strong></div>

          <div class="wishlist-card-price-row">
            <span class="wishlist-card-price">₹${defaultVariant.price}</span>
            <span class="wishlist-card-tax">Inc. all taxes</span>
          </div>

          <div class="wishlist-card-actions">
            <button 
              type="button" 
              class="btn-wishlist-cart" 
              onclick="Cart.addItem('${product.slug}', '${defaultVariant.size}', 1)">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>ADD TO CART</span>
            </button>
            <button 
              type="button" 
              class="btn-wishlist-buy" 
              onclick="Cart.buyNow('${product.slug}', '${defaultVariant.size}', 1)">
              Buy Now
            </button>
          </div>
        </article>
      `;
    }).join('');

    this.container.innerHTML = `
      <div class="wishlist-header-row">
        <div>
          <h1 class="wishlist-title">Your Wishlist</h1>
          <div class="wishlist-subtitle">${wishlistedProducts.length} saved product${wishlistedProducts.length === 1 ? '' : 's'} ready for your kitchen.</div>
        </div>
        <button type="button" class="wishlist-clear-btn" onclick="WishlistPage.clearAll()">Clear Wishlist</button>
      </div>
      <div class="wishlist-grid">
        ${cardsHtml}
      </div>
    `;
  },

  renderEmptyState: function() {
    this.container.innerHTML = `
      <div class="wishlist-empty-state">
        <div class="wishlist-empty-icon-wrap" aria-hidden="true">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </div>
        <h1 class="wishlist-empty-title">Your wishlist is waiting for something delicious.</h1>
        <p class="wishlist-empty-desc">Save your favourite HIPA Masala products here and come back anytime.</p>
        <a href="shop.html" class="btn btn-primary btn-lg">
          <span>Explore Products</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </a>
      </div>
    `;
  },

  clearAll: function() {
    if (confirm('Are you sure you want to clear your wishlist?')) {
      if (window.Wishlist) {
        window.Wishlist.saveItems([]);
      }
    }
  }
};

document.addEventListener('DOMContentLoaded', () => WishlistPage.init());

/**
 * HIPA MASALA GLOBAL SITE ENGINE
 * 3-Slide Hero Carousel Controller, Sticky Header, Mobile Nav, Dynamic Product Cards & Scroll Reveal
 */

const HeroCarousel = {
  currentIndex: 0,
  totalSlides: 3,
  autoPlayInterval: null,
  autoPlayDuration: 4500,
  touchStartX: 0,
  touchEndX: 0,

  init: function() {
    const track = document.getElementById('heroSliderTrack');
    if (!track) return;

    const prevBtn = document.getElementById('heroPrevBtn');
    const nextBtn = document.getElementById('heroNextBtn');
    const dots = document.querySelectorAll('.carousel-dot');

    if (prevBtn) prevBtn.addEventListener('click', () => { this.prevSlide(); this.resetAutoPlay(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { this.nextSlide(); this.resetAutoPlay(); });

    dots.forEach((dot, idx) => {
      dot.addEventListener('click', () => {
        this.goToSlide(idx);
        this.resetAutoPlay();
      });
    });

    // Pause on hover
    const container = document.getElementById('heroSliderContainer');
    if (container) {
      container.addEventListener('mouseenter', () => this.pauseAutoPlay());
      container.addEventListener('mouseleave', () => this.startAutoPlay());

      // Touch swipe support
      container.addEventListener('touchstart', (e) => {
        this.touchStartX = e.changedTouches[0].screenX;
        this.pauseAutoPlay();
      }, { passive: true });

      container.addEventListener('touchend', (e) => {
        this.touchEndX = e.changedTouches[0].screenX;
        this.handleSwipe();
        this.startAutoPlay();
      }, { passive: true });
    }

    this.startAutoPlay();
    this.updateUI();
  },

  goToSlide: function(index) {
    this.currentIndex = (index + this.totalSlides) % this.totalSlides;
    this.updateUI();
  },

  nextSlide: function() {
    this.goToSlide(this.currentIndex + 1);
  },

  prevSlide: function() {
    this.goToSlide(this.currentIndex - 1);
  },

  updateUI: function() {
    const track = document.getElementById('heroSliderTrack');
    if (track) {
      track.style.transform = `translateX(-${this.currentIndex * 33.33333}%)`;
    }
    const dots = document.querySelectorAll('.carousel-dot');
    dots.forEach((dot, idx) => {
      dot.classList.toggle('is-active', idx === this.currentIndex);
    });
  },

  startAutoPlay: function() {
    this.pauseAutoPlay();
    this.autoPlayInterval = setInterval(() => {
      this.nextSlide();
    }, this.autoPlayDuration);
  },

  pauseAutoPlay: function() {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
      this.autoPlayInterval = null;
    }
  },

  resetAutoPlay: function() {
    this.startAutoPlay();
  },

  handleSwipe: function() {
    const diff = this.touchStartX - this.touchEndX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        this.nextSlide();
      } else {
        this.prevSlide();
      }
    }
  }
};

const App = {
  selectedVariants: {},

  renderProductCard: function(product, index = 0) {
    const selectedSize = this.selectedVariants[product.slug] || product.variants[0].size;
    const currentVariant = product.variants.find(v => v.size === selectedSize) || product.variants[0];

    const sizeChipsHtml = product.variants.map(v => `
      <button 
        type="button" 
        class="size-chip ${v.size === selectedSize ? 'is-active' : ''}" 
        onclick="App.selectCardSize('${product.slug}', '${v.size}', event)"
        title="Select ${v.size} pack">
        ${v.size}
      </button>
    `).join('');

    const delay = (index % 4) * 0.08;

    return `
      <article class="product-card reveal" id="card-${product.slug}" style="transition-delay: ${delay}s">
        <div class="card-top">
          <span class="card-badge ${product.category === 'masalas' ? 'gold' : 'green'}">
            ${product.categoryName}
          </span>
          <button type="button" class="wishlist-btn" onclick="App.toggleWishlist('${product.slug}', this)" aria-label="Save to Wishlist">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>
        </div>

        <a href="product.html?slug=${product.slug}" class="product-media" title="View ${product.name} details">
          <img class="product-img" src="${product.image}" alt="${product.imageAlt}" loading="lazy">
          <button type="button" class="quick-view-overlay-btn" onclick="App.openQuickView('${product.slug}', event)">Quick View</button>
        </a>

        <div class="product-category-tag">${product.categoryName}</div>
        <h3 class="product-title">
          <a href="product.html?slug=${product.slug}">${product.name}</a>
        </h3>
        <div class="product-tamil-title">${product.tamilName || ''}</div>
        <p class="product-desc">${product.description}</p>

        <div class="pack-size-selector">
          <div class="pack-size-label">Pack Size: <strong>${selectedSize}</strong></div>
          <div class="pack-size-chips">
            ${sizeChipsHtml}
          </div>
        </div>

        <div class="card-bottom">
          <div class="price-row">
            <span class="current-price">₹${currentVariant.price}</span>
            <span class="tax-inclusive-tag">Inc. of all taxes</span>
          </div>
          <div class="card-actions-row">
            <button type="button" class="btn-card-cart" onclick="Cart.addItem('${product.slug}', '${selectedSize}', 1)" aria-label="Add ${product.name} ${selectedSize} to cart">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>+ ADD TO CART</span>
            </button>
            <button type="button" class="btn-card-buy" onclick="Cart.buyNow('${product.slug}', '${selectedSize}', 1)" aria-label="Buy ${product.name} now">
              <span>Buy Now</span>
            </button>
          </div>
        </div>
      </article>
    `;
  },

  selectCardSize: function(productSlug, size, event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.selectedVariants[productSlug] = size;
    const cardEl = document.getElementById(`card-${productSlug}`);
    if (cardEl && window.HipaStore) {
      const product = window.HipaStore.getProductBySlug(productSlug);
      if (product) {
        cardEl.outerHTML = this.renderProductCard(product);
        // Ensure the replaced card is visible immediately
        const newCard = document.getElementById(`card-${productSlug}`);
        if (newCard) newCard.classList.add('is-visible');
      }
    }
  },

  toggleWishlist: function(productSlug, btnEl) {
    btnEl.classList.toggle('active');
    const isActive = btnEl.classList.contains('active');
    if (isActive) {
      btnEl.querySelector('svg').setAttribute('fill', 'var(--color-primary)');
      Cart.showToast('Saved to your wishlist');
    } else {
      btnEl.querySelector('svg').removeAttribute('fill');
    }
  },

  openQuickView: function(productSlug, event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const product = window.HipaStore.getProductBySlug(productSlug);
    if (!product) return;

    let selectedSize = this.selectedVariants[product.slug] || product.variants[0].size;
    let variant = product.variants.find(v => v.size === selectedSize) || product.variants[0];

    const modal = document.getElementById('quickviewModal');
    const content = document.getElementById('quickviewContent');
    if (!modal || !content) return;

    const renderModalContent = () => {
      content.innerHTML = `
        <div class="quickview-image-box">
          <img class="quickview-img" src="${product.image}" alt="${product.name}">
        </div>
        <div class="quickview-details">
          <div class="card-badge" style="align-self:flex-start; margin-bottom:8px;">${product.categoryName}</div>
          <h2 style="font-size:1.5rem; font-weight:800; color:var(--text-dark); margin-bottom:4px;">${product.name}</h2>
          <div style="font-size:0.875rem; color:var(--text-muted); margin-bottom:12px;">${product.tamilName || ''}</div>
          
          <div class="price-row" style="margin-bottom:16px;">
            <span class="current-price" style="font-size:1.75rem;">₹${variant.price}</span>
            <span class="tax-inclusive-tag">Inc. of all taxes</span>
          </div>

          <p style="font-size:0.875rem; color:var(--text-body); line-height:1.5; margin-bottom:20px;">
            ${product.description}
          </p>

          <div style="margin-bottom:20px;">
            <div style="font-size:0.75rem; font-weight:700; text-transform:uppercase; color:var(--text-muted); margin-bottom:8px;">Select Pack Size:</div>
            <div class="pack-size-chips">
              ${product.variants.map(v => `
                <button type="button" class="size-chip ${v.size === selectedSize ? 'is-active' : ''}" onclick="App.changeQuickViewSize('${product.slug}', '${v.size}')">
                  ${v.size}
                </button>
              `).join('')}
            </div>
          </div>

          <div style="display:flex; gap:10px; margin-top:auto;">
            <button class="btn btn-primary" style="flex:1;" onclick="Cart.addItem('${product.slug}', '${selectedSize}', 1); App.closeQuickView();">
              + Add to Cart • ₹${variant.price}
            </button>
            <a href="product.html?slug=${product.slug}" class="btn btn-secondary">Full Details</a>
          </div>
        </div>
      `;
    };

    renderModalContent();
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  },

  changeQuickViewSize: function(productSlug, size) {
    this.selectedVariants[productSlug] = size;
    this.openQuickView(productSlug);
  },

  closeQuickView: function() {
    const modal = document.getElementById('quickviewModal');
    if (modal) {
      modal.classList.remove('is-open');
      document.body.style.overflow = '';
    }
  },

  initHeaderScroll: function() {
    const header = document.getElementById('siteHeader');
    if (header) {
      window.addEventListener('scroll', () => {
        if (window.scrollY > 20) {
          header.classList.add('is-scrolled');
        } else {
          header.classList.remove('is-scrolled');
        }
      });
    }
  },

  initMobileNav: function() {
    const toggle = document.getElementById('mobileNavToggle');
    const drawer = document.getElementById('mobileNavDrawer');
    const closeBtn = document.getElementById('mobileNavClose');
    const overlay = document.getElementById('mobileNavBackdrop');

    const open = () => {
      if (drawer) drawer.classList.add('is-open');
      if (overlay) overlay.classList.add('is-active');
      document.body.style.overflow = 'hidden';
    };

    const close = () => {
      if (drawer) drawer.classList.remove('is-open');
      if (overlay) overlay.classList.remove('is-active');
      document.body.style.overflow = '';
    };

    if (toggle) toggle.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);
    if (overlay) overlay.addEventListener('click', close);
  },

  initQuickViewEvents: function() {
    const closeBtn = document.getElementById('quickviewClose');
    const modal = document.getElementById('quickviewModal');
    if (closeBtn) closeBtn.addEventListener('click', () => this.closeQuickView());
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeQuickView();
      });
    }
  },

  initScrollReveal: function() {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, {
      rootMargin: '0px 0px -40px 0px',
      threshold: 0.1
    });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  },

  init: function() {
    this.initHeaderScroll();
    this.initMobileNav();
    this.initQuickViewEvents();
    HeroCarousel.init();

    // Populate home 8-product grid if present
    const homeGrid = document.getElementById('homeProductsGrid');
    if (homeGrid && window.HipaStore) {
      const allProducts = window.HipaStore.getAllProducts();
      homeGrid.innerHTML = allProducts.map((p, idx) => this.renderProductCard(p, idx)).join('');
    }

    // Initialize Scroll Reveal Animations
    this.initScrollReveal();
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
window.App = App;

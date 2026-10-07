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
    const variantImg = (currentVariant.images && (currentVariant.images.frontWeb || currentVariant.images.front)) || product.image;

    const sizeChipsHtml = product.variants.map(v => `
      <button 
        type="button" 
        class="size-chip ${v.size === selectedSize ? 'is-active' : ''}" 
        onclick="App.selectCardSize('${product.slug}', '${v.size}', event)"
        data-size="${v.size}"
        title="Select ${v.size} pack">
        ${v.size}
      </button>
    `).join('');

    const delay = (index % 4) * 0.06;

    return `
      <article class="product-card reveal is-visible" id="card-${product.slug}" style="transition-delay: ${delay}s">
        <div class="card-top">
          <span class="card-badge ${product.category === 'masalas' ? 'gold' : 'green'}">
            ${product.categoryName}
          </span>
          <button 
            type="button" 
            class="wishlist-btn ${window.Wishlist && window.Wishlist.has(product.slug) ? 'active' : ''}" 
            data-slug="${product.slug}"
            onclick="Wishlist.toggle('${product.slug}', event)" 
            aria-label="Save ${product.name} to Wishlist">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="${window.Wishlist && window.Wishlist.has(product.slug) ? 'var(--color-primary, #9E1B1E)' : 'none'}" stroke="${window.Wishlist && window.Wishlist.has(product.slug) ? 'var(--color-primary, #9E1B1E)' : 'currentColor'}" stroke-width="1.8">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>
        </div>

        <a href="product.html?slug=${product.slug}" class="product-media" data-slug="${product.slug}" title="View ${product.name} details">
          <div class="package-3d-glare" aria-hidden="true"></div>
          <img class="product-img" src="${variantImg}" alt="${product.imageAlt}" loading="lazy">
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
    if (!cardEl || !window.HipaStore) return;

    const product = window.HipaStore.getProductBySlug(productSlug);
    if (!product) return;

    const variant = product.variants.find(v => v.size === size) || product.variants[0];
    const newImgSrc = (variant.images && (variant.images.frontWeb || variant.images.front)) || product.image;

    // 1. Update card packaging image with smooth transition
    const imgEl = cardEl.querySelector('.product-img');
    if (imgEl && imgEl.getAttribute('src') !== newImgSrc) {
      imgEl.classList.add('is-switching');
      const tempImg = new Image();
      const applySrc = () => {
        imgEl.src = newImgSrc;
        setTimeout(() => imgEl.classList.remove('is-switching'), 40);
      };
      tempImg.onload = applySrc;
      tempImg.onerror = applySrc;
      tempImg.src = newImgSrc;
    }

    // 2. Update active size chip buttons
    cardEl.querySelectorAll('.size-chip').forEach(chip => {
      const chipSize = chip.getAttribute('data-size') || chip.textContent.trim();
      chip.classList.toggle('is-active', chipSize === size);
    });

    // 3. Update pack size label
    const labelEl = cardEl.querySelector('.pack-size-label');
    if (labelEl) {
      labelEl.innerHTML = `Pack Size: <strong>${size}</strong>`;
    }

    // 4. Update price display
    const priceEl = cardEl.querySelector('.current-price');
    if (priceEl) {
      priceEl.textContent = `₹${variant.price}`;
    }

    // 5. Update Add to Cart & Buy Now buttons
    const cartBtn = cardEl.querySelector('.btn-card-cart');
    if (cartBtn) {
      cartBtn.setAttribute('onclick', `Cart.addItem('${product.slug}', '${size}', 1)`);
      cartBtn.setAttribute('aria-label', `Add ${product.name} ${size} to cart`);
    }
    const buyBtn = cardEl.querySelector('.btn-card-buy');
    if (buyBtn) {
      buyBtn.setAttribute('onclick', `Cart.buyNow('${product.slug}', '${size}', 1)`);
      buyBtn.setAttribute('aria-label', `Buy ${product.name} now`);
    }

    // Ensure 3D tilt remains attached
    const mediaEl = cardEl.querySelector('.product-media');
    if (mediaEl && !mediaEl._has3DTilt) {
      this.attach3DTilt(mediaEl, '.product-img');
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
    let variantImg = (variant.images && (variant.images.frontWeb || variant.images.front)) || product.image;

    const modal = document.getElementById('quickviewModal');
    const content = document.getElementById('quickviewContent');
    if (!modal || !content) return;

    content.innerHTML = `
      <div class="quickview-image-box" id="qvImageBox">
        <div class="package-3d-glare" aria-hidden="true"></div>
        <img class="quickview-img" id="qvImg" src="${variantImg}" alt="${product.name}">
      </div>
      <div class="quickview-details">
        <div class="card-badge" style="align-self:flex-start; margin-bottom:8px;">${product.categoryName}</div>
        <h2 style="font-size:1.5rem; font-weight:800; color:var(--text-dark); margin-bottom:4px;">${product.name}</h2>
        <div style="font-size:0.875rem; color:var(--text-muted); margin-bottom:12px;">${product.tamilName || ''}</div>
        
        <div class="price-row" style="margin-bottom:16px;">
          <span class="current-price" id="qvPrice" style="font-size:1.75rem;">₹${variant.price}</span>
          <span class="tax-inclusive-tag">Inc. of all taxes</span>
        </div>

        <p style="font-size:0.875rem; color:var(--text-body); line-height:1.5; margin-bottom:20px;">
          ${product.description}
        </p>

        <div style="margin-bottom:20px;">
          <div style="font-size:0.75rem; font-weight:700; text-transform:uppercase; color:var(--text-muted); margin-bottom:8px;">Select Pack Size:</div>
          <div class="pack-size-chips" id="qvChips">
            ${product.variants.map(v => `
              <button type="button" class="size-chip ${v.size === selectedSize ? 'is-active' : ''}" onclick="App.changeQuickViewSize('${product.slug}', '${v.size}')" data-size="${v.size}">
                ${v.size}
              </button>
            `).join('')}
          </div>
        </div>

        <div style="display:flex; gap:10px; margin-top:auto;">
          <button class="btn btn-primary" id="qvAddCartBtn" style="flex:1;" onclick="Cart.addItem('${product.slug}', '${selectedSize}', 1); App.closeQuickView();">
            + Add to Cart • ₹${variant.price}
          </button>
          <a href="product.html?slug=${product.slug}" class="btn btn-secondary">Full Details</a>
        </div>
      </div>
    `;

    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';

    // Attach 3D tilt to Quick View image container
    const qvBox = document.getElementById('qvImageBox');
    if (qvBox) {
      this.attach3DTilt(qvBox, '#qvImg');
    }
  },

  changeQuickViewSize: function(productSlug, size) {
    this.selectedVariants[productSlug] = size;
    const product = window.HipaStore.getProductBySlug(productSlug);
    if (!product) return;

    const variant = product.variants.find(v => v.size === size) || product.variants[0];
    const newImgSrc = (variant.images && (variant.images.frontWeb || variant.images.front)) || product.image;

    // Smooth image switch in Quick View
    const imgEl = document.getElementById('qvImg');
    if (imgEl && imgEl.getAttribute('src') !== newImgSrc) {
      imgEl.classList.add('is-switching');
      const tempImg = new Image();
      const applySrc = () => {
        imgEl.src = newImgSrc;
        setTimeout(() => imgEl.classList.remove('is-switching'), 40);
      };
      tempImg.onload = applySrc;
      tempImg.onerror = applySrc;
      tempImg.src = newImgSrc;
    }

    // Update active size chip buttons in Quick View
    const chipsContainer = document.getElementById('qvChips');
    if (chipsContainer) {
      chipsContainer.querySelectorAll('.size-chip').forEach(btn => {
        btn.classList.toggle('is-active', btn.getAttribute('data-size') === size);
      });
    }

    // Update price and cart button
    const priceEl = document.getElementById('qvPrice');
    if (priceEl) priceEl.textContent = `₹${variant.price}`;

    const addBtn = document.getElementById('qvAddCartBtn');
    if (addBtn) {
      addBtn.textContent = `+ Add to Cart • ₹${variant.price}`;
      addBtn.setAttribute('onclick', `Cart.addItem('${product.slug}', '${size}', 1); App.closeQuickView();`);
    }
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
    if (!header) return;

    let lastScrollY = Math.max(0, window.pageYOffset || document.documentElement.scrollTop);
    let ticking = false;
    const scrollThreshold = 8; // Small delta to prevent jitter

    const updateHeader = () => {
      const currentScrollY = Math.max(0, window.pageYOffset || document.documentElement.scrollTop);

      // Add shadow when scrolled
      if (currentScrollY > 20) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }

      // At top of page: restore full navbar immediately
      if (currentScrollY <= 15) {
        header.classList.remove('header-hidden');
        header.classList.add('header-visible');
      } else if (Math.abs(currentScrollY - lastScrollY) > scrollThreshold) {
        // Scrolling DOWN: smoothly minimize/hide
        if (currentScrollY > lastScrollY && currentScrollY > 70) {
          header.classList.add('header-hidden');
          header.classList.remove('header-visible');
        } else if (currentScrollY < lastScrollY) {
          // Scrolling UP: smoothly reappear completely
          header.classList.remove('header-hidden');
          header.classList.add('header-visible');
        }
      }

      lastScrollY = currentScrollY;
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(updateHeader);
        ticking = true;
      }
    }, { passive: true });
  },

  initMobileNav: function() {
    const triggers = document.querySelectorAll('#mobileNavToggle, #mobileMenuPillBtn, .js-mobile-nav-trigger');
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

    triggers.forEach(trigger => trigger.addEventListener('click', open));
    if (closeBtn) closeBtn.addEventListener('click', close);
    if (overlay) overlay.addEventListener('click', close);
  },

  initFooterAccordions: function() {
    const headers = document.querySelectorAll('.footer-accordion-header');
    headers.forEach(header => {
      header.addEventListener('click', () => {
        // Run on mobile & tablet viewports
        if (window.innerWidth > 768) return;

        const col = header.closest('.footer-accordion-col');
        if (!col) return;

        const wasOpen = col.classList.contains('is-open');

        // Close other open accordions for a crisp single-accordion feel
        document.querySelectorAll('.footer-accordion-col.is-open').forEach(other => {
          if (other !== col) other.classList.remove('is-open');
        });

        col.classList.toggle('is-open', !wasOpen);
      });
    });
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
      rootMargin: '0px 0px -20px 0px',
      threshold: 0.05
    });

    document.querySelectorAll('.reveal:not(.is-visible)').forEach(el => observer.observe(el));
  },

  initHeritageVideo: function() {
    const video = document.querySelector('.heritage-bg-video');
    if (!video) return;

    video.muted = true;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        const startOnInteraction = () => {
          video.play().catch(() => {});
          window.removeEventListener('click', startOnInteraction);
          window.removeEventListener('touchstart', startOnInteraction);
          window.removeEventListener('scroll', startOnInteraction);
        };
        window.addEventListener('click', startOnInteraction, { once: true, passive: true });
        window.addEventListener('touchstart', startOnInteraction, { once: true, passive: true });
        window.addEventListener('scroll', startOnInteraction, { once: true, passive: true });
      });
    }
  },

  /**
   * 3D Packaging Hover & Rotation Reaction
   * Reacts to cursor movement with realistic 3D perspective, specular glare, and dynamic shadow
   */
  attach3DTilt: function(container, imgSelector = '.product-img') {
    if (!container || container._has3DTilt) return;
    container._has3DTilt = true;

    const img = container.querySelector(imgSelector);
    if (!img) return;

    // Specular sheen highlight overlay
    let glare = container.querySelector('.package-3d-glare');
    if (!glare) {
      glare = document.createElement('div');
      glare.className = 'package-3d-glare';
      glare.setAttribute('aria-hidden', 'true');
      container.appendChild(glare);
    }

    let rect = null;
    let rafId = null;
    let targetX = 0; // -1 to 1
    let targetY = 0; // -1 to 1
    let currentX = 0;
    let currentY = 0;
    let isHovered = false;

    const isCardImg = img.classList.contains('product-img');

    const updateTilt = () => {
      // Smooth lerp damping for organic springy feel
      currentX += (targetX - currentX) * 0.16;
      currentY += (targetY - currentY) * 0.16;

      const rotY = (currentX * 18).toFixed(2);  // Yaw (horizontal tilt)
      const rotX = (-currentY * 16).toFixed(2); // Pitch (vertical tilt)
      const shadowX = (-currentX * 14).toFixed(1);
      const shadowY = (12 + currentY * 8).toFixed(1);

      if (isCardImg) {
        img.style.transform = `translate(-50%, -50%) perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(${isHovered ? 1.08 : 1}, ${isHovered ? 1.08 : 1}, ${isHovered ? 1.08 : 1}) translateZ(24px)`;
      } else {
        img.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(${isHovered ? 1.05 : 1}, ${isHovered ? 1.05 : 1}, ${isHovered ? 1.05 : 1}) translateZ(20px)`;
      }

      img.style.filter = `drop-shadow(${shadowX}px ${shadowY}px 20px rgba(0, 0, 0, ${isHovered ? 0.18 : 0.08}))`;

      // Specular sheen follows light reflection opposite to gaze
      if (glare) {
        const glareX = ((currentX + 1) * 50).toFixed(1);
        const glareY = ((currentY + 1) * 50).toFixed(1);
        glare.style.background = `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255, 255, 255, 0.42) 0%, rgba(255, 255, 255, 0) 65%)`;
        glare.style.opacity = isHovered ? '1' : '0';
      }

      if (isHovered || Math.abs(currentX) > 0.005 || Math.abs(currentY) > 0.005) {
        rafId = requestAnimationFrame(updateTilt);
      } else {
        // Return to rest position cleanly
        if (isCardImg) {
          img.style.transform = '';
        } else {
          img.style.transform = '';
        }
        img.style.filter = '';
        if (glare) glare.style.opacity = '0';
        rafId = null;
      }
    };

    container.addEventListener('mouseenter', () => {
      rect = container.getBoundingClientRect();
      isHovered = true;
      if (!rafId) rafId = requestAnimationFrame(updateTilt);
    });

    container.addEventListener('mousemove', (e) => {
      if (!rect) rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      targetX = Math.max(-1, Math.min(1, (mouseX / rect.width - 0.5) * 2));
      targetY = Math.max(-1, Math.min(1, (mouseY / rect.height - 0.5) * 2));
      if (!rafId) rafId = requestAnimationFrame(updateTilt);
    });

    container.addEventListener('mouseleave', () => {
      isHovered = false;
      targetX = 0;
      targetY = 0;
      rect = null;
    });
  },

  initAll3DTilt: function() {
    // 1. All product cards
    document.querySelectorAll('.product-media').forEach(media => {
      this.attach3DTilt(media, '.product-img');
    });

    // 2. PDP main image container
    const pdpWrap = document.querySelector('.pdp-main-image-wrap');
    if (pdpWrap) {
      this.attach3DTilt(pdpWrap, '#pdpMainImg');
    }
  },

  /**
   * Smooth Scrolling Engine
   * Smoothly scrolls internal links with fixed navigation offset
   */
  initSmoothScroll: function() {
    document.querySelectorAll('a[href^="#"]:not([href="#"]):not([href="#0"])').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (!href || href === '#') return;
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          const header = document.getElementById('siteHeader');
          const headerOffset = header ? header.offsetHeight + 14 : 85;
          const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerOffset;
          window.scrollTo({
            top: Math.max(0, targetPosition),
            behavior: 'smooth'
          });
        }
      });
    });
  },

  init: function() {
    this.initHeaderScroll();
    this.initMobileNav();
    this.initFooterAccordions();
    this.initQuickViewEvents();
    HeroCarousel.init();

    // Populate home 8-product grid if present
    const homeGrid = document.getElementById('homeProductsGrid');
    if (homeGrid && window.HipaStore) {
      const allProducts = window.HipaStore.getAllProducts();
      homeGrid.innerHTML = allProducts.map((p, idx) => this.renderProductCard(p, idx)).join('');
      if (window.ScrollTrigger) {
        window.ScrollTrigger.refresh();
      }
    }

    // Initialize 3D Packaging Cursor Reaction on all cards & showcases
    this.initAll3DTilt();

    // Initialize Smooth Scrolling for internal anchors
    this.initSmoothScroll();

    // Initialize Heritage Video Background
    this.initHeritageVideo();

    // Initialize Scroll Reveal Animations
    this.initScrollReveal();
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
window.App = App;

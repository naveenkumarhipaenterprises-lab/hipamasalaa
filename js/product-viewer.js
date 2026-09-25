/* =========================================================
   HIPA MASALAS — DYNAMIC PRODUCT IMAGE ZOOM & FRONT/BACK VIEWER
   ========================================================= */

(function () {
  'use strict';

  const HipaViewer = {
    productSlug: 'sambar-powder',
    currentSize: '100g',
    currentSide: 'front', // 'front' | 'back'
    isOpen: false,
    isZoomed: false,
    zoomScale: 1,
    panX: 0,
    panY: 0,
    isDragging: false,
    startX: 0,
    startY: 0,
    touchStartX: 0,
    touchStartY: 0,

    init(slug, size) {
      if (slug) this.productSlug = slug;
      if (size) this.currentSize = size;

      this.cacheElements();
      this.bindEvents();
      this.syncUI(false);
    },

    cacheElements() {
      this.mainImg = document.getElementById('pdpMainImg');
      this.zoomTriggerBtn = document.getElementById('hipaZoomTriggerBtn');
      this.sideSwitcherWrap = document.getElementById('hipaSideSwitcherWrap');
      this.sideButtons = document.querySelectorAll('.hipa-side-btn');

      // Lightbox Elements
      this.lightbox = document.getElementById('hipaProductLightbox');
      this.lightboxImg = document.getElementById('hipaLightboxImg');
      this.lightboxCloseBtn = document.getElementById('hipaLightboxCloseBtn');
      this.lightboxSidePill = document.querySelector('.hipa-lightbox-side-pill');
      this.lightboxSideButtons = document.querySelectorAll('.hipa-lightbox-side-btn');
      this.lightboxTitle = document.getElementById('hipaLightboxTitle');
      this.lightboxBadge = document.getElementById('hipaLightboxBadge');
      this.arrowPrev = document.getElementById('hipaArrowPrev');
      this.arrowNext = document.getElementById('hipaArrowNext');
      this.zoomInBtn = document.getElementById('hipaZoomInBtn');
      this.zoomOutBtn = document.getElementById('hipaZoomOutBtn');
      this.zoomResetBtn = document.getElementById('hipaZoomResetBtn');
      this.stage = document.getElementById('hipaLightboxStage');
      this.stageInner = document.getElementById('hipaLightboxStageInner');
    },

    getMockupConfig() {
      const db = window.HIPA_PRODUCT_MOCKUPS || {};
      return db[this.productSlug] || null;
    },

    getSizeMockup() {
      const config = this.getMockupConfig();
      if (!config || !config.sizes) return null;
      return config.sizes[this.currentSize] || null;
    },

    hasBackImage() {
      const sizeObj = this.getSizeMockup();
      return !!(sizeObj && (sizeObj.back || sizeObj.backWeb));
    },

    getImageSrc(preferWeb = true) {
      const sizeObj = this.getSizeMockup();
      if (sizeObj) {
        if (this.currentSide === 'back') {
          if (preferWeb && sizeObj.backWeb) return sizeObj.backWeb;
          return sizeObj.back || sizeObj.backWeb || '';
        } else {
          if (preferWeb && sizeObj.frontWeb) return sizeObj.frontWeb;
          return sizeObj.front || sizeObj.frontWeb || '';
        }
      }

      // Fallback to current product image in HipaStore or DOM
      if (window.ProductPage && window.ProductPage.currentProduct) {
        return window.ProductPage.currentProduct.image;
      }
      return this.mainImg ? this.mainImg.getAttribute('src') : '';
    },

    bindEvents() {
      // 1. Front | Back Switchers on Main PDP
      if (this.sideButtons && this.sideButtons.length) {
        this.sideButtons.forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            const side = btn.getAttribute('data-side');
            this.setSide(side);
          });
        });
      }

      // 2. Zoom Trigger Button (🔍 Icon)
      if (this.zoomTriggerBtn) {
        this.zoomTriggerBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.openLightbox();
        });
      }

      // 3. Main Product Image Click -> Open Lightbox
      if (this.mainImg) {
        this.mainImg.addEventListener('click', () => {
          this.openLightbox();
        });
      }

      // 4. Lightbox Controls
      if (this.lightboxCloseBtn) {
        this.lightboxCloseBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.closeLightbox();
        });
      }

      if (this.lightboxSideButtons && this.lightboxSideButtons.length) {
        this.lightboxSideButtons.forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            const side = btn.getAttribute('data-side');
            this.setSide(side);
          });
        });
      }

      // Arrow Navigations
      if (this.arrowPrev) {
        this.arrowPrev.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.toggleSide();
        });
      }
      if (this.arrowNext) {
        this.arrowNext.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.toggleSide();
        });
      }

      // Zoom Buttons in Lightbox
      if (this.zoomInBtn) {
        this.zoomInBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.applyZoom(this.zoomScale + 0.5);
        });
      }
      if (this.zoomOutBtn) {
        this.zoomOutBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.applyZoom(this.zoomScale - 0.5);
        });
      }
      if (this.zoomResetBtn) {
        this.zoomResetBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.resetZoom();
        });
      }

      // Lightbox Image Click -> Toggle Zoom
      if (this.lightboxImg) {
        this.lightboxImg.addEventListener('click', (e) => {
          e.stopPropagation();
          if (!this.isZoomed) {
            this.applyZoom(2);
          } else {
            this.resetZoom();
          }
        });
      }

      // Stage Pan & Mouse Wheel Zoom
      if (this.stage) {
        this.stage.addEventListener('wheel', (e) => {
          if (!this.isOpen) return;
          e.preventDefault();
          const delta = e.deltaY < 0 ? 0.3 : -0.3;
          this.applyZoom(this.zoomScale + delta);
        }, { passive: false });

        // Pan on Drag when Zoomed
        this.stage.addEventListener('mousedown', (e) => {
          if (this.zoomScale <= 1) return;
          this.isDragging = true;
          this.startX = e.clientX - this.panX;
          this.startY = e.clientY - this.panY;
        });

        window.addEventListener('mousemove', (e) => {
          if (!this.isDragging || this.zoomScale <= 1) return;
          this.panX = e.clientX - this.startX;
          this.panY = e.clientY - this.startY;
          this.updateTransform();
        });

        window.addEventListener('mouseup', () => {
          this.isDragging = false;
        });

        // Close when clicking outside image
        this.stage.addEventListener('click', (e) => {
          if (e.target === this.stage || e.target === this.stageInner) {
            this.closeLightbox();
          }
        });

        // Touch Swipe & Gestures on Mobile
        this.stage.addEventListener('touchstart', (e) => {
          if (e.touches.length === 1) {
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
            if (this.zoomScale > 1) {
              this.isDragging = true;
              this.startX = e.touches[0].clientX - this.panX;
              this.startY = e.touches[0].clientY - this.panY;
            }
          }
        }, { passive: true });

        this.stage.addEventListener('touchmove', (e) => {
          if (this.isDragging && this.zoomScale > 1 && e.touches.length === 1) {
            this.panX = e.touches[0].clientX - this.startX;
            this.panY = e.touches[0].clientY - this.startY;
            this.updateTransform();
          }
        }, { passive: true });

        this.stage.addEventListener('touchend', (e) => {
          if (this.isDragging) {
            this.isDragging = false;
          }
          if (this.zoomScale <= 1 && e.changedTouches.length === 1) {
            const diffX = e.changedTouches[0].clientX - this.touchStartX;
            const diffY = e.changedTouches[0].clientY - this.touchStartY;
            // Horizontal swipe detection (> 45px threshold)
            if (Math.abs(diffX) > 45 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
              this.toggleSide();
            }
          }
        }, { passive: true });
      }

      // Keyboard Listeners: ESC, ArrowLeft, ArrowRight
      window.addEventListener('keydown', (e) => {
        if (!this.isOpen) return;
        if (e.key === 'Escape') {
          this.closeLightbox();
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          this.toggleSide();
        }
      });
    },

    setSize(size) {
      this.currentSize = size;
      // If the current side is back but new size has no back image, fallback to front
      if (this.currentSide === 'back' && !this.hasBackImage()) {
        this.currentSide = 'front';
      }
      this.syncUI(true);
    },

    setSide(side) {
      if (side !== 'front' && side !== 'back') return;
      if (!this.hasBackImage() && side === 'back') return;
      if (this.currentSide === side) return;
      this.currentSide = side;
      this.syncUI(true);
    },

    toggleSide() {
      if (!this.hasBackImage()) return;
      const nextSide = this.currentSide === 'front' ? 'back' : 'front';
      this.setSide(nextSide);
    },

    syncUI(animate = false) {
      const src = this.getImageSrc(true);
      const fullSrc = this.getImageSrc(false);
      const config = this.getMockupConfig();
      const prod = window.ProductPage ? window.ProductPage.currentProduct : null;
      const prodName = prod ? prod.name : (config ? config.name : 'HIPA Masalas');

      const hasBack = this.hasBackImage();

      // Show or hide side switchers based on availability of back image
      if (this.sideSwitcherWrap) {
        this.sideSwitcherWrap.style.display = hasBack ? 'flex' : 'none';
      }
      if (this.lightboxSidePill) {
        this.lightboxSidePill.style.display = hasBack ? 'inline-flex' : 'none';
      }
      if (this.arrowPrev) this.arrowPrev.style.display = hasBack ? 'flex' : 'none';
      if (this.arrowNext) this.arrowNext.style.display = hasBack ? 'flex' : 'none';

      // Update Main PDP Image
      if (this.mainImg) {
        if (animate) {
          this.mainImg.classList.add('is-switching');
          setTimeout(() => {
            this.mainImg.src = src;
            this.mainImg.alt = `${prodName} ${this.currentSize} ${this.currentSide} packaging mockup`;
            this.mainImg.classList.remove('is-switching');
          }, 120);
        } else {
          this.mainImg.src = src;
          this.mainImg.alt = `${prodName} ${this.currentSize} ${this.currentSide} packaging mockup`;
        }
      }

      // Update Lightbox Image
      if (this.lightboxImg) {
        if (animate) {
          this.lightboxImg.classList.add('is-switching');
          setTimeout(() => {
            this.lightboxImg.src = fullSrc || src;
            this.lightboxImg.alt = `${prodName} ${this.currentSize} ${this.currentSide} full packaging view`;
            this.lightboxImg.classList.remove('is-switching');
          }, 120);
        } else {
          this.lightboxImg.src = fullSrc || src;
          this.lightboxImg.alt = `${prodName} ${this.currentSize} ${this.currentSide} full packaging view`;
        }
      }

      // Update Titles & Badges
      if (this.lightboxTitle) {
        this.lightboxTitle.textContent = prodName;
      }
      if (this.lightboxBadge) {
        this.lightboxBadge.textContent = this.currentSize;
      }

      // Update Side Switcher Buttons (PDP & Lightbox)
      const allSideBtns = [...this.sideButtons, ...this.lightboxSideButtons];
      allSideBtns.forEach(btn => {
        if (btn.getAttribute('data-side') === this.currentSide) {
          btn.classList.add('is-active');
          btn.setAttribute('aria-selected', 'true');
        } else {
          btn.classList.remove('is-active');
          btn.setAttribute('aria-selected', 'false');
        }
      });
    },

    openLightbox() {
      if (!this.lightbox) return;
      this.isOpen = true;
      this.resetZoom();
      this.syncUI(false);
      this.lightbox.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    },

    closeLightbox() {
      if (!this.lightbox) return;
      this.isOpen = false;
      this.resetZoom();
      this.lightbox.classList.remove('is-open');
      document.body.style.overflow = '';
    },

    applyZoom(scale) {
      this.zoomScale = Math.min(Math.max(scale, 1), 3.5);
      this.isZoomed = this.zoomScale > 1;

      if (!this.isZoomed) {
        this.panX = 0;
        this.panY = 0;
      }

      this.updateTransform();
    },

    resetZoom() {
      this.zoomScale = 1;
      this.panX = 0;
      this.panY = 0;
      this.isZoomed = false;
      this.updateTransform();
    },

    updateTransform() {
      if (this.lightboxImg) {
        this.lightboxImg.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoomScale})`;
      }
    }
  };

  // Expose globally
  window.HipaViewer = HipaViewer;
})();

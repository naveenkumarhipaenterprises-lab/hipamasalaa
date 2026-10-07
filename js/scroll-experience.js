/**
 * HIPA Masala — PREMIUM GSAP SCROLLTRIGGER ENGINE
 * Scroll-position driven animations, scrubbed timelines, pinned showcases, and depth parallax.
 * Reference: https://gsap.com/scroll/
 */

(function () {
  'use strict';

  // Ensure GSAP and ScrollTrigger are loaded
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.warn('[ScrollExperience] GSAP or ScrollTrigger not loaded.');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  const ScrollExperience = {
    mm: null,

    init() {
      // Mark document as GSAP ready for CSS transition overrides
      document.documentElement.classList.add('js-gsap-ready');

      // 1. Accessibility Check: Respect prefers-reduced-motion
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this.initReducedMotion();
        return;
      }

      // 2. Set up responsive media queries with gsap.matchMedia()
      this.mm = gsap.matchMedia();

      this.setupDesktopAnimations();
      this.setupMobileAnimations();
      this.bindGlobalEvents();

      // Initial calculation pass
      ScrollTrigger.refresh();
    },

    initReducedMotion() {
      gsap.set(
        ['.hero-slide-banner', '.section-header', '.product-card', '.why-card', '.heritage-card', '.support-card'],
        {
          clearProps: 'all',
          opacity: 1,
          y: 0,
          x: 0,
          scale: 1
        }
      );
      document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
    },

    setupDesktopAnimations() {
      this.mm.add('(min-width: 992px)', () => {
        // ====================================================================
        // 1. HERO SCROLL PARALLAX (Scrubbed Depth)
        // ====================================================================
        const heroSection = document.getElementById('heroSliderContainer');
        if (heroSection) {
          const heroTrack = heroSection.querySelector('.hero-slider-track');
          const heroImages = heroSection.querySelectorAll('.hero-banner-image');
          const heroDots = heroSection.querySelector('.carousel-dots');
          const heroArrows = heroSection.querySelectorAll('.carousel-nav-btn');

          const heroTl = gsap.timeline({
            scrollTrigger: {
              trigger: heroSection,
              start: 'top top',
              end: 'bottom top',
              scrub: 1,
              invalidateOnRefresh: true
            }
          });

          // Parallax depth: Hero image subtly scales and drifts down
          if (heroImages.length) {
            heroTl.to(heroImages, {
              yPercent: 16,
              scale: 1.08,
              ease: 'none'
            }, 0);
          }

          // Subtle cinematic opacity fade into the next section
          if (heroTrack) {
            heroTl.to(heroTrack, {
              opacity: 0.85,
              ease: 'none'
            }, 0);
          }

          if (heroDots) {
            heroTl.to(heroDots, {
              y: -20,
              opacity: 0.2,
              ease: 'none'
            }, 0);
          }

          if (heroArrows.length) {
            heroTl.to(heroArrows, {
              opacity: 0.3,
              ease: 'none'
            }, 0);
          }
        }

        // ====================================================================
        // 2. PRODUCT SECTION SCROLL ANIMATION (Scrubbed Cascading Entrance)
        // ====================================================================
        const shopSection = document.getElementById('shopProducts');
        if (shopSection) {
          const shopHeader = shopSection.querySelector('.section-header');
          const productCards = shopSection.querySelectorAll('.product-card');
          const shopCta = shopSection.querySelector('.btn-secondary');

          // Header scrubbed reveal
          if (shopHeader) {
            gsap.fromTo(shopHeader,
              { y: 50, opacity: 0.15 },
              {
                y: 0,
                opacity: 1,
                ease: 'power2.out',
                scrollTrigger: {
                  trigger: shopSection,
                  start: 'top 85%',
                  end: 'top 45%',
                  scrub: 0.8
                }
              }
            );
          }

          // Product Cards: Staggered scrubbed entrance with 3D elevation
          if (productCards.length) {
            const row1 = Array.from(productCards).slice(0, 4);
            const row2 = Array.from(productCards).slice(4, 8);

            if (row1.length) {
              gsap.fromTo(row1,
                { y: 70, opacity: 0.1, scale: 0.94 },
                {
                  y: 0,
                  opacity: 1,
                  scale: 1,
                  stagger: 0.08,
                  ease: 'power2.out',
                  scrollTrigger: {
                    trigger: shopSection,
                    start: 'top 65%',
                    end: 'center 60%',
                    scrub: 1
                  }
                }
              );
            }

            if (row2.length) {
              gsap.fromTo(row2,
                { y: 80, opacity: 0.1, scale: 0.94 },
                {
                  y: 0,
                  opacity: 1,
                  scale: 1,
                  stagger: 0.08,
                  ease: 'power2.out',
                  scrollTrigger: {
                    trigger: shopSection,
                    start: 'center 75%',
                    end: 'bottom 80%',
                    scrub: 1
                  }
                }
              );
            }

            // Subtle layered parallax depth between alternating columns as user scrolls past
            const colOdd = Array.from(productCards).filter((_, i) => i % 2 === 0);
            const colEven = Array.from(productCards).filter((_, i) => i % 2 !== 0);

            gsap.to(colOdd, {
              yPercent: -4,
              ease: 'none',
              scrollTrigger: {
                trigger: shopSection,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1.2
              }
            });

            gsap.to(colEven, {
              yPercent: 4,
              ease: 'none',
              scrollTrigger: {
                trigger: shopSection,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1.2
              }
            });
          }

          // Catalog CTA Button entrance
          if (shopCta) {
            gsap.fromTo(shopCta,
              { y: 40, opacity: 0.2, scale: 0.95 },
              {
                y: 0,
                opacity: 1,
                scale: 1,
                ease: 'power2.out',
                scrollTrigger: {
                  trigger: shopCta,
                  start: 'top 92%',
                  end: 'top 75%',
                  scrub: 0.8
                }
              }
            );
          }
        }

        // ====================================================================
        // 3. PINNED SHOWCASE: WHY CHOOSE HIPA (Step-by-Step Pinned Reveal)
        // ====================================================================
        const whySection = document.getElementById('whyChooseHipa');
        if (whySection) {
          const whyHeader = whySection.querySelector('.section-header');
          const whyCards = whySection.querySelectorAll('.why-card');

          const whyTl = gsap.timeline({
            scrollTrigger: {
              trigger: whySection,
              start: 'top top',
              end: '+=120%',
              pin: true,
              scrub: 1,
              anticipatePin: 1,
              invalidateOnRefresh: true
            }
          });

          // Header enters and glows
          if (whyHeader) {
            whyTl.fromTo(whyHeader,
              { y: 30, opacity: 0.3, scale: 0.96 },
              { y: 0, opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out' },
              0
            );
          }

          // 4 Purity Cards cascade in sequentially with 3D perspective and depth
          if (whyCards.length) {
            whyCards.forEach((card, idx) => {
              const iconBox = card.querySelector('.why-icon-box');

              whyTl.fromTo(card,
                {
                  y: 90,
                  opacity: 0,
                  scale: 0.88,
                  rotateY: -8,
                  transformPerspective: 800
                },
                {
                  y: 0,
                  opacity: 1,
                  scale: 1,
                  rotateY: 0,
                  duration: 0.45,
                  ease: 'power2.out'
                },
                0.2 + idx * 0.16
              );

              if (iconBox) {
                whyTl.fromTo(iconBox,
                  { scale: 0.7, opacity: 0.4 },
                  { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.5)' },
                  0.35 + idx * 0.16
                );
              }
            });

            // Smooth settlement before pin releases
            whyTl.to(whyCards, {
              y: 0,
              duration: 0.2,
              ease: 'power1.inOut'
            });
          }
        }

        // ====================================================================
        // 4. BRAND STORY & HERITAGE VIDEO (Cinematic Parallax & Story Scrub)
        // ====================================================================
        const brandSection = document.getElementById('brandStory');
        if (brandSection) {
          const bgVideo = brandSection.querySelector('.heritage-bg-video');
          const brandCard = brandSection.querySelector('.heritage-card');
          const highlightCards = brandSection.querySelectorAll('.heritage-highlight-card');
          const ctaRow = brandSection.querySelector('.heritage-cta-row');

          // Parallax depth on background video
          if (bgVideo) {
            gsap.fromTo(bgVideo,
              { yPercent: -12, scale: 1.15 },
              {
                yPercent: 12,
                scale: 1.02,
                ease: 'none',
                scrollTrigger: {
                  trigger: brandSection,
                  start: 'top bottom',
                  end: 'bottom top',
                  scrub: 1
                }
              }
            );
          }

          // Floating Heritage Card with Scrubbed Timeline
          if (brandCard) {
            const cardTl = gsap.timeline({
              scrollTrigger: {
                trigger: brandSection,
                start: 'top 80%',
                end: 'center 45%',
                scrub: 1
              }
            });

            cardTl.fromTo(brandCard,
              { y: 80, opacity: 0.2, scale: 0.94, rotateX: 4, transformPerspective: 1000 },
              { y: 0, opacity: 1, scale: 1, rotateX: 0, duration: 0.6, ease: 'power2.out' },
              0
            );

            if (highlightCards.length) {
              cardTl.fromTo(highlightCards,
                { x: -30, opacity: 0.15 },
                { x: 0, opacity: 1, stagger: 0.12, duration: 0.5, ease: 'power2.out' },
                0.25
              );
            }

            if (ctaRow) {
              cardTl.fromTo(ctaRow,
                { y: 25, opacity: 0.2 },
                { y: 0, opacity: 1, duration: 0.35, ease: 'power2.out' },
                0.55
              );
            }
          }
        }

        // ====================================================================
        // 5. SUPPORT & ASSISTANCE SECTION (Multi-Column Scrubbed Entrance)
        // ====================================================================
        const supportSection = document.getElementById('needHelp');
        if (supportSection) {
          const supportCard = supportSection.querySelector('.support-card');
          if (supportCard) {
            const leftCol = supportCard.firstElementChild;
            const rightCol = supportCard.lastElementChild;

            const supportTl = gsap.timeline({
              scrollTrigger: {
                trigger: supportSection,
                start: 'top 85%',
                end: 'center 50%',
                scrub: 0.8
              }
            });

            if (leftCol) {
              supportTl.fromTo(leftCol,
                { x: -50, opacity: 0.15 },
                { x: 0, opacity: 1, duration: 0.5, ease: 'power2.out' },
                0
              );
            }

            if (rightCol) {
              supportTl.fromTo(rightCol,
                { x: 50, opacity: 0.15, scale: 0.96 },
                { x: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'power2.out' },
                0.1
              );
            }
          }
        }

        // ====================================================================
        // 6. FOOTER ENTRANCE
        // ====================================================================
        const footer = document.querySelector('.site-footer');
        if (footer) {
          const footerCols = footer.querySelectorAll('.footer-brand, .footer-accordion-col');
          if (footerCols.length) {
            gsap.fromTo(footerCols,
              { y: 40, opacity: 0.2 },
              {
                y: 0,
                opacity: 1,
                stagger: 0.1,
                ease: 'power2.out',
                scrollTrigger: {
                  trigger: footer,
                  start: 'top 95%',
                  end: 'bottom bottom',
                  scrub: 1
                }
              }
            );
          }
        }
      });
    },

    setupMobileAnimations() {
      this.mm.add('(max-width: 991px)', () => {
        // Mobile & Tablet: Fluid, lightweight scrub animations without heavy pinning
        const sections = document.querySelectorAll('.hero-carousel-section, #shopProducts, #whyChooseHipa, #brandStory, #needHelp');

        sections.forEach(sec => {
          const header = sec.querySelector('.section-header, .heritage-card, .support-card');
          if (header) {
            gsap.fromTo(header,
              { y: 35, opacity: 0.3 },
              {
                y: 0,
                opacity: 1,
                ease: 'power1.out',
                scrollTrigger: {
                  trigger: sec,
                  start: 'top 85%',
                  end: 'top 50%',
                  scrub: 0.6
                }
              }
            );
          }
        });

        // Why cards light stagger on mobile
        const whyCards = document.querySelectorAll('#whyChooseHipa .why-card');
        if (whyCards.length) {
          gsap.fromTo(whyCards,
            { y: 30, opacity: 0.3 },
            {
              y: 0,
              opacity: 1,
              stagger: 0.08,
              ease: 'power1.out',
              scrollTrigger: {
                trigger: '#whyChooseHipa',
                start: 'top 75%',
                end: 'center 55%',
                scrub: 0.6
              }
            }
          );
        }
      });
    },

    bindGlobalEvents() {
      // Refresh ScrollTrigger calculations after all images & fonts finish loading
      window.addEventListener('load', () => {
        ScrollTrigger.refresh();
      });

      // Recalculate after dynamic content updates or pack size switches
      window.addEventListener('resize', () => {
        ScrollTrigger.refresh();
      });
    }
  };

  // Expose on window
  window.ScrollExperience = ScrollExperience;

  // Initialize once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ScrollExperience.init());
  } else {
    ScrollExperience.init();
  }
})();

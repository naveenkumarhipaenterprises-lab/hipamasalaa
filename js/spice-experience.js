/**
 * HIPA MASALA — ADVANCED INTERACTIVE FOOTER EXPERIENCE (js/spice-experience.js)
 * Concept: "FROM SPICE TO FLAVOUR"
 * Pure vanilla JS, 60fps CSS transitions, responsive, accessible, zero dependencies.
 */

(function () {
  'use strict';

  const SpicePalettes = {
    'chilli': {
      name: 'Guntur Red Chilli',
      particles: ['#DC2626', '#EF4444', '#B91C1C', '#F87171'],
      count: 16
    },
    'turmeric': {
      name: 'Erode Turmeric',
      particles: ['#F59E0B', '#FBBF24', '#D97706', '#FCD34D'],
      count: 18
    },
    'pepper': {
      name: 'Tellicherry Black Pepper',
      particles: ['#1F2937', '#374151', '#4B5563', '#111827'],
      count: 14
    },
    'cumin': {
      name: 'Aromatic Cumin',
      particles: ['#92400E', '#B45309', '#78350F', '#A16207'],
      count: 16
    },
    'coriander': {
      name: 'Golden Coriander',
      particles: ['#D97706', '#CA8A04', '#B45309', '#EAB308'],
      count: 16
    },
    'curry-leaf': {
      name: 'Fresh Curry Leaf',
      particles: ['#16A34A', '#15803D', '#22C55E', '#4ADE80'],
      count: 15
    }
  };

  const SpiceExperience = {
    container: null,
    stage: null,
    mortar: null,
    particleContainer: null,
    aromaContainer: null,
    successBadge: null,
    announcer: null,
    isBusy: false,
    activeTimeouts: [],

    init: function () {
      this.container = document.getElementById('spiceExperience');
      if (!this.container) return;

      this.stage = this.container.querySelector('.spice-stage');
      this.mortar = this.container.querySelector('.mortar-unit');
      this.particleContainer = this.container.querySelector('.particle-container');
      this.aromaContainer = this.container.querySelector('.aroma-container');
      this.successBadge = this.container.querySelector('.spice-success-badge');
      this.announcer = this.container.querySelector('#spiceAnnouncer');

      this.bindEvents();
    },

    bindEvents: function () {
      const spices = this.container.querySelectorAll('.spice-item');
      spices.forEach(spice => {
        spice.addEventListener('click', (e) => {
          e.preventDefault();
          this.handleSpiceClick(spice);
        });

        // Keyboard activation (Enter / Space)
        spice.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.handleSpiceClick(spice);
          }
        });
      });
    },

    handleSpiceClick: function (spiceEl) {
      if (this.isBusy) return;

      const spiceType = spiceEl.getAttribute('data-spice') || 'chilli';
      const spiceData = SpicePalettes[spiceType] || SpicePalettes['chilli'];

      this.isBusy = true;
      this.container.classList.add('is-busy');

      // Announce for screen readers
      if (this.announcer) {
        this.announcer.textContent = `Grinding ${spiceData.name} in stone mortar.`;
      }

      // STEP 1 & 2: Calculate flight path to mortar cavity
      const stageRect = this.stage.getBoundingClientRect();
      const spiceRect = spiceEl.getBoundingClientRect();
      const mortarRect = this.mortar.getBoundingClientRect();

      // Target cavity center (top center of the mortar bowl)
      const targetX = (mortarRect.left + mortarRect.width / 2) - (spiceRect.left + spiceRect.width / 2);
      const targetY = (mortarRect.top + mortarRect.height * 0.35) - (spiceRect.top + spiceRect.height / 2);

      // Add flight class and apply translation
      spiceEl.classList.add('is-flying');
      spiceEl.style.transform = `translate(${targetX}px, ${targetY}px) scale(0.4) rotate(45deg)`;
      spiceEl.style.opacity = '0';

      // STEP 3: Impact after flight animation (~720ms)
      this.setTimeoutSafe(() => {
        // Mortar bounce & pestle grind
        this.mortar.classList.add('is-impacted', 'is-grinding');

        // STEP 4: Spawn tailored particles
        this.spawnParticles(spiceData);

        // STEP 5: Aroma rise
        if (this.aromaContainer) {
          this.aromaContainer.classList.add('is-active');
        }

        // STEP 6: Show elegant success message badge
        if (this.successBadge) {
          this.successBadge.classList.add('is-visible');
        }

        if (this.announcer) {
          this.announcer.textContent = `From spice to flavour: ${spiceData.name} freshly ground.`;
        }

        // STEP 7: Reset scene smoothly
        this.setTimeoutSafe(() => {
          this.resetScene(spiceEl);
        }, 1800);

      }, 720);
    },

    spawnParticles: function (spiceData) {
      if (!this.particleContainer) return;
      this.particleContainer.innerHTML = '';

      const count = spiceData.count || 16;
      const palette = spiceData.particles;

      for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = 'spice-particle';

        const color = palette[Math.floor(Math.random() * palette.length)];
        const size = 3 + Math.random() * 4;
        const angle = (-70 + Math.random() * 140) * (Math.PI / 180); // Upward dispersion arc
        const distance = 28 + Math.random() * 55;
        const destX = Math.sin(angle) * distance;
        const destY = -Math.cos(angle) * distance;
        const duration = 0.55 + Math.random() * 0.45;
        const delay = Math.random() * 0.12;

        p.style.backgroundColor = color;
        p.style.width = `${size}px`;
        p.style.height = `${size}px`;
        p.style.left = '50%';
        p.style.top = '40%';
        p.style.transition = `transform ${duration}s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, opacity ${duration}s ease ${delay}s`;

        this.particleContainer.appendChild(p);

        // Trigger particle animation on next microtask
        requestAnimationFrame(() => {
          p.style.transform = `translate(${destX}px, ${destY}px) scale(0.6)`;
          p.style.opacity = '0.9';

          // Fade out towards end
          this.setTimeoutSafe(() => {
            p.style.opacity = '0';
          }, (duration + delay) * 600);
        });
      }
    },

    resetScene: function (spiceEl) {
      // 1. Fade out badge
      if (this.successBadge) {
        this.successBadge.classList.remove('is-visible');
      }

      // 2. Clear aroma & mortar classes
      if (this.aromaContainer) {
        this.aromaContainer.classList.remove('is-active');
      }
      this.mortar.classList.remove('is-impacted', 'is-grinding');

      // 3. Clear particles
      if (this.particleContainer) {
        this.particleContainer.innerHTML = '';
      }

      // 4. Return spice back to orbital position
      spiceEl.style.transition = 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.45s ease';
      spiceEl.style.transform = '';
      spiceEl.style.opacity = '1';

      this.setTimeoutSafe(() => {
        spiceEl.classList.remove('is-flying');
        spiceEl.style.transition = '';
        this.container.classList.remove('is-busy');
        this.isBusy = false;
      }, 480);
    },

    setTimeoutSafe: function (fn, delay) {
      const id = window.setTimeout(fn, delay);
      this.activeTimeouts.push(id);
      return id;
    },

    destroy: function () {
      this.activeTimeouts.forEach(id => window.clearTimeout(id));
      this.activeTimeouts = [];
      this.isBusy = false;
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    SpiceExperience.init();
  });

  window.SpiceExperience = SpiceExperience;
})();

/**
 * HIPA MASALA — "FROM SPICE TO FLAVOUR" INTERACTIVE FOOTER EXPERIENCE
 * Pure Vanilla JavaScript with high performance hardware-accelerated transforms,
 * realistic physics, micro-powder dispersion, delicate aroma, and full accessibility.
 */

(function () {
  'use strict';

  function initSpiceExperience() {
    const stage = document.querySelector('.spice-stage');
    if (!stage) return;

    const pestle = stage.querySelector('.mortar-pestle-img');
    const mortar = stage.querySelector('.mortar-unit');
    const particleContainer = stage.querySelector('.particle-container');
    const aromaContainer = stage.querySelector('.aroma-container');
    const flavourBadge = document.getElementById('spiceFlavourBadge');
    const announcer = document.getElementById('spiceAnnouncer');
    const spiceButtons = stage.querySelectorAll('.spice-item');

    if (!pestle || !mortar || !spiceButtons.length) return;

    let isBusy = false;

    // Realistic spice profiles: specific particle colors, messages & screen reader text
    const SPICE_PROFILES = {
      chilli: {
        name: 'Guntur Red Chilli',
        particleColors: ['#DC2626', '#B91C1C', '#991B1B', '#EF4444'],
        announcement: 'Guntur dried red chilli crushed in the granite mortar, releasing vibrant piquancy and warmth.',
        badge: 'Freshly ground chilli. Piquant and fiery.'
      },
      pepper: {
        name: 'Tellicherry Black Pepper',
        particleColors: ['#27272A', '#18181B', '#3F3F46', '#52525B'],
        announcement: 'Tellicherry black peppercorns gently cracked, releasing bold pungent aroma and piperine warmth.',
        badge: 'Cracked Tellicherry pepper. Bold and aromatic.'
      },
      turmeric: {
        name: 'Erode Turmeric Root',
        particleColors: ['#F59E0B', '#D97706', '#B45309', '#FBBF24'],
        announcement: 'Erode whole turmeric root ground into rich golden powder with earthy curcumin notes.',
        badge: 'Stone-ground golden turmeric. Rich and pure.'
      },
      cardamom: {
        name: 'Green Cardamom Pod',
        particleColors: ['#65A30D', '#84CC16', '#4D7C0F', '#A3E635'],
        announcement: 'Fresh green cardamom pod cracked open, dispersing sweet floral camphor notes.',
        badge: 'Cracked green cardamom. Sweet, floral essence.'
      },
      cumin: {
        name: 'Jeera / Cumin Seeds',
        particleColors: ['#92400E', '#B45309', '#78350F', '#A16207'],
        announcement: 'Dry roasted cumin seeds crushed into fragrant, nutty South Indian masala powder.',
        badge: 'Freshly ground jeera. Warm, toasted aroma.'
      },
      coriander: {
        name: 'Dhania / Coriander Seeds',
        particleColors: ['#B45309', '#D97706', '#92400E', '#D97706'],
        announcement: 'Whole coriander seeds milled in granite, releasing gentle citrusy, herbal flavour.',
        badge: 'Milled coriander seeds. Herbaceous and citrusy.'
      },
      cinnamon: {
        name: 'Ceylon Cinnamon Bark',
        particleColors: ['#78350F', '#92400E', '#5B2910', '#A16207'],
        announcement: 'Ceylon cinnamon bark quills crushed, unfolding sweet woody spice aroma.',
        badge: 'Ground Ceylon cinnamon. Sweet, woody richness.'
      }
    };

    spiceButtons.forEach(btn => {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        triggerSpiceInteraction(btn);
      });

      // Keyboard accessibility
      btn.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          triggerSpiceInteraction(btn);
        }
      });
    });

    function triggerSpiceInteraction(spiceBtn) {
      if (isBusy) return;
      isBusy = true;

      const spiceType = spiceBtn.getAttribute('data-spice') || 'chilli';
      const profile = SPICE_PROFILES[spiceType] || SPICE_PROFILES.chilli;

      // 1. Calculate physical coordinates to bowl center
      const stageRect = stage.getBoundingClientRect();
      const spiceRect = spiceBtn.getBoundingClientRect();
      const mortarRect = mortar.getBoundingClientRect();

      // Destination: Mortar cavity center (slightly above bottom)
      const targetX = (mortarRect.left + mortarRect.width / 2) - stageRect.left;
      const targetY = (mortarRect.top + mortarRect.height * 0.42) - stageRect.top;

      // Start: Spice center
      const startX = (spiceRect.left + spiceRect.width / 2) - stageRect.left;
      const startY = (spiceRect.top + spiceRect.height / 2) - stageRect.top;

      const deltaX = targetX - startX;
      const deltaY = targetY - startY;

      // Pause idle drift
      spiceBtn.style.animation = 'none';

      // 2. Perform smooth curved trajectory into mortar bowl
      spiceBtn.style.transition = 'transform 0.55s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.55s ease';
      spiceBtn.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.35) rotate(${getSpiceSpinAngle(spiceType)}deg)`;
      spiceBtn.style.opacity = '0.3';
      spiceBtn.style.zIndex = '4'; // Slides into mortar behind pestle

      // 3. Grinding & Impact when spice reaches bowl
      setTimeout(() => {
        // Hide ingredient inside mortar
        spiceBtn.style.opacity = '0';

        // Pestle grinding motion
        pestle.classList.add('pestle-grinding');
        mortar.classList.add('mortar-impact');

        // Spawn realistic micro particles
        createMicroParticles(profile.particleColors);

        // Spawn delicate aroma wisps
        triggerAromaWisps();

        // Show flavor badge
        if (flavourBadge) {
          const badgeText = flavourBadge.querySelector('.badge-text') || flavourBadge;
          badgeText.textContent = profile.badge;
          flavourBadge.classList.add('active');
        }

        // Screen reader announcement
        if (announcer) {
          announcer.textContent = profile.announcement;
        }
      }, 550);

      // 4. Reset Scene smoothly after 2.3 seconds
      setTimeout(() => {
        pestle.classList.remove('pestle-grinding');
        mortar.classList.remove('mortar-impact');

        if (flavourBadge) {
          flavourBadge.classList.remove('active');
        }

        // Reset spice button
        spiceBtn.style.transition = 'transform 0.4s ease, opacity 0.4s ease';
        spiceBtn.style.transform = '';
        spiceBtn.style.opacity = '1';
        spiceBtn.style.zIndex = '10';

        setTimeout(() => {
          spiceBtn.style.animation = '';
          spiceBtn.style.transition = '';
          isBusy = false;
        }, 400);

      }, 2300);
    }

    function getSpiceSpinAngle(spiceType) {
      switch (spiceType) {
        case 'pepper': return 80;
        case 'cumin': return 120;
        case 'chilli': return -45;
        case 'turmeric': return 25;
        case 'coriander': return 40;
        case 'cinnamon': return -30;
        case 'cardamom': return -20;
        default: return 45;
      }
    }

    // Realistic, micro-powder dispersion (strictly confined to mortar bowl cavity)
    function createMicroParticles(colors) {
      if (!particleContainer) return;
      particleContainer.innerHTML = '';

      const particleCount = 10;
      for (let i = 0; i < particleCount; i++) {
        const p = document.createElement('div');
        p.className = 'micro-spice-particle';

        const size = Math.random() * 2 + 1.8; // 1.8px - 3.8px
        const color = colors[Math.floor(Math.random() * colors.length)];

        // Random dispersion within 20px radius of bowl cavity
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * 22;
        const tx = Math.cos(angle) * dist;
        const ty = Math.sin(angle) * dist * 0.5 - (Math.random() * 10); // slight oval spread

        p.style.width = `${size}px`;
        p.style.height = `${size}px`;
        p.style.backgroundColor = color;
        p.style.left = '50%';
        p.style.top = '50%';
        p.style.transform = 'translate(-50%, -50%)';

        particleContainer.appendChild(p);

        // Animate using Web Animations API or fallback
        if (p.animate) {
          p.animate([
            { opacity: 0, transform: 'translate(-50%, -50%) scale(0.5)' },
            { opacity: 0.85, transform: `translate(calc(-50% + ${tx * 0.6}px), calc(-50% + ${ty * 0.6}px)) scale(1.1)`, offset: 0.4 },
            { opacity: 0.6, transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(1)`, offset: 0.8 },
            { opacity: 0, transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty + 4}px)) scale(0.8)`, offset: 1.0 }
          ], {
            duration: 800 + Math.random() * 300,
            easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
            fill: 'forwards'
          });
        }
      }
    }

    // Delicate Aroma Wisps (Translucent, natural evaporation)
    function triggerAromaWisps() {
      if (!aromaContainer) return;
      aromaContainer.innerHTML = '';

      for (let i = 0; i < 3; i++) {
        const wisp = document.createElement('div');
        wisp.className = 'aroma-wisp';
        wisp.style.left = `${30 + i * 18}%`;
        wisp.style.animationDelay = `${i * 0.15}s`;
        aromaContainer.appendChild(wisp);

        // Trigger animation
        requestAnimationFrame(() => {
          wisp.classList.add('wisp-active');
        });
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSpiceExperience);
  } else {
    initSpiceExperience();
  }
})();

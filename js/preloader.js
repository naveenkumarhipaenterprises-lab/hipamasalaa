/**
 * HIPA MASALAS ANIMATED WEBSITE PRELOADER
 * Injects branded preloader and hides it cleanly on page load with fallback.
 */

(function() {
  function createPreloader() {
    if (document.getElementById('sitePreloader')) return;

    const preloader = document.createElement('div');
    preloader.id = 'sitePreloader';
    preloader.className = 'site-preloader';
    preloader.setAttribute('aria-hidden', 'true');
    preloader.innerHTML = `
      <div class="preloader-inner">
        <div class="preloader-brand-wrapper">
          <div class="preloader-ring"></div>
          <img class="preloader-logo-img" src="assets/images/logo.png" alt="HIPA Masalas">
        </div>
        <div class="preloader-title">HIPA <span>MASALA</span></div>
        <div class="preloader-tagline">Pure Spices • Authentic Aroma</div>
        <div class="preloader-bar-wrap">
          <div class="preloader-bar-progress"></div>
        </div>
      </div>
    `;

    document.body.prepend(preloader);

    function hidePreloader() {
      if (preloader.classList.contains('is-loaded')) return;
      preloader.classList.add('is-loaded');
      setTimeout(() => {
        if (preloader.parentNode) {
          preloader.parentNode.removeChild(preloader);
        }
      }, 500);
    }

    // Dismiss on full load or after fallback timeout (1.2s max)
    if (document.readyState === 'complete') {
      setTimeout(hidePreloader, 300);
    } else {
      window.addEventListener('load', () => setTimeout(hidePreloader, 350));
      setTimeout(hidePreloader, 1200); // Safety fallback so user is never blocked
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createPreloader);
  } else {
    createPreloader();
  }
})();

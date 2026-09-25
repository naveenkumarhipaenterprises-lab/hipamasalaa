/**
 * HIPA MASALAS — COOKIE CONSENT CONTROLLER
 * Lightweight, compliant privacy consent banner
 */

(function() {
  const CONSENT_KEY = 'hipa_cookie_consent';

  function initCookieConsent() {
    // If user has already made a choice, do not display
    if (localStorage.getItem(CONSENT_KEY)) {
      return;
    }

    // Create banner markup
    const banner = document.createElement('div');
    banner.className = 'hipa-cookie-banner';
    banner.id = 'hipaCookieBanner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Cookie Consent Notice');
    banner.innerHTML = `
      <div class="hipa-cookie-content">
        <div class="hipa-cookie-icon" aria-hidden="true">🍪</div>
        <div>
          <div class="hipa-cookie-title">We Value Your Privacy</div>
          <p class="hipa-cookie-text">
            We use cookies to maintain your shopping cart, remember your preferences, and ensure secure payments. By clicking "Accept All", you agree to our <a href="cookie-policy.html">Cookie Policy</a> and <a href="privacy-policy.html">Privacy Policy</a>.
          </p>
        </div>
      </div>
      <div class="hipa-cookie-actions">
        <button type="button" class="hipa-cookie-btn hipa-cookie-btn-decline" id="hipaCookieDecline">Essential Only</button>
        <button type="button" class="hipa-cookie-btn hipa-cookie-btn-accept" id="hipaCookieAccept">Accept All</button>
      </div>
    `;

    document.body.appendChild(banner);

    // Show after slight delay for smooth page entrance
    setTimeout(() => {
      banner.style.display = 'block';
    }, 600);

    const acceptBtn = document.getElementById('hipaCookieAccept');
    const declineBtn = document.getElementById('hipaCookieDecline');

    if (acceptBtn) {
      acceptBtn.addEventListener('click', () => {
        localStorage.setItem(CONSENT_KEY, 'all');
        banner.style.display = 'none';
      });
    }

    if (declineBtn) {
      declineBtn.addEventListener('click', () => {
        localStorage.setItem(CONSENT_KEY, 'essential');
        banner.style.display = 'none';
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCookieConsent);
  } else {
    initCookieConsent();
  }
})();

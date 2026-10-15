/**
 * Shared behaviour for login.html and signup.html:
 * return-to-checkout handling, Google sign-in button, password visibility toggle.
 */
const AuthPage = {
  returnUrl: function() {
    const params = new URLSearchParams(window.location.search);
    return window.HipaAuth.safeReturnUrl(params.get('returnUrl')) || '';
  },

  isCheckoutFlow: function() {
    const params = new URLSearchParams(window.location.search);
    return params.get('reason') === 'checkout' || /^checkout\.html/.test(this.returnUrl());
  },

  goBack: function() {
    window.location.href = this.returnUrl() || 'account.html';
  },

  /** Keeps ?returnUrl=… when switching between login and signup. */
  carryReturnUrl: function() {
    const query = window.location.search;
    if (!query) return;
    document.querySelectorAll('a[href="signup.html"], a[href="login.html"]').forEach(a => {
      a.setAttribute('href', a.getAttribute('href') + query);
    });
  },

  showCheckoutNotice: function() {
    const notice = document.getElementById('authCheckoutNotice');
    if (notice && this.isCheckoutFlow()) notice.hidden = false;
  },

  initGoogle: function() {
    const wrap = document.getElementById('authGoogleWrap');
    const btn = document.getElementById('googleSignInBtn');
    if (!wrap || !btn || !window.HipaAuth.isLive()) return;
    wrap.hidden = false;
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      try {
        await window.HipaAuth.signInWithGoogle(this.returnUrl() || 'account.html');
      } catch (err) {
        btn.disabled = false;
        this.showAlert(err.message || 'Google sign-in failed. Please use email instead.', 'error');
      }
    });
  },

  showAlert: function(message, type) {
    const alertBox = document.getElementById('authAlert');
    if (!alertBox) return;
    alertBox.className = `auth-alert-box is-${type}`;
    alertBox.textContent = message;
  },

  init: async function() {
    this.carryReturnUrl();
    this.showCheckoutNotice();
    await window.HipaAuth.ready;
    // Already signed in: skip straight to where they were going.
    if (window.HipaAuth.isAuthenticated()) {
      this.goBack();
      return;
    }
    this.initGoogle();
  }
};

function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';
  btn.setAttribute('aria-pressed', String(isPassword));
  btn.innerHTML = isPassword
    ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>'
    : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
}

document.addEventListener('DOMContentLoaded', () => AuthPage.init());
window.AuthPage = AuthPage;

/**
 * HIPA MASALAS CONTACT PAGE ENGINE
 * Interactive Floating Labels, Real-Time Validation, Character Counter, 3-State Submit, and Success Card
 */

const ContactPage = {
  form: null,
  submitBtn: null,
  charCounter: null,
  successCard: null,
  formContainer: null,

  init: function() {
    this.form = document.getElementById('hipaContactForm');
    if (!this.form) return;

    this.submitBtn = document.getElementById('contactSubmitBtn');
    this.charCounter = document.getElementById('charCounter');
    this.successCard = document.getElementById('formSuccessCard');
    this.formContainer = document.getElementById('formContainer');

    this.bindEvents();
    this.initCharacterCounter();
  },

  bindEvents: function() {
    // Input validation on blur & input
    const fields = [
      { id: 'contactFullName', validator: this.validateName },
      { id: 'contactPhone', validator: this.validatePhone },
      { id: 'contactEmail', validator: this.validateEmail },
      { id: 'contactSubject', validator: this.validateSubject },
      { id: 'contactMessage', validator: this.validateMessage }
    ];

    fields.forEach(f => {
      const el = document.getElementById(f.id);
      if (!el) return;

      el.addEventListener('blur', () => {
        f.validator.call(this, el);
      });

      el.addEventListener('input', () => {
        const group = el.closest('.floating-group');
        if (group && group.classList.contains('is-invalid')) {
          f.validator.call(this, el);
        }
      });
    });

    // Form submission
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });

    // Reset button in success screen
    const resetBtn = document.getElementById('btnResetForm');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetForm());
    }
  },

  initCharacterCounter: function() {
    const msgEl = document.getElementById('contactMessage');
    if (!msgEl || !this.charCounter) return;

    msgEl.addEventListener('input', () => {
      const len = msgEl.value.length;
      this.charCounter.textContent = len;
      if (len > 500) {
        this.charCounter.style.color = '#DC2626';
      } else {
        this.charCounter.style.color = 'var(--text-light)';
      }
    });
  },

  validateName: function(el) {
    const val = el.value.trim();
    if (val.length < 2) {
      this.setFieldState(el, false, 'Please enter your full name (minimum 2 characters)');
      return false;
    }
    this.setFieldState(el, true, '✓ Looks good');
    return true;
  },

  validatePhone: function(el) {
    const val = el.value.trim().replace(/[\s-]/g, '');
    const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
    if (!val || val.length < 10 || !phoneRegex.test(val)) {
      this.setFieldState(el, false, 'Please enter a valid 10-digit phone number');
      return false;
    }
    this.setFieldState(el, true, '✓ Valid phone number');
    return true;
  },

  validateEmail: function(el) {
    const val = el.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!val || !emailRegex.test(val)) {
      this.setFieldState(el, false, 'Please enter a valid email address');
      return false;
    }
    this.setFieldState(el, true, '✓ Valid email address');
    return true;
  },

  validateSubject: function(el) {
    const val = el.value.trim();
    if (val.length < 3) {
      this.setFieldState(el, false, 'Please enter a subject (minimum 3 characters)');
      return false;
    }
    this.setFieldState(el, true, '✓ Looks good');
    return true;
  },

  validateMessage: function(el) {
    const val = el.value.trim();
    if (val.length < 10) {
      this.setFieldState(el, false, 'Please describe your inquiry (minimum 10 characters)');
      return false;
    }
    if (val.length > 500) {
      this.setFieldState(el, false, 'Message exceeds 500 characters');
      return false;
    }
    this.setFieldState(el, true, '✓ Looks good');
    return true;
  },

  setFieldState: function(el, isValid, msg) {
    const group = el.closest('.floating-group');
    if (!group) return;

    const msgEl = group.querySelector('.field-validation-msg');

    if (isValid) {
      group.classList.remove('is-invalid');
      group.classList.add('is-valid');
      if (msgEl) msgEl.textContent = msg;
    } else {
      group.classList.remove('is-valid');
      group.classList.add('is-invalid');
      if (msgEl) msgEl.textContent = msg;
    }
  },

  handleSubmit: function() {
    const nameEl = document.getElementById('contactFullName');
    const phoneEl = document.getElementById('contactPhone');
    const emailEl = document.getElementById('contactEmail');
    const subjectEl = document.getElementById('contactSubject');
    const msgEl = document.getElementById('contactMessage');

    const isNameValid = this.validateName(nameEl);
    const isPhoneValid = this.validatePhone(phoneEl);
    const isEmailValid = this.validateEmail(emailEl);
    const isSubjectValid = this.validateSubject(subjectEl);
    const isMsgValid = this.validateMessage(msgEl);

    if (!isNameValid || !isPhoneValid || !isEmailValid || !isSubjectValid || !isMsgValid) {
      if (window.Cart && typeof window.Cart.showToast === 'function') {
        window.Cart.showToast('Please correct the highlighted fields before submitting.');
      }
      return;
    }

    // State 1: Loading
    const btnText = this.submitBtn.querySelector('.btn-text');
    this.submitBtn.classList.add('is-loading');
    this.submitBtn.disabled = true;
    if (btnText) btnText.textContent = 'SENDING MESSAGE...';

    setTimeout(() => {
      // State 2: Success Button State
      this.submitBtn.classList.remove('is-loading');
      this.submitBtn.classList.add('is-success');
      if (btnText) btnText.textContent = 'MESSAGE SENT ✓';

      if (window.Cart && typeof window.Cart.showToast === 'function') {
        window.Cart.showToast('Your message has been sent successfully.');
      }

      setTimeout(() => {
        // Transition to Full Success Card Screen
        if (this.formContainer && this.successCard) {
          this.formContainer.style.display = 'none';
          this.successCard.style.display = 'flex';

          const refCodeEl = document.getElementById('successRefCode');
          if (refCodeEl) {
            const randomRef = 'HP-' + Math.floor(10000 + Math.random() * 90000);
            refCodeEl.textContent = randomRef;
          }
        }
      }, 700);
    }, 1200);
  },

  resetForm: function() {
    if (this.form) this.form.reset();

    document.querySelectorAll('.floating-group').forEach(g => {
      g.classList.remove('is-valid', 'is-invalid');
      const msgEl = g.querySelector('.field-validation-msg');
      if (msgEl) msgEl.textContent = '';
    });

    if (this.charCounter) {
      this.charCounter.textContent = '0';
      this.charCounter.style.color = 'var(--text-light)';
    }

    if (this.submitBtn) {
      this.submitBtn.classList.remove('is-loading', 'is-success');
      this.submitBtn.disabled = false;
      const btnText = this.submitBtn.querySelector('.btn-text');
      if (btnText) btnText.textContent = 'SEND MESSAGE';
    }

    if (this.formContainer && this.successCard) {
      this.successCard.style.display = 'none';
      this.formContainer.style.display = 'block';
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  ContactPage.init();
});
window.ContactPage = ContactPage;

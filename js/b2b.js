/**
 * HIPA MASALAS — B2B BULK SUPPLY ENGINE (js/b2b.js)
 * Clean, compact form handling, strict validation, resilient submission,
 * duplicate-submission protection, and instant feedback.
 */

(function () {
  'use strict';

  const B2BApp = {
    formEl: null,
    submitBtn: null,
    formCardEl: null,
    successCardEl: null,
    isSubmitting: false,

    init: function () {
      this.formEl = document.getElementById('hipaB2bForm');
      this.submitBtn = document.getElementById('b2bSubmitBtn');
      this.formCardEl = document.getElementById('b2bFormCard');
      this.successCardEl = document.getElementById('b2bSuccessCard');

      if (!this.formEl) return;

      this.bindEvents();
      this.checkUrlPreselect();
    },

    bindEvents: function () {
      this.formEl.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSubmit();
      });

      // Reset button
      const resetBtn = document.getElementById('b2bResetBtn');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          this.resetForm();
        });
      }

      // Inline clear errors on input
      const inputs = this.formEl.querySelectorAll('input, select, textarea');
      inputs.forEach(input => {
        input.addEventListener('input', () => {
          input.classList.remove('is-invalid');
          const errEl = document.getElementById('err_' + input.id);
          if (errEl) errEl.textContent = '';
        });
      });

      // Clear product checkbox error on change
      const checkboxes = this.formEl.querySelectorAll('input[name="products"]');
      checkboxes.forEach(cb => {
        cb.addEventListener('change', () => {
          const errEl = document.getElementById('err_products');
          if (errEl) errEl.textContent = '';
        });
      });
    },

    checkUrlPreselect: function () {
      const params = new URLSearchParams(window.location.search);
      const product = params.get('product');
      if (product) {
        const checkboxes = this.formEl.querySelectorAll('input[name="products"]');
        checkboxes.forEach(cb => {
          if (cb.value.toLowerCase().includes(product.toLowerCase().replace('-', ' '))) {
            cb.checked = true;
          }
        });
      }
    },

    validate: function () {
      let isValid = true;
      let firstErrorField = null;

      const setError = (id, message) => {
        const el = document.getElementById(id);
        const errEl = document.getElementById('err_' + id);
        if (el) el.classList.add('is-invalid');
        if (errEl) errEl.textContent = message;
        if (!firstErrorField && el) firstErrorField = el;
        isValid = false;
      };

      const clearError = (id) => {
        const el = document.getElementById(id);
        const errEl = document.getElementById('err_' + id);
        if (el) el.classList.remove('is-invalid');
        if (errEl) errEl.textContent = '';
      };

      // 1. Full Name
      const name = document.getElementById('b2bFullName');
      if (!name || !name.value.trim() || name.value.trim().length < 2) {
        setError('b2bFullName', 'Please enter your full name.');
      } else {
        clearError('b2bFullName');
      }

      // 2. Business Name
      const company = document.getElementById('b2bCompanyName');
      if (!company || !company.value.trim() || company.value.trim().length < 2) {
        setError('b2bCompanyName', 'Please enter your business or company name.');
      } else {
        clearError('b2bCompanyName');
      }

      // 3. Mobile Number (10 digits)
      const phone = document.getElementById('b2bPhone');
      const phoneDigits = phone ? phone.value.replace(/\D/g, '') : '';
      if (!phone || phoneDigits.length !== 10 || !/^[6-9]\d{9}$/.test(phoneDigits)) {
        setError('b2bPhone', 'Please enter a valid 10-digit mobile number.');
      } else {
        clearError('b2bPhone');
      }

      // 4. Email
      const email = document.getElementById('b2bEmail');
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !email.value.trim() || !emailRegex.test(email.value.trim())) {
        setError('b2bEmail', 'Please enter a valid email address.');
      } else {
        clearError('b2bEmail');
      }

      // 5. City
      const city = document.getElementById('b2bCity');
      if (!city || !city.value.trim() || city.value.trim().length < 2) {
        setError('b2bCity', 'Please enter your city / location.');
      } else {
        clearError('b2bCity');
      }

      // 6. Business Type
      const bType = document.getElementById('b2bBusinessType');
      if (!bType || !bType.value) {
        setError('b2bBusinessType', 'Please select your business type.');
      } else {
        clearError('b2bBusinessType');
      }

      // 7. Products (at least one)
      const selectedProds = Array.from(this.formEl.querySelectorAll('input[name="products"]:checked')).map(cb => cb.value);
      const errProd = document.getElementById('err_products');
      if (selectedProds.length === 0) {
        if (errProd) errProd.textContent = 'Please select at least one product.';
        if (!firstErrorField) firstErrorField = this.formEl.querySelector('input[name="products"]');
        isValid = false;
      } else {
        if (errProd) errProd.textContent = '';
      }

      // 8. Bulk Volume
      const qty = document.getElementById('b2bBulkQty');
      if (!qty || !qty.value) {
        setError('b2bBulkQty', 'Please select your estimated volume.');
      } else {
        clearError('b2bBulkQty');
      }

      if (firstErrorField) {
        firstErrorField.focus();
      }

      return isValid;
    },

    handleSubmit: async function () {
      if (this.isSubmitting) return;

      if (!this.validate()) return;

      this.isSubmitting = true;
      this.setLoading(true);

      const refCode = 'B2B-' + Math.floor(10000 + Math.random() * 90000);
      const selectedProds = Array.from(this.formEl.querySelectorAll('input[name="products"]:checked')).map(cb => cb.value);

      const payload = {
        refCode,
        fullName: document.getElementById('b2bFullName').value.trim(),
        companyName: document.getElementById('b2bCompanyName').value.trim(),
        phone: document.getElementById('b2bPhone').value.trim(),
        email: document.getElementById('b2bEmail').value.trim(),
        city: document.getElementById('b2bCity').value.trim(),
        businessType: document.getElementById('b2bBusinessType').value,
        products: selectedProds,
        bulkRequirement: document.getElementById('b2bBulkQty').value,
        message: (document.getElementById('b2bMessage') ? document.getElementById('b2bMessage').value.trim() : ''),
        createdAt: new Date().toISOString()
      };

      // 1. Always persist to localStorage for resilience
      try {
        const stored = JSON.parse(localStorage.getItem('hipa_b2b_enquiries') || '[]');
        stored.unshift(payload);
        localStorage.setItem('hipa_b2b_enquiries', JSON.stringify(stored));
      } catch (e) {
        console.warn('Local storage error:', e);
      }

      // 2. Submit to backend API if available
      try {
        await fetch('/api/b2b-enquiry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (e) {
        // Backend failure will not disrupt customer experience
      }

      // 3. Show Success State
      setTimeout(() => {
        this.setLoading(false);
        this.isSubmitting = false;
        this.showSuccess(payload);
      }, 400);
    },

    setLoading: function (loading) {
      if (!this.submitBtn) return;
      const spinner = this.submitBtn.querySelector('.btn-spinner');
      const text = this.submitBtn.querySelector('.btn-text');

      if (loading) {
        this.submitBtn.disabled = true;
        this.submitBtn.style.opacity = '0.7';
        if (spinner) spinner.style.display = 'inline-block';
        if (text) text.textContent = 'Submitting Enquiry...';
      } else {
        this.submitBtn.disabled = false;
        this.submitBtn.style.opacity = '1';
        if (spinner) spinner.style.display = 'none';
        if (text) text.innerHTML = 'Submit Bulk Enquiry &rarr;';
      }
    },

    showSuccess: function (data) {
      if (this.formEl) this.formEl.style.display = 'none';
      if (this.successCardEl) {
        this.successCardEl.style.display = 'block';

        const refCodeEl = document.getElementById('b2bSuccessRef');
        if (refCodeEl) refCodeEl.textContent = data.refCode;

        // Setup WhatsApp Direct Link
        const waBtn = document.getElementById('b2bSuccessWhatsappLink');
        if (waBtn) {
          const waText = encodeURIComponent(
            `Hello HIPA Masalas B2B Team, I submitted a bulk enquiry (${data.refCode}).\n` +
            `Company: ${data.companyName}\n` +
            `Contact: ${data.fullName} (${data.phone})\n` +
            `Requirement: ${data.bulkRequirement} for ${data.products.join(', ')}.\n` +
            `Please share the best commercial quotation.`
          );
          waBtn.href = `https://wa.me/917058053055?text=${waText}`;
        }

        this.successCardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    },

    resetForm: function () {
      if (this.formEl) {
        this.formEl.reset();
        this.formEl.style.display = 'block';
      }
      if (this.successCardEl) {
        this.successCardEl.style.display = 'none';
      }
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    B2BApp.init();
  });

  window.B2BApp = B2BApp;
})();

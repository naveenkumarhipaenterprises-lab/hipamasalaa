/**
 * HIPA MASALA B2B BULK SUPPLY & WHOLESALE ENGINE (b2b.js)
 * Manages Dynamic Product-to-Pack-Size mapping, Multi-product builder,
 * Form Validation, Resilient Local & Supabase Lead Submission, WhatsApp dispatch,
 * and Analytics Event Tracking.
 */

(function() {
  'use strict';

  // Analytics Tracker Utility (supports window.dataLayer, window.gtag, and CustomEvents)
  const B2BAnalytics = {
    track: function(eventName, eventParams = {}) {
      try {
        const payload = {
          event: eventName,
          page: 'b2b-bulk-supply',
          timestamp: new Date().toISOString(),
          ...eventParams
        };

        if (window.dataLayer && Array.isArray(window.dataLayer)) {
          window.dataLayer.push(payload);
        }

        if (typeof window.gtag === 'function') {
          window.gtag('event', eventName, payload);
        }

        window.dispatchEvent(new CustomEvent('hipa_analytics', { detail: payload }));
      } catch (e) {
        // Analytics failure should never block UI
      }
    }
  };

  const B2BApp = {
    productsListEl: null,
    formEl: null,
    submitBtn: null,
    successCardEl: null,
    formWrapperEl: null,
    formStarted: false,
    rowCounter: 0,

    init: function() {
      this.productsListEl = document.getElementById('b2bProductsList');
      this.formEl = document.getElementById('hipaB2bForm');
      this.submitBtn = document.getElementById('b2bSubmitBtn');
      this.successCardEl = document.getElementById('b2bSuccessCard');
      this.formWrapperEl = document.getElementById('b2bFormInner');

      if (!this.formEl || !this.productsListEl) return;

      this.initProductRows();
      this.bindEvents();
      this.initCharCounter();
      this.initFaqAccordion();
      this.checkUrlPreselect();

      // Track B2B Page View
      B2BAnalytics.track('b2b_page_view', {
        title: document.title,
        url: window.location.href
      });
    },

    // Get catalog products from centralized data or fallback
    getProducts: function() {
      if (window.HIPA_PRODUCTS && Array.isArray(window.HIPA_PRODUCTS) && window.HIPA_PRODUCTS.length > 0) {
        return window.HIPA_PRODUCTS;
      }
      return [
        { id: "hipa-sambar-powder", name: "Sambar Powder", variants: [{ size: "100g" }, { size: "200g" }, { size: "500g" }, { size: "1kg" }] },
        { id: "hipa-rasam-powder", name: "Rasam Powder", variants: [{ size: "100g" }, { size: "200g" }, { size: "500g" }, { size: "1kg" }] },
        { id: "hipa-garam-masala", name: "Garam Masala", variants: [{ size: "100g" }, { size: "200g" }, { size: "500g" }] },
        { id: "hipa-turmeric-powder", name: "Turmeric Powder", variants: [{ size: "100g" }, { size: "200g" }, { size: "500g" }, { size: "1kg" }] },
        { id: "hipa-red-chilli-powder", name: "Red Chilli Powder", variants: [{ size: "100g" }, { size: "200g" }, { size: "500g" }, { size: "1kg" }] },
        { id: "hipa-coriander-powder", name: "Coriander Powder", variants: [{ size: "100g" }, { size: "200g" }, { size: "500g" }, { size: "1kg" }] },
        { id: "hipa-cumin-powder", name: "Cumin Powder", variants: [{ size: "100g" }, { size: "200g" }, { size: "500g" }] },
        { id: "hipa-pepper-powder", name: "Pepper Powder", variants: [{ size: "50g" }, { size: "100g" }, { size: "200g" }, { size: "500g" }] }
      ];
    },

    // Initial setup with first product row
    initProductRows: function() {
      this.productsListEl.innerHTML = '';
      this.addProductRow();
    },

    // Add a new dynamic product row (Product -> Pack Sizes -> Quantity)
    addProductRow: function(preselectSlug = null, preselectSize = null) {
      this.rowCounter++;
      const rowId = `b2b_row_${this.rowCounter}`;
      const products = this.getProducts();

      const row = document.createElement('div');
      row.className = 'b2b-product-row';
      row.id = rowId;

      // Product Options HTML
      let prodOptionsHtml = '<option value="" disabled selected>-- Select HIPA Product --</option>';
      products.forEach(p => {
        const isSelected = (preselectSlug && (p.slug === preselectSlug || p.id === preselectSlug)) ? 'selected' : '';
        prodOptionsHtml += `<option value="${p.id}" ${isSelected}>${p.name}</option>`;
      });

      row.innerHTML = `
        <div class="row-field product-row-col-prod">
          <label for="${rowId}_prod">Product Required <span style="color:var(--color-primary)">*</span></label>
          <select id="${rowId}_prod" class="b2b-row-product" required aria-label="Select Product">
            ${prodOptionsHtml}
          </select>
        </div>

        <div class="row-field product-row-col-pack">
          <label for="${rowId}_size">Preferred Pack Size <span style="color:var(--color-primary)">*</span></label>
          <select id="${rowId}_size" class="b2b-row-size" required aria-label="Select Pack Size">
            <option value="" disabled selected>-- Select Pack Size --</option>
          </select>
        </div>

        <div class="row-field product-row-col-qty">
          <label for="${rowId}_qty">Est. Quantity <span style="color:var(--color-primary)">*</span></label>
          <input type="number" id="${rowId}_qty" class="b2b-row-qty" min="1" step="1" placeholder="e.g. 100" required aria-label="Estimated Quantity">
        </div>

        <div class="row-field product-row-col-unit">
          <label for="${rowId}_unit">Unit</label>
          <select id="${rowId}_unit" class="b2b-row-unit" aria-label="Quantity Unit">
            <option value="Packets" selected>Packets</option>
            <option value="Boxes">Boxes</option>
            <option value="Cartons">Cartons</option>
            <option value="Kg">Kg</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div class="product-row-col-remove">
          <button type="button" class="btn-remove-row" title="Remove this product" aria-label="Remove Product">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      `;

      this.productsListEl.appendChild(row);

      const prodSelect = row.querySelector('.b2b-row-product');
      const sizeSelect = row.querySelector('.b2b-row-size');
      const removeBtn = row.querySelector('.btn-remove-row');

      // Populate pack sizes when product changes
      prodSelect.addEventListener('change', () => {
        this.updatePackSizes(prodSelect.value, sizeSelect);
      });

      // If preselected, trigger pack size population
      if (preselectSlug || prodSelect.value) {
        this.updatePackSizes(prodSelect.value, sizeSelect, preselectSize);
      }

      // Remove row handler
      removeBtn.addEventListener('click', () => {
        const totalRows = this.productsListEl.querySelectorAll('.b2b-product-row').length;
        if (totalRows <= 1) {
          if (window.Cart && typeof window.Cart.showToast === 'function') {
            window.Cart.showToast('At least one product requirement is required.');
          } else {
            alert('At least one product requirement is required.');
          }
          return;
        }
        row.remove();
        this.updateRemoveButtonsState();
      });

      this.updateRemoveButtonsState();
      return row;
    },

    // Dynamically update available pack sizes strictly based on selected product
    updatePackSizes: function(productId, sizeSelectEl, preselectedSize = null) {
      if (!productId || !sizeSelectEl) return;
      const products = this.getProducts();
      const product = products.find(p => p.id === productId || p.slug === productId);

      sizeSelectEl.innerHTML = '<option value="" disabled selected>-- Select Pack Size --</option>';

      if (product && product.variants && product.variants.length > 0) {
        product.variants.forEach(v => {
          const opt = document.createElement('option');
          opt.value = v.size;
          opt.textContent = v.size;
          if (preselectedSize && preselectedSize === v.size) {
            opt.selected = true;
          }
          sizeSelectEl.appendChild(opt);
        });

        // If only 1 size or preselected is not set, don't force select, let user confirm or default to first
        if (preselectedSize) {
          sizeSelectEl.value = preselectedSize;
        } else if (product.variants.length === 1) {
          sizeSelectEl.selectedIndex = 1;
        }
      }
    },

    // Enable/disable remove button based on row count
    updateRemoveButtonsState: function() {
      const rows = this.productsListEl.querySelectorAll('.b2b-product-row');
      rows.forEach(r => {
        const btn = r.querySelector('.btn-remove-row');
        if (btn) {
          btn.style.display = rows.length > 1 ? 'flex' : 'none';
        }
      });
    },

    // Bind form events, validation, CTAs, and analytics
    bindEvents: function() {
      // Add row button
      const addRowBtn = document.getElementById('b2bAddProductRowBtn');
      if (addRowBtn) {
        addRowBtn.addEventListener('click', () => {
          this.addProductRow();
        });
      }

      // Track form start on first interaction
      this.formEl.addEventListener('input', () => {
        if (!this.formStarted) {
          this.formStarted = true;
          B2BAnalytics.track('b2b_form_start');
        }
      }, { once: true });

      // Field blur validation
      const fields = [
        { id: 'b2bFullName', validator: this.validateName },
        { id: 'b2bCompanyName', validator: this.validateCompany },
        { id: 'b2bPhone', validator: this.validatePhone },
        { id: 'b2bEmail', validator: this.validateEmail },
        { id: 'b2bBusinessType', validator: this.validateBusinessType },
        { id: 'b2bCity', validator: this.validateCity },
        { id: 'b2bState', validator: this.validateState }
      ];

      fields.forEach(f => {
        const el = document.getElementById(f.id);
        if (!el) return;

        el.addEventListener('blur', () => {
          f.validator.call(this, el);
        });

        el.addEventListener('input', () => {
          const group = el.closest('.b2b-field-group');
          if (group && group.classList.contains('is-invalid')) {
            f.validator.call(this, el);
          }
        });
      });

      // Form submission
      this.formEl.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSubmit();
      });

      // Reset form button in success card
      const resetBtn = document.getElementById('b2bResetFormBtn');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          this.resetForm();
        });
      }

      // Track CTA clicks (Request Pricing, WhatsApp, Phone)
      document.querySelectorAll('.js-b2b-request-pricing').forEach(btn => {
        btn.addEventListener('click', (e) => {
          B2BAnalytics.track('b2b_request_pricing_click', {
            location: btn.getAttribute('data-location') || 'hero'
          });
          const target = document.getElementById('b2bEnquirySection');
          if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth' });
          }
        });
      });

      document.querySelectorAll('.js-b2b-whatsapp').forEach(btn => {
        btn.addEventListener('click', () => {
          B2BAnalytics.track('b2b_whatsapp_click', {
            location: btn.getAttribute('data-location') || 'general'
          });
        });
      });

      document.querySelectorAll('.js-b2b-phone').forEach(btn => {
        btn.addEventListener('click', () => {
          B2BAnalytics.track('b2b_phone_click', {
            location: btn.getAttribute('data-location') || 'general'
          });
        });
      });

      // Product catalog card "Select for Bulk Enquiry" buttons
      document.querySelectorAll('.js-select-catalog-product').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const prodSlug = btn.getAttribute('data-product-slug');
          this.selectProductForEnquiry(prodSlug);
        });
      });
    },

    // Check URL parameters for preselected product (e.g. ?product=garam-masala)
    checkUrlPreselect: function() {
      const urlParams = new URLSearchParams(window.location.search);
      const prodSlug = urlParams.get('product') || urlParams.get('p');
      if (prodSlug) {
        this.selectProductForEnquiry(prodSlug);
      }
    },

    // Select a product from the catalog directly into the form
    selectProductForEnquiry: function(prodSlug) {
      if (!prodSlug) return;
      const products = this.getProducts();
      const product = products.find(p => p.slug === prodSlug || p.id === prodSlug);
      if (!product) return;

      // Check if first row is unselected, if so update it; otherwise add a new row
      const firstRow = this.productsListEl.querySelector('.b2b-product-row');
      const firstSelect = firstRow ? firstRow.querySelector('.b2b-row-product') : null;

      if (firstSelect && !firstSelect.value) {
        firstSelect.value = product.id;
        const sizeSelect = firstRow.querySelector('.b2b-row-size');
        this.updatePackSizes(product.id, sizeSelect);
      } else {
        this.addProductRow(product.id);
      }

      // Smooth scroll to form section
      const formSection = document.getElementById('b2bEnquirySection');
      if (formSection) {
        formSection.scrollIntoView({ behavior: 'smooth' });
      }
    },

    // Character counter for the large requirement textarea
    initCharCounter: function() {
      const textarea = document.getElementById('b2bRequirementDetails');
      const counter = document.getElementById('b2bCharCounter');
      if (!textarea || !counter) return;

      textarea.addEventListener('input', () => {
        const len = textarea.value.length;
        counter.textContent = len;
        if (len > 1000) {
          counter.style.color = '#DC2626';
        } else {
          counter.style.color = 'var(--text-light)';
        }
      });
    },

    // FAQ Accordion
    initFaqAccordion: function() {
      document.querySelectorAll('.b2b-faq-question').forEach(btn => {
        btn.addEventListener('click', () => {
          const item = btn.closest('.b2b-faq-item');
          if (!item) return;
          const isOpen = item.classList.contains('is-open');
          
          // Optional: close other open items
          document.querySelectorAll('.b2b-faq-item.is-open').forEach(openItem => {
            if (openItem !== item) openItem.classList.remove('is-open');
          });

          item.classList.toggle('is-open', !isOpen);
        });
      });
    },

    // Validation Methods
    validateName: function(el) {
      const val = el.value.trim();
      if (val.length < 2) {
        this.setFieldState(el, false, 'Please enter your full name (minimum 2 characters)');
        return false;
      }
      this.setFieldState(el, true);
      return true;
    },

    validateCompany: function(el) {
      const val = el.value.trim();
      if (val.length < 2) {
        this.setFieldState(el, false, 'Please enter your business or company name');
        return false;
      }
      this.setFieldState(el, true);
      return true;
    },

    validatePhone: function(el) {
      const val = el.value.trim().replace(/[\s-]/g, '');
      const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
      if (!val || val.length < 10 || !phoneRegex.test(val)) {
        this.setFieldState(el, false, 'Please enter a valid 10-digit mobile number');
        return false;
      }
      this.setFieldState(el, true);
      return true;
    },

    validateEmail: function(el) {
      const val = el.value.trim();
      if (!val) {
        // Email is optional in B2B form specs, but if empty it is valid
        this.setFieldState(el, true);
        return true;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(val)) {
        this.setFieldState(el, false, 'Please enter a valid email address');
        return false;
      }
      this.setFieldState(el, true);
      return true;
    },

    validateBusinessType: function(el) {
      const val = el.value.trim();
      if (!val) {
        this.setFieldState(el, false, 'Please select your business type');
        return false;
      }
      this.setFieldState(el, true);
      return true;
    },

    validateCity: function(el) {
      const val = el.value.trim();
      if (val.length < 2) {
        this.setFieldState(el, false, 'Please enter your city');
        return false;
      }
      this.setFieldState(el, true);
      return true;
    },

    validateState: function(el) {
      const val = el.value.trim();
      if (!val) {
        this.setFieldState(el, false, 'Please select your state');
        return false;
      }
      this.setFieldState(el, true);
      return true;
    },

    setFieldState: function(el, isValid, msg = '') {
      const group = el.closest('.b2b-field-group');
      if (!group) return;
      const msgEl = group.querySelector('.b2b-validation-msg');

      if (isValid) {
        group.classList.remove('is-invalid');
        group.classList.add('is-valid');
        if (msgEl) msgEl.textContent = '';
      } else {
        group.classList.remove('is-valid');
        group.classList.add('is-invalid');
        if (msgEl) msgEl.textContent = msg;
      }
    },

    // Collect dynamic product rows
    getProductsData: function() {
      const rows = this.productsListEl.querySelectorAll('.b2b-product-row');
      const items = [];
      let hasError = false;

      rows.forEach(r => {
        const prodSelect = r.querySelector('.b2b-row-product');
        const sizeSelect = r.querySelector('.b2b-row-size');
        const qtyInput = r.querySelector('.b2b-row-qty');
        const unitSelect = r.querySelector('.b2b-row-unit');

        const productId = prodSelect ? prodSelect.value : '';
        const packSize = sizeSelect ? sizeSelect.value : '';
        const qty = qtyInput ? parseInt(qtyInput.value, 10) : 0;
        const unit = unitSelect ? unitSelect.value : 'Packets';

        if (!productId || !packSize || isNaN(qty) || qty <= 0) {
          hasError = true;
          r.style.borderColor = '#DC2626';
        } else {
          r.style.borderColor = 'var(--border-color)';
          const prodObj = this.getProducts().find(p => p.id === productId || p.slug === productId);
          items.push({
            productId: productId,
            productName: prodObj ? prodObj.name : productId,
            packSize: packSize,
            quantity: qty,
            quantityUnit: unit
          });
        }
      });

      return { items, hasError };
    },

    // Handle complete B2B form submission
    handleSubmit: async function() {
      const nameEl = document.getElementById('b2bFullName');
      const companyEl = document.getElementById('b2bCompanyName');
      const phoneEl = document.getElementById('b2bPhone');
      const emailEl = document.getElementById('b2bEmail');
      const busTypeEl = document.getElementById('b2bBusinessType');
      const cityEl = document.getElementById('b2bCity');
      const stateEl = document.getElementById('b2bState');
      const pinEl = document.getElementById('b2bPinCode');
      const reqDetailsEl = document.getElementById('b2bRequirementDetails');

      // Validate base fields
      const isNameValid = this.validateName(nameEl);
      const isCompanyValid = this.validateCompany(companyEl);
      const isPhoneValid = this.validatePhone(phoneEl);
      const isEmailValid = this.validateEmail(emailEl);
      const isBusTypeValid = this.validateBusinessType(busTypeEl);
      const isCityValid = this.validateCity(cityEl);
      const isStateValid = this.validateState(stateEl);

      // Validate products requirement
      const { items, hasError } = this.getProductsData();

      if (!isNameValid || !isCompanyValid || !isPhoneValid || !isEmailValid || !isBusTypeValid || !isCityValid || !isStateValid || hasError || items.length === 0) {
        if (window.Cart && typeof window.Cart.showToast === 'function') {
          window.Cart.showToast('Please correct the highlighted fields and ensure product requirements are complete.');
        } else {
          alert('Please correct the highlighted fields and ensure product requirements are complete.');
        }
        return;
      }

      // Get Radio Selections (Frequency & Contact Method)
      const freqEl = document.querySelector('input[name="purchaseFrequency"]:checked');
      const contactEl = document.querySelector('input[name="preferredContactMethod"]:checked');

      const purchaseFrequency = freqEl ? freqEl.value : 'Not decided yet';
      const preferredContactMethod = contactEl ? contactEl.value : 'Phone';
      const pinCode = pinEl ? pinEl.value.trim() : '';
      const additionalRequirement = reqDetailsEl ? reqDetailsEl.value.trim() : '';

      // Build Enquiry Object
      const enquiryRef = 'B2B-' + Math.floor(10000 + Math.random() * 90000);
      const enquiryPayload = {
        refNumber: enquiryRef,
        createdAt: new Date().toISOString(),
        fullName: nameEl.value.trim(),
        companyName: companyEl.value.trim(),
        mobile: phoneEl.value.trim(),
        email: emailEl.value.trim(),
        businessType: busTypeEl.value,
        city: cityEl.value.trim(),
        state: stateEl.value,
        pinCode: pinCode,
        products: items,
        purchaseFrequency: purchaseFrequency,
        preferredContactMethod: preferredContactMethod,
        additionalRequirement: additionalRequirement
      };

      // Button Loading State
      this.submitBtn.classList.add('is-loading');
      this.submitBtn.disabled = true;

      // 1. Resilient Local Storage Persistence
      try {
        const savedEnquiries = JSON.parse(localStorage.getItem('hipa_b2b_enquiries') || '[]');
        savedEnquiries.unshift(enquiryPayload);
        localStorage.setItem('hipa_b2b_enquiries', JSON.stringify(savedEnquiries));
      } catch (e) {
        console.warn('Local storage write warning', e);
      }

      // 2. Supabase Cloud Integration (if live client configured)
      try {
        if (window.HipaAuth && window.HipaAuth.client) {
          await window.HipaAuth.client.from('b2b_enquiries').insert([
            {
              ref_code: enquiryRef,
              full_name: enquiryPayload.fullName,
              company_name: enquiryPayload.companyName,
              mobile: enquiryPayload.mobile,
              email: enquiryPayload.email,
              business_type: enquiryPayload.businessType,
              city: enquiryPayload.city,
              state: enquiryPayload.state,
              pincode: enquiryPayload.pinCode,
              products: enquiryPayload.products,
              purchase_frequency: enquiryPayload.purchaseFrequency,
              preferred_contact_method: enquiryPayload.preferredContactMethod,
              additional_requirement: enquiryPayload.additionalRequirement,
              created_at: enquiryPayload.createdAt
            }
          ]);
        }
      } catch (err) {
        // Resilient: customer never exposed to database or network errors
        console.info('Supabase sync stored locally in offline/fallback mode');
      }

      // Track B2B Form Submission Analytics
      B2BAnalytics.track('b2b_form_submit', {
        refNumber: enquiryRef,
        productsCount: items.length,
        businessType: enquiryPayload.businessType,
        state: enquiryPayload.state,
        preferredContactMethod: enquiryPayload.preferredContactMethod
      });

      // Brief simulated processing time for UX smoothness
      setTimeout(() => {
        this.submitBtn.classList.remove('is-loading');
        this.submitBtn.disabled = false;

        // Show Success View
        this.renderSuccessState(enquiryPayload);

        if (window.Cart && typeof window.Cart.showToast === 'function') {
          window.Cart.showToast('Your bulk requirement has been submitted successfully.');
        }
      }, 900);
    },

    // Render Success Card Screen
    renderSuccessState: function(payload) {
      if (!this.formWrapperEl || !this.successCardEl) return;

      this.formWrapperEl.style.display = 'none';
      this.successCardEl.style.display = 'flex';

      const refCodeEl = document.getElementById('b2bSuccessRefCode');
      if (refCodeEl) {
        refCodeEl.textContent = payload.refNumber;
      }

      const summaryEl = document.getElementById('b2bSuccessSummary');
      if (summaryEl) {
        const prodSummaryList = payload.products.map(p => 
          `<li><strong>${p.productName}</strong> (${p.packSize}): ${p.quantity} ${p.quantityUnit}</li>`
        ).join('');

        summaryEl.innerHTML = `
          <div style="background:#FAFAF9; border:1px solid var(--border-color); border-radius:var(--radius-sm); padding:16px 20px; text-align:left; margin-bottom:24px; font-size:0.875rem;">
            <div style="font-weight:800; color:var(--text-dark); margin-bottom:8px;">ENQUIRY SUMMARY</div>
            <p style="margin:0 0 4px;"><strong>Company:</strong> ${payload.companyName} (${payload.businessType})</p>
            <p style="margin:0 0 4px;"><strong>Contact Person:</strong> ${payload.fullName} | ${payload.mobile}</p>
            <p style="margin:0 0 10px;"><strong>Destination:</strong> ${payload.city}, ${payload.state}</p>
            <div style="font-weight:700; color:var(--text-dark); margin-bottom:4px;">Products Requested:</div>
            <ul style="margin:0; padding-left:18px; color:var(--text-body); line-height:1.5;">
              ${prodSummaryList}
            </ul>
          </div>
        `;
      }

      // Configure WhatsApp instant copy button
      const waSendBtn = document.getElementById('b2bSuccessWhatsAppBtn');
      if (waSendBtn) {
        const config = (window.HIPA_CONFIG && window.HIPA_CONFIG.whatsapp) || { phoneNumber: '917058053055' };
        const prodText = payload.products.map(p => `- ${p.productName} (${p.packSize}): ${p.quantity} ${p.quantityUnit}`).join('\n');
        const waMsg = `Hello HIPA Masala B2B Team,\n\nI have submitted a Bulk Order Enquiry (${payload.refNumber}).\n\n*Company:* ${payload.companyName} (${payload.businessType})\n*Name:* ${payload.fullName}\n*Phone:* ${payload.mobile}\n*Location:* ${payload.city}, ${payload.state}\n\n*Required Products:*\n${prodText}\n\n*Expected Frequency:* ${payload.purchaseFrequency}\n*Transport:* Requesting Free Transport details.\n\nPlease discuss best bulk pricing with me.`;
        
        waSendBtn.href = `https://wa.me/${config.phoneNumber}?text=${encodeURIComponent(waMsg)}`;
        waSendBtn.target = '_blank';
        waSendBtn.rel = 'noopener noreferrer';
      }

      // Scroll to success screen
      this.successCardEl.scrollIntoView({ behavior: 'smooth' });
    },

    // Reset Form for another submission
    resetForm: function() {
      if (this.formEl) this.formEl.reset();

      document.querySelectorAll('.b2b-field-group').forEach(g => {
        g.classList.remove('is-valid', 'is-invalid');
        const msgEl = g.querySelector('.b2b-validation-msg');
        if (msgEl) msgEl.textContent = '';
      });

      this.initProductRows();

      const counter = document.getElementById('b2bCharCounter');
      if (counter) counter.textContent = '0';

      if (this.formWrapperEl && this.successCardEl) {
        this.successCardEl.style.display = 'none';
        this.formWrapperEl.style.display = 'block';
        this.formWrapperEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Auto-initialize when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => B2BApp.init());
  } else {
    B2BApp.init();
  }

  window.B2BApp = B2BApp;
  window.B2BAnalytics = B2BAnalytics;

})();

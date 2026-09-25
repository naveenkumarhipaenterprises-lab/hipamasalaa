const fs = require('fs');

const cssToAppend = `
/* =========================================================
   COMPACT & PREMIUM B2B ENQUIRY REDESIGN (2-COLUMN DESKTOP)
   ========================================================= */
.b2b-form-section {
  padding: 70px 0;
  background: #FDFBF8;
  border-top: 1px solid #EFEAE2;
  border-bottom: 1px solid #EFEAE2;
}

.b2b-layout-2col {
  display: grid;
  grid-template-columns: 1fr 1.15fr;
  gap: 48px;
  align-items: start;
}

.b2b-info-col {
  padding-right: 12px;
}

.b2b-info-col .b2b-badge {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #92400E;
  background: #FEF3C7;
  border: 1px solid #FCD34D;
  padding: 4px 12px;
  border-radius: 9999px;
  margin-bottom: 14px;
}

.b2b-info-col .b2b-info-title {
  font-family: var(--font-heading, 'Playfair Display', serif);
  font-size: clamp(1.85rem, 3.2vw, 2.35rem);
  font-weight: 800;
  color: var(--text-dark, #111827);
  line-height: 1.25;
  margin-bottom: 16px;
}

.b2b-info-col .b2b-info-lead {
  font-size: 1rem;
  color: var(--text-body, #4B5563);
  line-height: 1.7;
  margin-bottom: 28px;
}

.b2b-benefits-list {
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin-bottom: 32px;
}

.b2b-benefit-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.b2b-benefit-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #FFF0ED;
  color: var(--color-primary, #9E1B1E);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.b2b-benefit-title {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--text-dark, #111827);
  margin-bottom: 4px;
}

.b2b-benefit-text {
  font-size: 0.84rem;
  color: var(--text-muted, #6B7280);
  line-height: 1.5;
  margin: 0;
}

.b2b-direct-contact-card {
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: var(--radius-sm, 12px);
  padding: 18px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.direct-contact-label {
  display: block;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-muted, #6B7280);
  margin-bottom: 10px;
}

.btn-whatsapp-direct {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: #25D366;
  color: #FFFFFF !important;
  font-size: 0.875rem;
  font-weight: 700;
  padding: 10px 18px;
  border-radius: 9999px;
  text-decoration: none;
  transition: transform 0.2s, background-color 0.2s;
}

.btn-whatsapp-direct:hover {
  background: #1EBE5D;
  transform: translateY(-2px);
}

.b2b-compact-card {
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: var(--radius-md, 16px);
  padding: 32px 28px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.06);
}

.b2b-card-header {
  margin-bottom: 22px;
  border-bottom: 1px solid #F3F4F6;
  padding-bottom: 16px;
}

.b2b-card-header h3 {
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--text-dark, #111827);
  margin-bottom: 6px;
}

.b2b-card-header p {
  font-size: 0.84rem;
  color: var(--text-muted, #6B7280);
  margin: 0;
  line-height: 1.5;
}

.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.form-group {
  margin-bottom: 14px;
}

.form-group label {
  display: block;
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--text-dark, #1F2937);
  margin-bottom: 5px;
}

.form-group label .req {
  color: #DC2626;
}

.form-input, .form-select, .form-textarea {
  width: 100%;
  padding: 10px 12px;
  font-size: 0.875rem;
  font-family: inherit;
  color: #111827;
  background: #FFFFFF;
  border: 1.5px solid #D1D5DB;
  border-radius: var(--radius-xs, 8px);
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}

.form-input:focus, .form-select:focus, .form-textarea:focus {
  outline: none;
  border-color: var(--color-primary, #9E1B1E);
  box-shadow: 0 0 0 3px rgba(158, 27, 30, 0.12);
}

.form-input.is-invalid, .form-select.is-invalid {
  border-color: #DC2626;
  background-color: #FEF2F2;
}

.field-error {
  display: block;
  font-size: 0.75rem;
  color: #DC2626;
  margin-top: 4px;
  min-height: 14px;
}

.product-chips-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-top: 4px;
}

.prod-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  font-weight: 600;
  color: #374151;
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  padding: 6px 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}

.prod-chip:hover {
  background: #F3F4F6;
  border-color: #D1D5DB;
}

.prod-chip input[type="checkbox"] {
  accent-color: var(--color-primary, #9E1B1E);
  cursor: pointer;
}

.btn-b2b-submit {
  width: 100%;
  padding: 13px 20px;
  font-size: 0.9375rem;
  font-weight: 700;
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.form-footnote {
  font-size: 0.75rem;
  color: var(--text-muted, #6B7280);
  text-align: center;
  margin-top: 10px;
  margin-bottom: 0;
}

.b2b-success-panel {
  text-align: center;
  padding: 24px 12px;
}

.success-icon-badge {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #ECFDF5;
  color: #059669;
  font-size: 1.75rem;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
  border: 2px solid #A7F3D0;
}

.b2b-success-panel h3 {
  font-size: 1.35rem;
  font-weight: 800;
  color: #111827;
  margin-bottom: 6px;
}

.success-main-msg {
  font-size: 0.95rem;
  font-weight: 600;
  color: #059669;
  margin-bottom: 16px;
}

.success-ref-pill {
  display: inline-block;
  background: #F3F4F6;
  border: 1px dashed #D1D5DB;
  border-radius: 9999px;
  padding: 6px 16px;
  font-size: 0.8125rem;
  color: #374151;
  margin-bottom: 16px;
}

.success-sub-text {
  font-size: 0.84rem;
  color: #6B7280;
  line-height: 1.5;
  max-width: 380px;
  margin: 0 auto 20px;
}

.success-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
}

.btn-text-link {
  background: transparent;
  border: none;
  color: var(--color-primary, #9E1B1E);
  font-size: 0.8125rem;
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
  padding: 4px;
}

@media (max-width: 900px) {
  .b2b-layout-2col {
    grid-template-columns: 1fr;
    gap: 36px;
  }
  .b2b-info-col {
    padding-right: 0;
  }
}

@media (max-width: 540px) {
  .form-row-2 {
    grid-template-columns: 1fr;
    gap: 0;
  }
  .b2b-compact-card {
    padding: 22px 16px;
  }
  .product-chips-grid {
    grid-template-columns: 1fr;
  }
}
`;

fs.appendFileSync('css/b2b.css', cssToAppend, 'utf8');
console.log('Appended compact 2-column B2B form styles to css/b2b.css');

/**
 * HIPA MASALAS FLOATING WHATSAPP BUTTON COMPONENT
 * Reads business number & message from centralized config and injects responsive widget.
 */

(function() {
  function initWhatsAppWidget() {
    if (document.getElementById('hipaFloatingWhatsApp')) return;

    const config = (window.HIPA_CONFIG && window.HIPA_CONFIG.whatsapp) || {
      phoneNumber: '917058053055',
      defaultMessage: 'Hello HIPA Masalas, I would like to know more about your products.',
      label: 'Chat with us'
    };

    const encodedMsg = encodeURIComponent(config.defaultMessage);
    const waUrl = `https://wa.me/${config.phoneNumber}?text=${encodedMsg}`;

    const widget = document.createElement('a');
    widget.id = 'hipaFloatingWhatsApp';
    widget.className = 'floating-whatsapp-widget';
    widget.href = waUrl;
    widget.target = '_blank';
    widget.rel = 'noopener noreferrer';
    widget.setAttribute('aria-label', `${config.label} on WhatsApp`);
    widget.innerHTML = `
      <span class="whatsapp-icon-wrap" aria-hidden="true">
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 2a13.9 13.9 0 0 0-12 21l-1.9 6.9 7.1-1.9A14 14 0 1 0 16 2zm8.2 19.8c-.3.9-1.9 1.7-2.6 1.8-.7.1-1.6.2-5.2-1.3-4.3-1.8-7.1-6.2-7.3-6.5-.2-.3-1.8-2.4-1.8-4.6s1.1-3.2 1.5-3.6c.4-.4.9-.5 1.2-.5h.9c.3 0 .7 0 1 .7.4.9 1.3 3.1 1.4 3.3.1.2.2.4 0 .7-.1.3-.3.4-.5.7-.2.2-.4.5-.6.7-.2.2-.4.5-.2.9.3.6 1.3 2.1 2.8 3.4 1.9 1.7 3.5 2.2 4 2.5.5.2.8.2 1.1-.1.3-.4 1.3-1.5 1.6-2 .3-.5.7-.4 1.1-.3s2.9 1.4 3.4 1.6c.5.3.8.4.9.6.2.3.2 1.4-.1 2.3z"/>
        </svg>
      </span>
      <span class="whatsapp-label">${config.label}</span>
    `;

    document.body.appendChild(widget);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWhatsAppWidget);
  } else {
    initWhatsAppWidget();
  }
})();

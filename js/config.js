/**
 * HIPA MASALA E-COMMERCE CENTRAL CONFIGURATION
 * Single source of truth for external services, contact channels, and store settings.
 */

window.HIPA_CONFIG = {
  // WhatsApp Business Integration
  whatsapp: {
    // Configurable HIPA business WhatsApp number (Country code 91 + 10 digits, no +, no spaces)
    phoneNumber: '917058053055',
    // Default pre-filled message when customer initiates chat
    defaultMessage: 'Hello HIPA Masala, I would like to know more about your products.',
    // Optional display label
    label: 'Chat with us'
  },

  // Supabase PostgreSQL + Auth Configuration
  supabase: {
    // Replace with your live project credentials or set via environment
    url: window.__HIPA_SUPABASE_URL__ || 'https://vkmjklxquidqopkvdzvy.supabase.co',
    anonKey: window.__HIPA_SUPABASE_ANON_KEY__ || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder'
  },

  // E-Commerce Store Rules
  store: {
    name: 'HIPA Masala Online Store',
    tagline: 'Authentic Taste. Everyday Tradition.',
    minOrderValue: 999, // ₹999 Minimum Online Order Value
    supportPhone: '+91 70580 53055',
    supportEmail: 'support@hipamasalas.com',
    currencySymbol: '₹',
    storageKeys: {
      cart: 'hipa_masala_cart_v2',
      wishlist: 'hipa_masala_wishlist_v1',
      auth: 'hipa_masala_auth_session'
    }
  }
};

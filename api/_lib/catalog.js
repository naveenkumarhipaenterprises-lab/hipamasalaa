/**
 * Server-side price catalog.
 * Reads js/products-data.js, the same file the storefront renders from, so the
 * prices a customer sees and the prices they are charged can never drift apart.
 */
const { HIPA_PRODUCTS } = require('../../js/products-data.js');

const MIN_ORDER_VALUE = 999;
const SHIPPING_FEE = 0;

function findVariant(slug, size) {
  const product = HIPA_PRODUCTS.find(p => p.slug === slug);
  if (!product) return null;
  const variant = product.variants.find(v => v.size === size);
  if (!variant) return null;
  return { product, variant };
}

/**
 * Turns client cart lines into trusted order lines. Prices sent by the browser
 * are ignored; unknown products or sizes are rejected.
 */
function priceCart(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return { error: 'Your cart is empty.' };
  }
  if (items.length > 50) {
    return { error: 'Too many items in one order.' };
  }

  const lines = [];
  for (const item of items) {
    const match = findVariant(String(item.slug || ''), String(item.size || ''));
    if (!match) {
      return { error: `"${item.name || item.slug}" (${item.size}) is no longer available. Please remove it from your cart.` };
    }
    const quantity = parseInt(item.quantity, 10);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      return { error: `Invalid quantity for ${match.product.name}.` };
    }
    const existing = lines.find(l => l.slug === match.product.slug && l.size === match.variant.size);
    if (existing) {
      existing.quantity += quantity;
      existing.lineTotal = existing.unitPrice * existing.quantity;
      continue;
    }
    lines.push({
      slug: match.product.slug,
      name: match.product.name,
      size: match.variant.size,
      unitPrice: match.variant.price,
      quantity,
      lineTotal: match.variant.price * quantity,
      image: (match.variant.images && match.variant.images.frontWeb) || match.product.image
    });
  }

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  if (subtotal < MIN_ORDER_VALUE) {
    return { error: `Online orders need a minimum value of ₹${MIN_ORDER_VALUE}. Your cart is ₹${subtotal}.` };
  }
  const shipping = SHIPPING_FEE;
  return { lines, subtotal, shipping, total: subtotal + shipping };
}

module.exports = { HIPA_PRODUCTS, MIN_ORDER_VALUE, findVariant, priceCart };

const fs = require('fs');
const path = require('path');

const targetHtmlFiles = [
  'index.html',
  'shop.html',
  'product.html',
  'cart.html',
  'checkout.html',
  'about.html',
  'contact.html',
  'b2b-bulk-supply.html',
  'blog.html',
  'blog-details.html',
  'login.html',
  'signup.html',
  'account.html',
  'wishlist.html'
];

targetHtmlFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (!fs.existsSync(filePath)) return;
  let text = fs.readFileSync(filePath, 'utf8');

  // Brand in header: HIPA <span>MASALA</span> -> HIPA <span>MASALAS</span>
  text = text.replace(/HIPA\s*<span>\s*MASALA\s*<\/span>/g, 'HIPA <span>MASALAS</span>');
  text = text.replace(/HIPA\s*<span>\s*Masala\s*<\/span>/gi, 'HIPA <span>MASALAS</span>');

  // Replace "HIPA Masala" when NOT followed by "s", and NOT in email/URL like hipamasalas.com
  // Using negative lookahead: HIPA Masala(?![sS]|s\.com)
  text = text.replace(/\bHIPA\s+MASALA\b(?![sS])/g, 'HIPA MASALAS');
  text = text.replace(/\bHIPA\s+Masala\b(?![sS])/g, 'HIPA Masalas');
  text = text.replace(/\bHipa\s+Masala\b(?![sS])/g, 'HIPA Masalas');
  text = text.replace(/\bhipa\s+masala\b(?![sS])/g, 'HIPA Masalas');

  // Fix any accidental double 's' (e.g. HIPA Masalass)
  text = text.replace(/HIPA\s+Masalass\b/gi, 'HIPA Masalas');
  text = text.replace(/HIPA\s+MASALASS\b/g, 'HIPA MASALAS');

  fs.writeFileSync(filePath, text, 'utf8');
  console.log('Updated brand name in:', file);
});

// Update js/config.js, js/products-data.js, js/whatsapp.js
const targetJsFiles = [
  'js/config.js',
  'js/products-data.js',
  'js/whatsapp.js',
  'js/preloader.js',
  'js/shop.js',
  'js/product.js',
  'js/product-mockups.js',
  'js/product-viewer.js',
  'js/b2b.js',
  'js/contact.js',
  'js/account.js',
  'js/checkout.js',
  'js/wishlist-page.js'
];

targetJsFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (!fs.existsSync(filePath)) return;
  let text = fs.readFileSync(filePath, 'utf8');

  // Only replace visible user-facing strings, preserve storage keys like 'hipa_masala_cart_v2'
  text = text.replace(/name:\s*['"]HIPA Masala Online Store['"]/g, "name: 'HIPA Masalas Online Store'");
  text = text.replace(/Hello HIPA Masala/g, 'Hello HIPA Masalas');
  text = text.replace(/Hi HIPA Masala/g, 'Hi HIPA Masalas');
  text = text.replace(/\bHIPA Masala\b(?![sS])/g, 'HIPA Masalas');
  text = text.replace(/\bHIPA MASALA\b(?![sS])/g, 'HIPA MASALAS');
  text = text.replace(/HIPA\s+Masalass\b/gi, 'HIPA Masalas');

  fs.writeFileSync(filePath, text, 'utf8');
  console.log('Updated brand name in JS:', file);
});

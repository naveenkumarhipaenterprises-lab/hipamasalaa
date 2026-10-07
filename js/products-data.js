/**
 * HIPA Masala E-COMMERCE STOREFRONT
 * Centralized Product Data Architecture
 * Single source of truth for all 8 core products, variants, pack sizes, and prices.
 */

const HIPA_PRODUCTS = [
  {
    id: "hipa-sambar-powder",
    slug: "sambar-powder",
    name: "Sambar Powder",
    tamilName: "சாம்பார் பொடி",
    category: "masalas",
    categoryName: "Masala Powders",
    description: "Traditional blend of roasted lentils and spices for authentic South Indian sambar.",
    image: "assets/images/products/sambar/sambar-100g-front-web.png",
    imageAlt: "HIPA Masala Sambar Powder Pack",
    variants: [
      {
        size: "100g",
        price: 52,
        images: {
          front: "assets/images/products/sambar/sambar-100g-front.png",
          frontWeb: "assets/images/products/sambar/sambar-100g-front-web.png",
          back: "assets/images/products/sambar/sambar-100g-back.png",
          backWeb: "assets/images/products/sambar/sambar-100g-back-web.png"
        }
      },
      {
        size: "200g",
        price: 98,
        images: {
          front: "assets/images/products/sambar/sambar-200g-front.png",
          frontWeb: "assets/images/products/sambar/sambar-200g-front-web.png",
          back: "assets/images/products/sambar/sambar-200g-back.png",
          backWeb: "assets/images/products/sambar/sambar-200g-back-web.png"
        }
      },
      {
        size: "500g",
        price: 235,
        images: {
          front: "assets/images/products/sambar/sambar-500g-front.png",
          frontWeb: "assets/images/products/sambar/sambar-500g-front-web.png",
          back: "assets/images/products/sambar/sambar-500g-back.png",
          backWeb: "assets/images/products/sambar/sambar-500g-back-web.png"
        }
      },
      {
        size: "1kg",
        price: 450,
        images: {
          front: "assets/images/products/sambar/sambar-1kg-front.png",
          frontWeb: "assets/images/products/sambar/sambar-1kg-front-web.png",
          back: "assets/images/products/sambar/sambar-1kg-back.png",
          backWeb: "assets/images/products/sambar/sambar-1kg-back-web.png"
        }
      }
    ],
    ingredients: [
      "Coriander Seeds",
      "Red Chilli",
      "Toor Dal",
      "Chana Dal",
      "Cumin Seeds",
      "Fenugreek",
      "Turmeric",
      "Black Pepper",
      "Curry Leaves",
      "Asafoetida"
    ],
    details: [
      "Traditional roasted lentil and spice recipe",
      "Authentic aroma and natural flavour",
      "Hygienically packed in flavour-lock pouch"
    ],
    howToUse: [
      "Cook toor dal with tamarind extract, vegetables, and salt until tender.",
      "Add 2 teaspoons of HIPA Sambar Powder and simmer for 5-7 minutes.",
      "Temper with mustard seeds, curry leaves, and asafoetida in ghee/oil.",
      "Garnish with fresh coriander leaves and serve hot."
    ],
    storageInfo: "Store in a cool, dry place. Once opened, keep sealed in an airtight container."
  },
  {
    id: "hipa-rasam-powder",
    slug: "rasam-powder",
    name: "Rasam Powder",
    tamilName: "ரசம் பொடி",
    category: "masalas",
    categoryName: "Masala Powders",
    description: "Tangy, aromatic rasam powder crafted the traditional way with roasted spices.",
    image: "assets/images/products/rasam/rasam-100g-front-web.png",
    imageAlt: "HIPA Masala Rasam Powder Pack",
    variants: [
      {
        size: "100g",
        price: 54,
        images: {
          front: "assets/images/products/rasam/rasam-100g-front.png",
          frontWeb: "assets/images/products/rasam/rasam-100g-front-web.png",
          back: "assets/images/products/rasam/rasam-100g-back.png",
          backWeb: "assets/images/products/rasam/rasam-100g-back-web.png"
        }
      },
      {
        size: "200g",
        price: 102,
        images: {
          front: "assets/images/products/rasam/rasam-200g-front.png",
          frontWeb: "assets/images/products/rasam/rasam-200g-front-web.png",
          back: "assets/images/products/rasam/rasam-200g-back.png",
          backWeb: "assets/images/products/rasam/rasam-200g-back-web.png"
        }
      },
      {
        size: "500g",
        price: 245,
        images: {
          front: "assets/images/products/rasam/rasam-500g-front.png",
          frontWeb: "assets/images/products/rasam/rasam-500g-front-web.png",
          back: "assets/images/products/rasam/rasam-500g-back.png",
          backWeb: "assets/images/products/rasam/rasam-500g-back-web.png"
        }
      },
      {
        size: "1kg",
        price: 470,
        images: {
          front: "assets/images/products/rasam/rasam-1kg-front.png",
          frontWeb: "assets/images/products/rasam/rasam-1kg-front-web.png",
          back: "assets/images/products/rasam/rasam-1kg-back.png",
          backWeb: "assets/images/products/rasam/rasam-1kg-back-web.png"
        }
      }
    ],
    ingredients: [
      "Coriander Seeds",
      "Cumin Seeds",
      "Black Pepper",
      "Red Chilli",
      "Toor Dal",
      "Turmeric",
      "Curry Leaves",
      "Asafoetida"
    ],
    details: [
      "Coarsely ground for classic rasam clarity",
      "Rich in pepper and cumin aroma",
      "Pure spices without synthetic additives"
    ],
    howToUse: [
      "Boil mashed tomatoes and tamarind water with crushed garlic and turmeric.",
      "Add 1.5 to 2 teaspoons of HIPA Rasam Powder and salt to taste.",
      "Turn off the heat when it begins to froth at the edges; temper with mustard seeds and curry leaves."
    ],
    storageInfo: "Store in an airtight container in a dry place."
  },
  {
    id: "hipa-garam-masala",
    slug: "garam-masala",
    name: "Garam Masala",
    tamilName: "கரம் மசாலா",
    category: "masalas",
    categoryName: "Masala Powders",
    description: "A rich, warming blend of whole roasted spices for curries, gravies, and biryanis.",
    image: "assets/images/products/garam-masala/garam-masala-100g-front-web.png",
    imageAlt: "HIPA Masala Garam Masala Pack",
    variants: [
      {
        size: "100g",
        price: 82,
        images: {
          front: "assets/images/products/garam-masala/garam-masala-100g-front.png",
          frontWeb: "assets/images/products/garam-masala/garam-masala-100g-front-web.png",
          back: "assets/images/products/garam-masala/garam-masala-100g-back.png",
          backWeb: "assets/images/products/garam-masala/garam-masala-100g-back-web.png"
        }
      },
      {
        size: "200g",
        price: 158,
        images: {
          front: "assets/images/products/garam-masala/garam-masala-200g-front.png",
          frontWeb: "assets/images/products/garam-masala/garam-masala-200g-front-web.png",
          back: "assets/images/products/garam-masala/garam-masala-200g-back.png",
          backWeb: "assets/images/products/garam-masala/garam-masala-200g-back-web.png"
        }
      },
      {
        size: "500g",
        price: 380,
        images: {
          front: "assets/images/products/garam-masala/garam-masala-500g-front.png",
          frontWeb: "assets/images/products/garam-masala/garam-masala-500g-front-web.png",
          back: "assets/images/products/garam-masala/garam-masala-500g-back.png",
          backWeb: "assets/images/products/garam-masala/garam-masala-500g-back-web.png"
        }
      },
      {
        size: "1kg",
        price: 740,
        images: {
          front: "assets/images/products/garam-masala/garam-masala-1kg-front.png",
          frontWeb: "assets/images/products/garam-masala/garam-masala-1kg-front-web.png",
          back: "assets/images/products/garam-masala/garam-masala-1kg-back.png",
          backWeb: "assets/images/products/garam-masala/garam-masala-1kg-back-web.png"
        }
      }
    ],
    ingredients: [
      "Coriander Seeds",
      "Cumin Seeds",
      "Cinnamon",
      "Green Cardamom",
      "Black Cardamom",
      "Cloves",
      "Star Anise",
      "Bay Leaves",
      "Mace",
      "Nutmeg",
      "Fennel",
      "Black Pepper"
    ],
    details: [
      "Selected whole aromatic spices",
      "Slow-roasted for rich culinary depth",
      "Freshly ground to preserve essential spice oils"
    ],
    howToUse: [
      "Add 1/2 to 1 teaspoon towards the final minutes of cooking curries, gravies, or biryani.",
      "Cover with lid immediately to infuse the warm aromatic oils."
    ],
    storageInfo: "Store in a cool, airtight glass jar or pouch."
  },
  {
    id: "hipa-turmeric-powder",
    slug: "turmeric-powder",
    name: "Turmeric Powder",
    tamilName: "மஞ்சள் பொடி",
    category: "spices",
    categoryName: "Pure Spices",
    description: "Pure turmeric powder with natural golden colour and earthy aroma.",
    image: "assets/images/products/turmeric/turmeric-100g-front-web.png",
    imageAlt: "HIPA Masala Turmeric Powder Pack",
    variants: [
      {
        size: "100g",
        price: 38,
        images: {
          front: "assets/images/products/turmeric/turmeric-100g-front.png",
          frontWeb: "assets/images/products/turmeric/turmeric-100g-front-web.png",
          back: "assets/images/products/turmeric/turmeric-100g-back.png",
          backWeb: "assets/images/products/turmeric/turmeric-100g-back-web.png"
        }
      },
      {
        size: "200g",
        price: 72,
        images: {
          front: "assets/images/products/turmeric/turmeric-200g-front.png",
          frontWeb: "assets/images/products/turmeric/turmeric-200g-front-web.png",
          back: "assets/images/products/turmeric/turmeric-200g-back.png",
          backWeb: "assets/images/products/turmeric/turmeric-200g-back-web.png"
        }
      },
      {
        size: "500g",
        price: 170,
        images: {
          front: "assets/images/products/turmeric/turmeric-500g-front.png",
          frontWeb: "assets/images/products/turmeric/turmeric-500g-front-web.png",
          back: "assets/images/products/turmeric/turmeric-500g-back.png",
          backWeb: "assets/images/products/turmeric/turmeric-500g-back-web.png"
        }
      },
      {
        size: "1kg",
        price: 320,
        images: {
          front: "assets/images/products/turmeric/turmeric-1kg-front.png",
          frontWeb: "assets/images/products/turmeric/turmeric-1kg-front-web.png",
          back: "assets/images/products/turmeric/turmeric-1kg-back.png",
          backWeb: "assets/images/products/turmeric/turmeric-1kg-back-web.png"
        }
      }
    ],
    ingredients: [
      "100% Pure Turmeric Rhizomes"
    ],
    details: [
      "Unpolished whole turmeric",
      "Deep natural yellow colour",
      "Essential everyday kitchen spice"
    ],
    howToUse: [
      "Add 1/4 to 1/2 teaspoon to daily curries, dals, vegetables, or warm milk."
    ],
    storageInfo: "Store sealed in an airtight container away from direct heat."
  },
  {
    id: "hipa-red-chilli-powder",
    slug: "red-chilli-powder",
    name: "Red Chilli Powder",
    tamilName: "தனி மிளகாய் பொடி",
    category: "spices",
    categoryName: "Pure Spices",
    description: "Vibrant red chilli powder ground from handpicked chillies for natural color and controlled heat.",
    image: "assets/images/products/red-chilli/red-chilli-100g-front-web.png",
    imageAlt: "HIPA Masala Red Chilli Powder Pack",
    variants: [
      {
        size: "100g",
        price: 55,
        images: {
          front: "assets/images/products/red-chilli/red-chilli-100g-front.png",
          frontWeb: "assets/images/products/red-chilli/red-chilli-100g-front-web.png",
          back: "assets/images/products/red-chilli/red-chilli-100g-back.png",
          backWeb: "assets/images/products/red-chilli/red-chilli-100g-back-web.png"
        }
      },
      {
        size: "200g",
        price: 105,
        images: {
          front: "assets/images/products/red-chilli/red-chilli-200g-front.png",
          frontWeb: "assets/images/products/red-chilli/red-chilli-200g-front-web.png",
          back: "assets/images/products/red-chilli/red-chilli-200g-back.png",
          backWeb: "assets/images/products/red-chilli/red-chilli-200g-back-web.png"
        }
      },
      {
        size: "500g",
        price: 250,
        images: {
          front: "assets/images/products/red-chilli/red-chilli-500g-front.png",
          frontWeb: "assets/images/products/red-chilli/red-chilli-500g-front-web.png",
          back: "assets/images/products/red-chilli/red-chilli-500g-back.png",
          backWeb: "assets/images/products/red-chilli/red-chilli-500g-back-web.png"
        }
      },
      {
        size: "1kg",
        price: 480,
        images: {
          front: "assets/images/products/red-chilli/red-chilli-1kg-front.png",
          frontWeb: "assets/images/products/red-chilli/red-chilli-1kg-front-web.png",
          back: "assets/images/products/red-chilli/red-chilli-1kg-back.png",
          backWeb: "assets/images/products/red-chilli/red-chilli-1kg-back-web.png"
        }
      }
    ],
    ingredients: [
      "100% Sun-Dried Red Chillies"
    ],
    details: [
      "Natural red appearance without added colour",
      "Balanced spice heat for everyday cooking",
      "Stemless whole chillies for uniform texture"
    ],
    howToUse: [
      "Use as required in vegetable dishes, gravies, marinades, and curries."
    ],
    storageInfo: "Store in a cool, dry container away from moisture."
  },
  {
    id: "hipa-coriander-powder",
    slug: "coriander-powder",
    name: "Coriander Powder",
    tamilName: "தனியா பொடி",
    category: "spices",
    categoryName: "Pure Spices",
    description: "Freshly ground whole coriander seeds with a naturally sweet, earthy aroma.",
    image: "assets/images/products/coriander/coriander-100g-front-web.png",
    imageAlt: "HIPA Masala Coriander Powder Pack",
    variants: [
      {
        size: "100g",
        price: 42,
        images: {
          front: "assets/images/products/coriander/coriander-100g-front.png",
          frontWeb: "assets/images/products/coriander/coriander-100g-front-web.png",
          back: "assets/images/products/coriander/coriander-100g-back.png",
          backWeb: "assets/images/products/coriander/coriander-100g-back-web.png"
        }
      },
      {
        size: "200g",
        price: 80,
        images: {
          front: "assets/images/products/coriander/coriander-200g-front.png",
          frontWeb: "assets/images/products/coriander/coriander-200g-front-web.png",
          back: "assets/images/products/coriander/coriander-200g-back.png",
          backWeb: "assets/images/products/coriander/coriander-200g-back-web.png"
        }
      },
      {
        size: "500g",
        price: 190,
        images: {
          front: "assets/images/products/coriander/coriander-500g-front.png",
          frontWeb: "assets/images/products/coriander/coriander-500g-front-web.png",
          back: "assets/images/products/coriander/coriander-500g-back.png",
          backWeb: "assets/images/products/coriander/coriander-500g-back-web.png"
        }
      },
      {
        size: "1kg",
        price: 360,
        images: {
          front: "assets/images/products/coriander/coriander-1kg-front.png",
          frontWeb: "assets/images/products/coriander/coriander-1kg-front-web.png",
          back: "assets/images/products/coriander/coriander-1kg-back.png",
          backWeb: "assets/images/products/coriander/coriander-1kg-back-web.png"
        }
      }
    ],
    ingredients: [
      "100% Selected Coriander Seeds (Dhaniya)"
    ],
    details: [
      "Pure whole coriander seeds",
      "Naturally sweet, citrusy-earthy flavour",
      "Provides natural body and thickness to gravies"
    ],
    howToUse: [
      "Add 1 to 2 tablespoons to curry bases with turmeric and chilli powder."
    ],
    storageInfo: "Keep tightly sealed in a dry container."
  },
  {
    id: "hipa-cumin-powder",
    slug: "cumin-powder",
    name: "Cumin Powder",
    tamilName: "சீரகப் பொடி",
    category: "spices",
    categoryName: "Pure Spices",
    description: "Roasted cumin seeds ground fresh for warm, nutty flavour in every dish.",
    image: "assets/images/products/cumin/cumin-100g-front-web.png",
    imageAlt: "HIPA Masala Cumin Powder Pack",
    variants: [
      {
        size: "100g",
        price: 76,
        images: {
          front: "assets/images/products/cumin/cumin-100g-front.png",
          frontWeb: "assets/images/products/cumin/cumin-100g-front-web.png",
          back: "assets/images/products/cumin/cumin-100g-back.png",
          backWeb: "assets/images/products/cumin/cumin-100g-back-web.png"
        }
      },
      {
        size: "200g",
        price: 148,
        images: {
          front: "assets/images/products/cumin/cumin-200g-front.png",
          frontWeb: "assets/images/products/cumin/cumin-200g-front-web.png",
          back: "assets/images/products/cumin/cumin-200g-back.png",
          backWeb: "assets/images/products/cumin/cumin-200g-back-web.png"
        }
      },
      {
        size: "500g",
        price: 350,
        images: {
          front: "assets/images/products/cumin/cumin-500g-front.png",
          frontWeb: "assets/images/products/cumin/cumin-500g-front-web.png",
          back: "assets/images/products/cumin/cumin-500g-back.png",
          backWeb: "assets/images/products/cumin/cumin-500g-back-web.png"
        }
      },
      {
        size: "1kg",
        price: 680,
        images: {
          front: "assets/images/products/cumin/cumin-1kg-front.png",
          frontWeb: "assets/images/products/cumin/cumin-1kg-front-web.png",
          back: "assets/images/products/cumin/cumin-1kg-back.png",
          backWeb: "assets/images/products/cumin/cumin-1kg-back-web.png"
        }
      }
    ],
    ingredients: [
      "100% Roasted Whole Cumin Seeds (Jeera / Seeragam)"
    ],
    details: [
      "Evenly roasted whole cumin seeds",
      "Fine ground texture for easy blending",
      "Natural warm aroma"
    ],
    howToUse: [
      "Sprinkle over raitas, buttermilk, chaats, or use in curries and stews."
    ],
    storageInfo: "Store in a cool, airtight container."
  },
  {
    id: "hipa-pepper-powder",
    slug: "pepper-powder",
    name: "Pepper Powder",
    tamilName: "மிளகுப் பொடி",
    category: "spices",
    categoryName: "Pure Spices",
    description: "Sun-dried black pepper freshly ground to retain its sharp aroma and natural pungency.",
    image: "assets/images/products/pepper/pepper-100g-front-web.png",
    imageAlt: "HIPA Masala Pepper Powder Pack",
    variants: [
      {
        size: "50g",
        price: 60,
        images: {
          front: "assets/images/products/pepper/pepper-100g-front.png",
          frontWeb: "assets/images/products/pepper/pepper-100g-front-web.png",
          back: "assets/images/products/pepper/pepper-100g-back.png",
          backWeb: "assets/images/products/pepper/pepper-100g-back-web.png"
        }
      },
      {
        size: "100g",
        price: 115,
        images: {
          front: "assets/images/products/pepper/pepper-100g-front.png",
          frontWeb: "assets/images/products/pepper/pepper-100g-front-web.png",
          back: "assets/images/products/pepper/pepper-100g-back.png",
          backWeb: "assets/images/products/pepper/pepper-100g-back-web.png"
        }
      },
      {
        size: "200g",
        price: 220,
        images: {
          front: "assets/images/products/pepper/pepper-200g-front.png",
          frontWeb: "assets/images/products/pepper/pepper-200g-front-web.png",
          back: "assets/images/products/pepper/pepper-200g-back.png",
          backWeb: "assets/images/products/pepper/pepper-200g-back-web.png"
        }
      },
      {
        size: "500g",
        price: 520,
        images: {
          front: "assets/images/products/pepper/pepper-500g-front.png",
          frontWeb: "assets/images/products/pepper/pepper-500g-front-web.png",
          back: "assets/images/products/pepper/pepper-500g-back.png",
          backWeb: "assets/images/products/pepper/pepper-500g-back-web.png"
        }
      },
      {
        size: "1kg",
        price: 990,
        images: {
          front: "assets/images/products/pepper/pepper-1kg-front.png",
          frontWeb: "assets/images/products/pepper/pepper-1kg-front-web.png",
          back: "assets/images/products/pepper/pepper-1kg-back.png",
          backWeb: "assets/images/products/pepper/pepper-1kg-back-web.png"
        }
      }
    ],
    ingredients: [
      "100% Sun-Dried Black Peppercorns"
    ],
    details: [
      "Selected whole black peppercorns",
      "Sharp, aromatic natural heat",
      "Hygienically milled and sealed"
    ],
    howToUse: [
      "Freshly dust over rasam, pongal, soups, eggs, salads, and vegetable sautes."
    ],
    storageInfo: "Store in an airtight container in a dark, dry pantry."
  }
];

const HipaStore = {
  MIN_ORDER_VALUE: 999,
  getAllProducts: () => HIPA_PRODUCTS,
  getProductById: (id) => HIPA_PRODUCTS.find(p => p.id === id || p.slug === id),
  getProductBySlug: (slug) => HIPA_PRODUCTS.find(p => p.slug === slug),
  getProductsByCategory: (cat) => cat === 'all' ? HIPA_PRODUCTS : HIPA_PRODUCTS.filter(p => p.category === cat),
  getRelatedProducts: (currentSlug, limit = 4) => HIPA_PRODUCTS.filter(p => p.slug !== currentSlug).slice(0, limit),
  searchProducts: (query) => {
    if (!query || !query.trim()) return [];
    const q = query.toLowerCase().trim();
    return HIPA_PRODUCTS.filter(p => 
      p.name.toLowerCase().includes(q) ||
      (p.tamilName && p.tamilName.toLowerCase().includes(q)) ||
      p.categoryName.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.ingredients.some(ing => ing.toLowerCase().includes(q))
    );
  }
};

if (typeof window !== 'undefined') {
  window.HIPA_PRODUCTS = HIPA_PRODUCTS;
  window.HipaStore = HipaStore;
}
if (typeof module !== 'undefined') {
  module.exports = { HIPA_PRODUCTS, HipaStore };
}
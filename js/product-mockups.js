/* =========================================================
   HIPA MASALA — DYNAMIC PRODUCT MOCKUP & PACK SIZE SYSTEM
   ---------------------------------------------------------
   Centralized configuration for product pack sizes, front/back
   mockup images, and full-screen viewer.

   To add future products or pack sizes:
   Simply add the product slug and pack sizes below.
   The UI, switcher, and full-screen zoom viewer will
   automatically support them without any code changes!
   ========================================================= */

window.HIPA_PRODUCT_MOCKUPS = {
  "sambar-powder": {
    name: "Sambar Powder",
    tagline: "Taste of Tradition",
    defaultSize: "100g",
    sizes: {
      "100g": {
        label: "100g",
        front: "assets/images/products/sambar/sambar-100g-front.png",
        frontWeb: "assets/images/products/sambar/sambar-100g-front-web.png",
        back: "assets/images/products/sambar/sambar-100g-back.png",
        backWeb: "assets/images/products/sambar/sambar-100g-back-web.png"
      },
      "200g": {
        label: "200g",
        front: "assets/images/products/sambar/sambar-200g-front.png",
        frontWeb: "assets/images/products/sambar/sambar-200g-front-web.png",
        back: "assets/images/products/sambar/sambar-200g-back.png",
        backWeb: "assets/images/products/sambar/sambar-200g-back-web.png"
      },
      "500g": {
        label: "500g",
        front: "assets/images/products/sambar/sambar-500g-front.png",
        frontWeb: "assets/images/products/sambar/sambar-500g-front-web.png",
        back: "assets/images/products/sambar/sambar-500g-back.png",
        backWeb: "assets/images/products/sambar/sambar-500g-back-web.png"
      }
    }
  },

  /* ---------- Future Products (Ready for image drop-in) ---------- */
  "rasam-powder": {
    name: "Rasam Powder",
    tagline: "Tangy Comfort",
    defaultSize: "100g",
    sizes: {}
  },
  "thaniya-powder": {
    name: "Thaniya Powder",
    tagline: "Earthy Aroma",
    defaultSize: "100g",
    sizes: {}
  },
  "coriander-powder": {
    name: "Coriander Powder",
    tagline: "100% Pure Coriander",
    defaultSize: "100g",
    sizes: {}
  },
  "seeragam": {
    name: "Seeragam / Cumin Powder",
    tagline: "Rich & Earthy",
    defaultSize: "100g",
    sizes: {}
  },
  "pepper-powder": {
    name: "Pepper Powder",
    tagline: "Bold Heat",
    defaultSize: "100g",
    sizes: {}
  },
  "garam-masala": {
    name: "Garam Masala",
    tagline: "Royal Spiced Blend",
    defaultSize: "100g",
    sizes: {}
  },
  "red-chilli-powder": {
    name: "Red Chilli Powder",
    tagline: "Natural Colour & Heat",
    defaultSize: "100g",
    sizes: {}
  },
  "turmeric-powder": {
    name: "Turmeric Powder",
    tagline: "High Curcumin",
    defaultSize: "100g",
    sizes: {}
  }
};

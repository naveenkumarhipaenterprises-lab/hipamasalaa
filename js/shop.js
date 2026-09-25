/**
 * HIPA MASALAS SHOP CATALOG CONTROLLER
 * Handles category filtering, pack size filtering, price sorting, and dynamic grid rendering
 */

const ShopPage = {
  currentCategory: 'all',
  currentSize: 'all',
  currentSort: 'default',

  init: function() {
    this.bindEvents();

    const urlParams = new URLSearchParams(window.location.search);
    const catParam = urlParams.get('category');
    if (catParam) {
      this.setCategory(catParam);
    } else {
      this.render();
    }
  },

  bindEvents: function() {
    // Category tabs
    document.querySelectorAll('.js-cat-tab').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const cat = e.currentTarget.getAttribute('data-cat');
        this.setCategory(cat);
      });
    });

    // Category sidebar radio
    document.querySelectorAll('input[name="cat_filter"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.setCategory(e.target.value);
      });
    });

    // Pack size sidebar filter
    document.querySelectorAll('input[name="size_filter"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.currentSize = e.target.value;
        this.render();
      });
    });

    // Sort dropdown
    const sortSelect = document.getElementById('shopSortSelect');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.currentSort = e.target.value;
        this.render();
      });
    }
  },

  setCategory: function(cat) {
    this.currentCategory = cat;

    // Update tab active states
    document.querySelectorAll('.js-cat-tab').forEach(btn => {
      btn.classList.toggle('is-active', btn.getAttribute('data-cat') === cat);
    });

    // Update radio states
    const radio = document.querySelector(`input[name="cat_filter"][value="${cat}"]`);
    if (radio) radio.checked = true;

    this.render();
  },

  render: function() {
    const grid = document.getElementById('shopProductsGrid');
    const countEl = document.getElementById('shopResultCount');
    if (!grid || !window.HipaStore) return;

    let list = window.HipaStore.getAllProducts();

    // Category filter
    if (this.currentCategory !== 'all') {
      list = list.filter(p => p.category === this.currentCategory);
    }

    // Size filter
    if (this.currentSize !== 'all') {
      list = list.filter(p => p.variants.some(v => v.size === this.currentSize));
    }

    // Sorting
    if (this.currentSort === 'price-low') {
      list = [...list].sort((a, b) => a.variants[0].price - b.variants[0].price);
    } else if (this.currentSort === 'price-high') {
      list = [...list].sort((a, b) => b.variants[0].price - a.variants[0].price);
    } else if (this.currentSort === 'rating') {
      list = [...list].sort((a, b) => b.rating - a.rating);
    }

    if (countEl) {
      countEl.textContent = `Showing ${list.length} products`;
    }

    if (list.length === 0) {
      grid.innerHTML = `
        <div style="grid-column:1/-1; text-align:center; padding:60px 20px;">
          <h3 style="color:var(--text-dark); margin-bottom:8px;">No matching products found</h3>
          <p style="color:var(--text-muted); margin-bottom:16px;">Try resetting your filters to view all HIPA Masalas products.</p>
          <button class="btn btn-outline" onclick="ShopPage.resetFilters()">Reset Filters</button>
        </div>
      `;
      return;
    }

    grid.innerHTML = list.map((p, idx) => window.App ? window.App.renderProductCard(p, idx) : '').join('');

    // Ensure all newly rendered cards are observed / made visible
    if (window.App && typeof window.App.initScrollReveal === 'function') {
      window.App.initScrollReveal();
    }
  },

  resetFilters: function() {
    this.currentCategory = 'all';
    this.currentSize = 'all';
    this.currentSort = 'default';

    document.querySelectorAll('.js-cat-tab').forEach(b => b.classList.toggle('is-active', b.getAttribute('data-cat') === 'all'));
    const catAll = document.querySelector('input[name="cat_filter"][value="all"]');
    if (catAll) catAll.checked = true;

    const sizeAll = document.querySelector('input[name="size_filter"][value="all"]');
    if (sizeAll) sizeAll.checked = true;

    const sortSelect = document.getElementById('shopSortSelect');
    if (sortSelect) sortSelect.value = 'default';

    this.render();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('shopProductsGrid')) {
    ShopPage.init();
  }
});
window.ShopPage = ShopPage;
/**
 * HIPA MASALA INSTANT SEARCH SYSTEM
 * Instant suggestions, product image preview, quick routing
 */

const Search = {
  open: function() {
    const modal = document.getElementById('searchModal');
    const input = document.getElementById('siteSearchInput');
    if (modal) {
      modal.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      if (input) {
        setTimeout(() => input.focus(), 100);
      }
      this.renderSuggestions('');
    }
  },

  close: function() {
    const modal = document.getElementById('searchModal');
    if (modal) {
      modal.classList.remove('is-open');
      document.body.style.overflow = '';
    }
  },

  renderSuggestions: function(query) {
    const resultsContainer = document.getElementById('searchResultsList');
    if (!resultsContainer || !window.HipaStore) return;

    const trimmed = query.trim();
    const products = trimmed ? window.HipaStore.searchProducts(trimmed) : window.HipaStore.getAllProducts();

    if (products.length === 0) {
      resultsContainer.innerHTML = `
        <div style="text-align:center; padding:32px 16px; color:var(--text-muted);">
          <p style="font-size:1rem; margin-bottom:4px; font-weight:600; color:var(--text-dark);">No products found for "${query}"</p>
          <p style="font-size:0.875rem;">Try searching for Sambar, Rasam, Turmeric, Chilli, or Pepper</p>
        </div>
      `;
      return;
    }

    const html = products.map(product => `
      <a href="product.html?slug=${product.slug}" class="search-result-item" onclick="Search.close()">
        <img class="search-result-img" src="${product.image}" alt="${product.name}">
        <div class="search-result-info">
          <div class="search-result-name">${product.name} <span style="font-size:0.75rem; color:var(--text-muted); font-weight:normal;">(${product.tamilName || ''})</span></div>
          <div class="search-result-category">${product.categoryName} • ${product.variants.map(v => v.size).join(', ')}</div>
        </div>
        <div class="search-result-price">₹${product.variants[0].price}</div>
      </a>
    `).join('');

    resultsContainer.innerHTML = `
      <div style="font-size:0.75rem; font-weight:700; text-transform:uppercase; color:var(--text-muted); padding:4px 10px 8px;">
        ${trimmed ? `Search Results (${products.length})` : 'Popular Products'}
      </div>
      ${html}
    `;
  },

  init: function() {
    document.querySelectorAll('.js-search-trigger').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.open();
      });
    });

    const closeBtn = document.getElementById('searchModalClose');
    if (closeBtn) closeBtn.addEventListener('click', () => this.close());

    const modal = document.getElementById('searchModal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.close();
      });
    }

    const input = document.getElementById('siteSearchInput');
    if (input) {
      input.addEventListener('input', (e) => {
        this.renderSuggestions(e.target.value);
      });
    }

    // Keyboard shortcut CMD/CTRL + K
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        this.open();
      }
      if (e.key === 'Escape') {
        this.close();
      }
    });
  }
};

document.addEventListener('DOMContentLoaded', () => Search.init());
window.Search = Search;
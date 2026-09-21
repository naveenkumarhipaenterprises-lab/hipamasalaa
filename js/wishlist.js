/**
 * HIPA MASALA WISHLIST ENGINE
 * Supports Guest LocalStorage + Authenticated Supabase PostgreSQL Synchronization
 */

const Wishlist = {
  STORAGE_KEY: 'hipa_masala_wishlist_v1',

  getItems: function() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error loading wishlist', e);
      return [];
    }
  },

  saveItems: function(items) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
      this.updateBadges();
      window.dispatchEvent(new CustomEvent('wishlistUpdated', { detail: { items } }));
    } catch (e) {
      console.error('Error saving wishlist', e);
    }
  },

  has: function(productSlug) {
    const items = this.getItems();
    return items.some(slug => slug === productSlug);
  },

  toggle: function(productSlug, event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    const items = this.getItems();
    const index = items.indexOf(productSlug);
    const product = window.HipaStore ? window.HipaStore.getProductBySlug(productSlug) : null;
    const name = product ? product.name : 'Product';

    if (index > -1) {
      items.splice(index, 1);
      this.saveItems(items);
      this.updateButtonState(productSlug, false);
      if (window.Cart) Cart.showToast(`Removed ${name} from your wishlist`);
      this.syncRemoveWithDatabase(productSlug);
    } else {
      items.push(productSlug);
      this.saveItems(items);
      this.updateButtonState(productSlug, true);
      if (window.Cart) Cart.showToast(`Added ${name} to your wishlist ❤️`);
      this.syncAddWithDatabase(productSlug);
    }
  },

  remove: function(productSlug, event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const items = this.getItems();
    const index = items.indexOf(productSlug);
    if (index > -1) {
      items.splice(index, 1);
      this.saveItems(items);
      this.updateButtonState(productSlug, false);
      this.syncRemoveWithDatabase(productSlug);
    }
  },

  updateButtonState: function(productSlug, isWishlisted) {
    const btns = document.querySelectorAll(`.wishlist-btn[data-slug="${productSlug}"]`);
    btns.forEach(btn => {
      btn.classList.toggle('active', isWishlisted);
      const svg = btn.querySelector('svg');
      if (svg) {
        if (isWishlisted) {
          svg.setAttribute('fill', 'var(--color-primary, #9E1B1E)');
          svg.setAttribute('stroke', 'var(--color-primary, #9E1B1E)');
        } else {
          svg.removeAttribute('fill');
          svg.setAttribute('stroke', 'currentColor');
        }
      }
    });
  },

  updateBadges: function() {
    const count = this.getItems().length;
    const badges = document.querySelectorAll('.js-wishlist-count, #headerWishlistCount');
    badges.forEach(b => {
      b.textContent = count;
      b.style.display = count > 0 ? 'inline-flex' : 'none';
    });
  },

  syncAddWithDatabase: async function(productSlug) {
    if (window.HipaAuth && window.HipaAuth.client && window.HipaAuth.currentUser) {
      try {
        await window.HipaAuth.client
          .from('wishlist_items')
          .upsert({ user_id: window.HipaAuth.currentUser.id, product_slug: productSlug }, { onConflict: 'user_id,product_slug' });
      } catch (e) {
        console.error('Error syncing wishlist item to database', e);
      }
    }
  },

  syncRemoveWithDatabase: async function(productSlug) {
    if (window.HipaAuth && window.HipaAuth.client && window.HipaAuth.currentUser) {
      try {
        await window.HipaAuth.client
          .from('wishlist_items')
          .delete()
          .match({ user_id: window.HipaAuth.currentUser.id, product_slug: productSlug });
      } catch (e) {
        console.error('Error removing wishlist item from database', e);
      }
    }
  },

  syncWithUser: async function(user) {
    if (!user) return;
    const localItems = this.getItems();

    if (window.HipaAuth && window.HipaAuth.client) {
      try {
        // 1. Fetch user's existing DB wishlist
        const { data: dbItems } = await window.HipaAuth.client
          .from('wishlist_items')
          .select('product_slug')
          .eq('user_id', user.id);

        const dbSlugs = dbItems ? dbItems.map(i => i.product_slug) : [];
        const mergedSlugs = Array.from(new Set([...localItems, ...dbSlugs]));

        // 2. Upload any local items not yet in DB
        const toUpload = localItems.filter(s => !dbSlugs.includes(s));
        if (toUpload.length > 0) {
          await window.HipaAuth.client.from('wishlist_items').upsert(
            toUpload.map(slug => ({ user_id: user.id, product_slug: slug }))
          );
        }

        this.saveItems(mergedSlugs);
      } catch (e) {
        console.warn('Could not sync wishlist with Supabase, keeping local state', e);
      }
    }
  },

  init: function() {
    this.updateBadges();
    // Synchronize all visible buttons on page
    const items = this.getItems();
    items.forEach(slug => this.updateButtonState(slug, true));
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => Wishlist.init());
} else {
  Wishlist.init();
}

window.Wishlist = Wishlist;

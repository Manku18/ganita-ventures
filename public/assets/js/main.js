/**
 * main.js - Ganita Ventures Client Web Platform Logic
 * Handles Shopping Cart, Order Checkout, Order Tracking, Dynamic Filters, RFQ Submission, and API interactions
 */

const API_BASE = '/api';

// Cart State Engine
const Cart = {
  key: 'gv_cart_items',
  getItems() {
    try {
      return JSON.parse(localStorage.getItem(this.key)) || [];
    } catch (e) {
      return [];
    }
  },
  save(items) {
    localStorage.setItem(this.key, JSON.stringify(items));
    this.updateCountUI();
  },
  add(product, qty = 1) {
    const items = this.getItems();
    const existing = items.find(i => i.id === product.id);
    if (existing) {
      existing.qty += qty;
    } else {
      items.push({
        id: product.id,
        sku: product.sku,
        name: product.name,
        price: product.discount_price || product.price,
        unit: product.unit,
        image: product.image,
        qty: qty
      });
    }
    this.save(items);
    showToast(`Added "${product.name}" to cart`);
  },
  remove(id) {
    let items = this.getItems();
    items = items.filter(i => i.id !== id);
    this.save(items);
    showToast('Item removed from cart', 'info');
  },
  updateQty(id, qty) {
    const items = this.getItems();
    const item = items.find(i => i.id === id);
    if (item) {
      item.qty = Math.max(1, qty);
      this.save(items);
    }
  },
  clear() {
    localStorage.removeItem(this.key);
    this.updateCountUI();
  },
  getTotal() {
    return this.getItems().reduce((sum, item) => sum + (item.price * item.qty), 0);
  },
  updateCountUI() {
    const count = this.getItems().reduce((sum, item) => sum + item.qty, 0);
    const badge = document.getElementById('cart-count');
    if (badge) {
      badge.textContent = count;
    }
  }
};

// Global Toast Notification System
function showToast(message, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span style="font-size: 1.2rem;">${type === 'success' ? '✓' : 'ℹ'}</span>
    <div>${message}</div>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// WhatsApp Quick Contact Helper
function openWhatsAppProduct(productName, sku) {
  const settingsPhone = "918709605306";
  const msg = `Hello Ganita Ventures, I am interested in inquiring about:\n\nProduct: ${productName}\nSKU: ${sku}\n\nPlease share price, specs and delivery details for Munger/Bihar.`;
  const url = `https://wa.me/${settingsPhone}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
}

// Mobile Navigation Drawer Toggle & Accessibility
document.addEventListener('DOMContentLoaded', () => {
  Cart.updateCountUI();

  const mobileBtn = document.getElementById('mobile-toggle');
  const navMenu = document.getElementById('nav-menu');

  if (mobileBtn && navMenu) {
    // Backdrop element
    let backdrop = document.querySelector('.mobile-nav-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'mobile-nav-backdrop';
      document.body.appendChild(backdrop);
    }

    // Add close button and quick actions to drawer if not already added
    if (!navMenu.querySelector('.nav-menu-drawer-header')) {
      const headerDiv = document.createElement('div');
      headerDiv.className = 'nav-menu-drawer-header';
      headerDiv.innerHTML = `
        <span style="font-family: var(--font-heading); font-weight: 800; font-size: 1.15rem; color: var(--secondary);">Navigation</span>
        <button class="nav-menu-close" id="nav-menu-close" aria-label="Close Navigation Menu">&times;</button>
      `;
      navMenu.insertBefore(headerDiv, navMenu.firstChild);

      const closeBtn = headerDiv.querySelector('#nav-menu-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => closeNav());
      }
    }

    if (!navMenu.querySelector('.nav-menu-actions')) {
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'nav-menu-actions';
      actionsDiv.innerHTML = `
        <a href="/quote" class="btn btn-primary btn-sm">Request a Quote</a>
        <a href="/track-order" class="btn btn-outline btn-sm">Track Order Status</a>
        <a href="tel:+918709605306" class="btn btn-secondary btn-sm" style="display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
          📞 Call: +91 8709605306
        </a>
      `;
      navMenu.appendChild(actionsDiv);
    }

    const openNav = () => {
      navMenu.classList.add('show');
      mobileBtn.setAttribute('aria-expanded', 'true');
      backdrop.classList.add('active');
      if (window.innerWidth <= 1040) {
        document.body.style.overflow = 'hidden';
      }
    };

    const closeNav = () => {
      navMenu.classList.remove('show');
      mobileBtn.setAttribute('aria-expanded', 'false');
      backdrop.classList.remove('active');
      document.body.style.overflow = '';
    };

    mobileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = navMenu.classList.contains('show');
      if (isOpen) {
        closeNav();
      } else {
        openNav();
      }
    });

    backdrop.addEventListener('click', closeNav);

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!navMenu.contains(e.target) && !mobileBtn.contains(e.target) && navMenu.classList.contains('show')) {
        closeNav();
      }
    });

    // Close when clicking any nav link
    navMenu.querySelectorAll('.nav-link, .nav-menu-actions a').forEach(link => {
      link.addEventListener('click', closeNav);
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navMenu.classList.contains('show')) {
        closeNav();
      }
    });
  }
});


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
    mobileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = navMenu.classList.toggle('show');
      mobileBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!navMenu.contains(e.target) && !mobileBtn.contains(e.target) && navMenu.classList.contains('show')) {
        navMenu.classList.remove('show');
        mobileBtn.setAttribute('aria-expanded', 'false');
      }
    });

    // Close when clicking any nav link
    navMenu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('show');
        mobileBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }
});

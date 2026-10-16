/**
 * admin.js - Ganita Ventures SaaS Admin Management Console
 * Complete control system for Products, Services, Orders, RFQs, PDF Quotes, CRM Leads, Letterhead Generator & CMS Settings
 */

const API_BASE = '/api';
let adminToken = localStorage.getItem('gv_admin_token') || '';
let currentAdminView = 'dashboard';

// Helper Header Fetch
function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  };
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

// Authentication check on load
document.addEventListener('DOMContentLoaded', () => {
  if (!adminToken) {
    showLoginModal();
  } else {
    loadAdminDashboard();
  }
});

function showLoginModal() {
  const container = document.getElementById('admin-app');
  if (!container) return;

  container.innerHTML = `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #0F172A; padding: 1.5rem;">
      <div style="background: #1E293B; border: 1px solid #334155; border-radius: 16px; padding: 2.5rem; width: 100%; max-width: 440px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);">
        <div style="text-align: center; margin-bottom: 2rem;">
          <img src="/assets/img/logo.png" alt="Ganita Ventures" style="height: 54px; margin: 0 auto 1rem auto;">
          <h2 style="font-family: 'Outfit', sans-serif; color: #FFFFFF; font-size: 1.5rem;">Admin Control Center</h2>
          <p style="color: #94A3B8; font-size: 0.9rem; margin-top: 0.25rem;">Sign in to manage Ganita Ventures business platform</p>
        </div>

        <form id="admin-login-form">
          <div style="margin-bottom: 1.25rem;">
            <label style="display: block; font-size: 0.85rem; font-weight: 600; color: #CBD5E1; margin-bottom: 0.4rem;">Username or Email</label>
            <input type="text" id="login-username" class="form-control" value="admin" required style="background: #090D16; border-color: #334155; color: #FFF;">
          </div>

          <div style="margin-bottom: 1.5rem;">
            <label style="display: block; font-size: 0.85rem; font-weight: 600; color: #CBD5E1; margin-bottom: 0.4rem;">Password</label>
            <input type="password" id="login-password" class="form-control" value="admin123" required style="background: #090D16; border-color: #334155; color: #FFF;">
          </div>

          <button type="submit" class="btn btn-primary" style="width: 100%; padding: 0.85rem; font-weight: 700; background: #F2821A;">
            Sign In to Dashboard
          </button>

          <div style="margin-top: 1.25rem; text-align: center; font-size: 0.8rem; color: #64748B;">
            Default Admin Credentials: <strong>admin</strong> / <strong>admin123</strong>
          </div>
        </form>
      </div>
    </div>
  `;

  document.getElementById('admin-login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const u = document.getElementById('login-username').value;
    const p = document.getElementById('login-password').value;

    try {
      const res = await fetch(`${API_BASE}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p })
      });

      const data = await res.json();
      if (res.ok && data.token) {
        adminToken = data.token;
        localStorage.setItem('gv_admin_token', adminToken);
        loadAdminDashboard();
      } else {
        alert(data.error || 'Invalid credentials');
      }
    } catch (err) {
      alert('Login error: ' + err.message);
    }
  });
}

// Mobile Sidebar Drawer Toggle Helper
function toggleAdminSidebar(force) {
  const sidebar = document.getElementById('admin-sidebar');
  const backdrop = document.getElementById('admin-sidebar-backdrop');
  if (!sidebar) return;
  const isCurrentlyOpen = sidebar.classList.contains('open');
  const nextState = typeof force === 'boolean' ? force : !isCurrentlyOpen;
  sidebar.classList.toggle('open', nextState);
  if (backdrop) backdrop.classList.toggle('active', nextState);
  if (window.innerWidth <= 992) {
    document.body.style.overflow = nextState ? 'hidden' : '';
  }
}

// Render Admin Application Main Layout
async function loadAdminDashboard() {
  const app = document.getElementById('admin-app');
  if (!app) return;

  app.innerHTML = `
    <aside class="admin-sidebar" id="admin-sidebar">
      <div class="sidebar-brand" style="display: flex; align-items: center; justify-content: space-between;">
        <img src="/assets/img/logo.png" alt="Ganita Ventures">
        <button class="admin-sidebar-close" onclick="toggleAdminSidebar(false)" aria-label="Close sidebar">&times;</button>
      </div>
      <div class="sidebar-nav">
        <div class="nav-section-title">Overview</div>
        <div class="sidebar-link active" onclick="switchAdminTab('dashboard', this)">
          <span class="icon">📊</span> Dashboard
        </div>
        <div class="sidebar-link" onclick="switchAdminTab('letters', this)">
          <span class="icon">✉️</span> Tender Letter Generator
        </div>
        <div class="sidebar-link" onclick="switchAdminTab('orders', this)">
          <span class="icon">🛒</span> Orders Management
        </div>
        <div class="sidebar-link" onclick="switchAdminTab('rfqs', this)">
          <span class="icon">📑</span> RFQs & B2B Requests
        </div>
        <div class="sidebar-link" onclick="switchAdminTab('quotes', this)">
          <span class="icon">📜</span> Quotation Generator
        </div>
        <div class="sidebar-link" onclick="switchAdminTab('invoices', this)">
          <span class="icon">🧾</span> Tax Invoice Generator
        </div>
        <div class="sidebar-link" onclick="switchAdminTab('leads', this)">
          <span class="icon">👥</span> CRM & Leads
        </div>

        <div class="nav-section-title">Catalog CMS</div>
        <div class="sidebar-link" onclick="switchAdminTab('products', this)">
          <span class="icon">📦</span> Products Catalog (3 Core)
        </div>
        <div class="sidebar-link" onclick="switchAdminTab('services', this)">
          <span class="icon">🛠️</span> Services CMS
        </div>
        <div class="sidebar-link" onclick="switchAdminTab('projects', this)">
          <span class="icon">🏗️</span> Projects Showcase
        </div>

        <div class="nav-section-title">System & CMS</div>
        <div class="sidebar-link" onclick="switchAdminTab('settings', this)">
          <span class="icon">⚙️</span> Business Settings
        </div>
        <div class="sidebar-link" onclick="adminLogout()" style="color: #EF4444; margin-top: 1.5rem;">
          <span class="icon">🚪</span> Logout
        </div>
      </div>
    </aside>

    <div class="admin-sidebar-backdrop" id="admin-sidebar-backdrop" onclick="toggleAdminSidebar(false)"></div>

    <main class="admin-main">
      <header class="admin-header">
        <div style="display: flex; align-items: center; gap: 0.75rem; min-width: 0;">
          <button class="admin-mobile-toggle" id="admin-mobile-toggle" onclick="toggleAdminSidebar(true)" aria-label="Toggle Navigation">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <div class="header-title" id="page-heading" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Dashboard Overview</div>
        </div>
        <div class="admin-user-profile">
          <div style="text-align: right;">
            <div style="font-weight: 700; font-size: 0.9rem;">Sushil Kumar</div>
            <div style="font-size: 0.75rem; color: var(--admin-text-muted);" class="role-text">Proprietor • Ganita Ventures</div>
          </div>
          <div class="avatar-circle">SK</div>
        </div>
      </header>

      <div class="admin-body-content" id="admin-tab-content">
        <div style="text-align: center; padding: 4rem;">Loading metrics...</div>
      </div>
    </main>
  `;

  renderDashboardTab();
}

function switchAdminTab(tabName, el) {
  currentAdminView = tabName;
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  if (el) el.classList.add('active');

  if (window.innerWidth <= 992) {
    toggleAdminSidebar(false);
  }

  const heading = document.getElementById('page-heading');
  heading.textContent = (tabName === 'letters' || tabName === 'quotes') 
    ? 'Formal Quotation & Tender Rate Proposal Generator' 
    : (tabName === 'invoices' 
      ? 'Tax Invoice & Commercial Billing Engine' 
      : tabName.charAt(0).toUpperCase() + tabName.slice(1) + ' Control');

  if (tabName === 'dashboard') renderDashboardTab();
  else if (tabName === 'invoices') renderInvoicesTab();
  else if (tabName === 'letters') renderLettersTab();
  else if (tabName === 'orders') renderOrdersTab();
  else if (tabName === 'products') renderProductsTab();
  else if (tabName === 'services') renderServicesTab();
  else if (tabName === 'rfqs') renderRFQsTab();
  else if (tabName === 'quotes') renderQuotesTab();
  else if (tabName === 'leads') renderLeadsTab();
  else if (tabName === 'projects') renderProjectsTab();
  else if (tabName === 'settings') renderSettingsTab();
}

// 1. Dashboard Metrics
async function renderDashboardTab() {
  const container = document.getElementById('admin-tab-content');
  try {
    const res = await fetch(`${API_BASE}/admin/dashboard-stats`, { headers: authHeaders() });
    const stats = await res.json();

    container.innerHTML = `
      <div class="metrics-grid">
        <div class="metric-card">
          <div>
            <div class="metric-title">Total Orders</div>
            <div class="metric-val">${stats.total_orders}</div>
          </div>
          <div class="metric-icon-box">🛒</div>
        </div>
        <div class="metric-card">
          <div>
            <div class="metric-title">Generated Letters</div>
            <div class="metric-val">${stats.total_letters || 1}</div>
          </div>
          <div class="metric-icon-box" style="background: rgba(242, 130, 26, 0.15); color: #F2821A;">✉️</div>
        </div>
        <div class="metric-card">
          <div>
            <div class="metric-title">Pending RFQs</div>
            <div class="metric-val">${stats.pending_rfqs}</div>
          </div>
          <div class="metric-icon-box" style="background: rgba(59, 130, 246, 0.15); color: #3B82F6;">📑</div>
        </div>
        <div class="metric-card">
          <div>
            <div class="metric-title">Active Leads</div>
            <div class="metric-val">${stats.total_leads}</div>
          </div>
          <div class="metric-icon-box" style="background: rgba(168, 85, 247, 0.15); color: #C084FC;">👥</div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; margin-bottom: 2rem;">
        <div class="admin-card-table" style="padding: 1.5rem;">
          <h3 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 1.25rem;">Sales & Tender Quotations</h3>
          <div style="height: 220px; display: flex; align-items: flex-end; gap: 1.5rem; padding-top: 1rem; border-bottom: 1px solid #334155;">
            <div style="flex:1; background: linear-gradient(to top, #F2821A, #D95C00); height: 55%; border-radius: 6px 6px 0 0; position: relative;">
              <span style="position: absolute; top:-22px; width:100%; text-align:center; font-size:0.75rem;">₹1.8L</span>
            </div>
            <div style="flex:1; background: linear-gradient(to top, #F2821A, #D95C00); height: 85%; border-radius: 6px 6px 0 0; position: relative;">
              <span style="position: absolute; top:-22px; width:100%; text-align:center; font-size:0.75rem;">₹3.2L</span>
            </div>
            <div style="flex:1; background: linear-gradient(to top, #F2821A, #D95C00); height: 70%; border-radius: 6px 6px 0 0; position: relative;">
              <span style="position: absolute; top:-22px; width:100%; text-align:center; font-size:0.75rem;">₹2.5L</span>
            </div>
            <div style="flex:1; background: linear-gradient(to top, #F2821A, #D95C00); height: 95%; border-radius: 6px 6px 0 0; position: relative;">
              <span style="position: absolute; top:-22px; width:100%; text-align:center; font-size:0.75rem;">₹4.1L</span>
            </div>
          </div>
        </div>

        <div class="admin-card-table" style="padding: 1.5rem;">
          <h3 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 1rem;">System Audit Stream</h3>
          <div style="font-size: 0.85rem; color: #94A3B8;">
            ${(stats.recent_logs || []).map(l => `
              <div style="padding: 0.6rem 0; border-bottom: 1px stroke #334155; display: flex; justify-content: space-between;">
                <span>${l.action}</span>
                <span style="font-size: 0.75rem; color: #64748B;">${new Date(l.timestamp).toLocaleTimeString()}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div style="color:#EF4444">Error loading stats: ${err.message}</div>`;
  }
}

// Helper: Convert Number to Indian Currency Words
function numberToIndianWordsJS(num) {
  if (!num || isNaN(num) || num <= 0) return 'Rupees Zero only';
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 
             'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(n) {
    if (n === 0) return '';
    if (n < 20) return a[n];
    const tens = b[Math.floor(n / 10)];
    const units = a[n % 10];
    return units ? `${tens}-${units}` : tens;
  }

  function convertThreeDigits(n) {
    let str = '';
    const hundreds = Math.floor(n / 100);
    const rem = n % 100;
    if (hundreds > 0) {
      str += `${a[hundreds]} Hundred`;
      if (rem > 0) str += ' ';
    }
    if (rem > 0) {
      str += convertTwoDigits(rem);
    }
    return str;
  }

  const rounded = Math.round(Number(num));
  let crore = Math.floor(rounded / 10000000);
  let rem = rounded % 10000000;
  let lakh = Math.floor(rem / 100000);
  rem = rem % 100000;
  let thousand = Math.floor(rem / 1000);
  rem = rem % 1000;
  let hundred = rem;

  let words = [];
  if (crore > 0) words.push(`${convertThreeDigits(crore)} Crore`);
  if (lakh > 0) words.push(`${convertTwoDigits(lakh)} Lakh`);
  if (thousand > 0) words.push(`${convertTwoDigits(thousand)} Thousand`);
  if (hundred > 0) words.push(convertThreeDigits(hundred));

  return `Rupees ${words.join(' ')} only`;
}

// 2. UNIFIED FORMAL QUOTATION & TENDER LETTER GENERATOR TAB
async function renderQuotationGeneratorTab() {
  const container = document.getElementById('admin-tab-content');
  
  // Fetch existing quotes and letters
  let quotes = [];
  try {
    const [qRes, lRes] = await Promise.all([
      fetch(`${API_BASE}/admin/quotes`, { headers: authHeaders() }),
      fetch(`${API_BASE}/admin/letters`, { headers: authHeaders() })
    ]);
    const qData = qRes.ok ? await qRes.json() : [];
    const lData = lRes.ok ? await lRes.json() : [];
    
    // Combine and deduplicate by id/ref_no
    const seen = new Set();
    quotes = [...qData, ...lData].filter(item => {
      const key = item.ref_no || item.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  } catch (err) {
    console.error("Failed to fetch quotations:", err);
  }

  container.innerHTML = `
    <!-- Top Firm Identity Banner -->
    <div style="background: linear-gradient(135deg, #090D16 0%, #1E293B 100%); border: 1px solid #334155; border-radius: 12px; padding: 1.25rem 1.75rem; margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
      <div style="display: flex; align-items: center; gap: 1rem;">
        <img src="/assets/img/logo.png" alt="Ganita Ventures" style="height: 52px;">
        <div>
          <h2 style="margin: 0; font-size: 1.4rem; color: #FFF; font-family: 'Outfit', sans-serif; letter-spacing: 1px;">GANITA VENTURES</h2>
          <div style="font-size: 0.8rem; font-weight: 700; color: #F2821A; letter-spacing: 1px;">TRADING • SUPPLIES • PROJECTS • SERVICES</div>
          <div style="font-size: 0.8rem; color: #94A3B8; margin-top: 2px;">Puraniganj, Munger, Bihar – 811201 | GSTIN: 10AAAAA0000A1Z5</div>
        </div>
      </div>
      <div style="display: flex; gap: 0.75rem; align-items: center;">
        <button type="button" class="btn btn-outline" onclick="loadDhamdahaReferenceDefaults()" style="border-color: #F2821A; color: #F2821A;">
          🔄 Load Dhamdaha Reference Quotation
        </button>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1.3fr 0.7fr; gap: 2rem;">
      
      <!-- Interactive Quotation Builder Form -->
      <div class="admin-card-table" style="padding: 2rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; border-bottom: 1px solid #334155; padding-bottom: 1rem;">
          <h3 style="font-size: 1.3rem; font-weight: 700; color: #F2821A; margin: 0; display: flex; align-items: center; gap: 0.5rem;">
            📜 Formal Quotation & Tender Proposal Generator
          </h3>
          <span class="badge badge-success">Govt & Municipal Grade</span>
        </div>

        <form id="formal-quotation-form">
          
          <!-- 1. Reference & Date -->
          <div style="background: #090D16; border: 1px solid #334155; border-radius: 8px; padding: 1.25rem; margin-bottom: 1.5rem;">
            <div style="font-size: 0.85rem; font-weight: 700; color: #94A3B8; text-transform: uppercase; margin-bottom: 0.75rem; letter-spacing: 1px;">
              Document Metadata
            </div>
            <div style="display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 1rem;">
              <div>
                <label class="form-label" style="color: #CBD5E1;">Ref. No. *</label>
                <input type="text" id="q-ref" class="form-control" value="GV/PROC/2026-27/QT-9042" required style="background: #1E293B; color: #FFF;">
              </div>
              <div>
                <label class="form-label" style="color: #CBD5E1;">Date *</label>
                <input type="text" id="q-date" class="form-control" value="08/10/2026" required style="background: #1E293B; color: #FFF;">
              </div>
            </div>
          </div>

          <!-- 2. Recipient Information -->
          <div style="background: #090D16; border: 1px solid #334155; border-radius: 8px; padding: 1.25rem; margin-bottom: 1.5rem;">
            <div style="font-size: 0.85rem; font-weight: 700; color: #94A3B8; text-transform: uppercase; margin-bottom: 0.75rem; letter-spacing: 1px;">
              Client / Authority Details (To,)
            </div>
            <div style="margin-bottom: 1rem;">
              <label class="form-label" style="color: #CBD5E1;">Recipient Designation / Authority *</label>
              <input type="text" id="q-recip-designation" class="form-control" value="The Executive Officer / Competent Authority" required style="background: #1E293B; color: #FFF;">
            </div>
            <div style="margin-bottom: 1rem;">
              <label class="form-label" style="color: #CBD5E1;">Department / Office Name *</label>
              <input type="text" id="q-recip-org" class="form-control" value="Office of the Nagar Panchayat / Municipal Council" required style="background: #1E293B; color: #FFF;">
            </div>
            <div style="margin-bottom: 1rem;">
              <label class="form-label" style="color: #CBD5E1;">Location / District / State *</label>
              <input type="text" id="q-recip-loc" class="form-control" value="Dhamdaha, Bihar." required style="background: #1E293B; color: #FFF;">
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div>
                <label class="form-label" style="color: #CBD5E1;">Official Email</label>
                <input type="email" id="q-recip-email" class="form-control" value="nagarpanchayatdhamdhaha@gmail.com" style="background: #1E293B; color: #FFF;">
              </div>
              <div>
                <label class="form-label" style="color: #CBD5E1;">Contact Phone</label>
                <input type="text" id="q-recip-phone" class="form-control" value="+91 9835012345" style="background: #1E293B; color: #FFF;">
              </div>
            </div>
          </div>

          <!-- 3. Subject & Salutation & Body -->
          <div style="background: #090D16; border: 1px solid #334155; border-radius: 8px; padding: 1.25rem; margin-bottom: 1.5rem;">
            <div style="font-size: 0.85rem; font-weight: 700; color: #94A3B8; text-transform: uppercase; margin-bottom: 0.75rem; letter-spacing: 1px;">
              Proposal Subject & Narrative
            </div>
            <div style="margin-bottom: 1rem;">
              <label class="form-label" style="color: #CBD5E1;">Subject Line *</label>
              <input type="text" id="q-subject" class="form-control" value="Submission of Formal Quotation for Supply of Hydrated Lime Powder & Bleaching Powder – reg." required style="background: #1E293B; color: #FFF;">
            </div>
            <div style="margin-bottom: 1rem;">
              <label class="form-label" style="color: #CBD5E1;">Salutation</label>
              <input type="text" id="q-salutation" class="form-control" value="Respected Sir/Madam," style="background: #1E293B; color: #FFF;">
            </div>
            <div>
              <label class="form-label" style="color: #CBD5E1;">Opening / Reference Paragraphs</label>
              <textarea id="q-body" class="form-control" style="background: #1E293B; color: #FFF; min-height: 100px;">With reference to the ongoing sanitation and public health maintenance requirements under your esteemed office, we are pleased to submit our formal rate quotation for the supply of high-grade Hydrated Lime Powder and Bleaching Powder.

Ganita Ventures is committed to providing standard-compliant materials with timely execution. The itemized commercial proposal is detailed below for your kind consideration:</textarea>
            </div>
          </div>

          <!-- 4. Commercial Quotation Items Table Builder -->
          <div style="background: #090D16; border: 1px solid #334155; border-radius: 8px; padding: 1.25rem; margin-bottom: 1.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
              <div style="font-size: 0.95rem; font-weight: 700; color: #F2821A; text-transform: uppercase; letter-spacing: 0.5px;">
                📊 Commercial Quotation Table
              </div>
              <button type="button" class="btn btn-sm btn-outline" onclick="addQuotationItemRow()">
                + Add Material Row
              </button>
            </div>

            <!-- GST Addable / Removable Option Bar -->
            <div style="background: #1E293B; border: 1px solid #334155; border-radius: 8px; padding: 0.75rem 1rem; margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
              <label style="display: flex; align-items: center; gap: 0.6rem; cursor: pointer; color: #FFF; font-weight: 700; margin: 0; font-size: 0.88rem;">
                <input type="checkbox" id="q-include-gst" checked onchange="toggleGSTConfig()" style="width: 18px; height: 18px; accent-color: #F2821A; cursor: pointer;">
                Include GST in Quotation (Show GST % Column & Add GST to Total)
              </label>
              <div id="q-gst-rate-wrap" style="display: flex; align-items: center; gap: 0.5rem;">
                <span style="font-size: 0.8rem; color: #94A3B8;">Default GST %:</span>
                <select id="q-global-gst-rate" onchange="applyGlobalGSTRate(this.value)" class="form-control" style="width: 85px; padding: 4px 8px; background: #090D16; color: #FFF; font-size: 0.8rem;">
                  <option value="18" selected>18%</option>
                  <option value="12">12%</option>
                  <option value="5">5%</option>
                  <option value="28">28%</option>
                  <option value="0">0%</option>
                </select>
              </div>
            </div>

            <!-- Table Headers -->
            <div id="q-table-headers" style="display: grid; grid-template-columns: 0.4fr 2fr 0.9fr 0.9fr 0.6fr 1fr 0.3fr; gap: 0.5rem; font-size: 0.75rem; font-weight: 700; color: #94A3B8; text-transform: uppercase; padding-bottom: 0.5rem; border-bottom: 1px solid #334155;">
              <div style="text-align: center;">Sl.</div>
              <div>Description of Material</div>
              <div>Quantity</div>
              <div>Unit Rate (₹)</div>
              <div id="q-gst-col-header">GST %</div>
              <div id="q-amount-col-header">Taxable Amt (₹)</div>
              <div></div>
            </div>

            <div id="quotation-items-container" style="margin-top: 0.75rem;">
              <!-- Dynamic Rows inserted here -->
            </div>
          </div>

          <!-- 5. Commercial Totals Summary (Real-Time Auto-Calculated) -->
          <div style="background: #090D16; border: 1.5px solid #F2821A; border-radius: 8px; padding: 1.25rem; margin-bottom: 1.5rem;">
            <div style="font-size: 0.9rem; font-weight: 700; color: #F2821A; text-transform: uppercase; margin-bottom: 1rem; letter-spacing: 0.5px;">
              Commercial Breakdown & Totals (Live Calculation)
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 0.75rem;">
              <div>
                <label class="form-label" id="q-subtotal-label" style="color: #CBD5E1;">Taxable Subtotal (₹)</label>
                <input type="number" id="q-subtotal" class="form-control" value="40000" readonly style="background: #1E293B; color: #FFF; font-weight: 700;">
              </div>
              <div id="q-gst-summary-row">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
                  <label class="form-label" style="color: #CBD5E1; margin: 0;">Applicable GST (₹)</label>
                  <div style="display: flex; gap: 0.6rem; align-items: center;">
                    <button type="button" id="btn-gst-autocalc" onclick="resetToAutoGST()" title="Revert to auto-calculated GST" style="background: none; border: none; color: #38BDF8; font-size: 0.75rem; cursor: pointer; text-decoration: underline; padding: 0;">Auto-Calc</button>
                    <button type="button" id="btn-remove-applicable-gst" onclick="removeApplicableGST()" title="Remove Applicable GST" style="background: none; border: none; color: #EF4444; font-weight: 800; font-size: 0.8rem; cursor: pointer; padding: 0;">✕ Remove</button>
                  </div>
                </div>

                <div id="q-gst-input-container">
                  <input type="number" id="q-gst-amount" class="form-control" value="7200" oninput="handleManualGSTInput()" placeholder="Enter GST amount (₹)" style="background: #1E293B; color: #FFF; font-weight: 700; border: 1px solid #334155;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px; font-size: 0.72rem; color: #94A3B8;">
                    <span id="q-gst-status-text">Editable (auto-calculated)</span>
                    <span id="q-gst-edit-badge" style="display: none; background: #F2821A; color: #000; font-weight: 800; padding: 1px 6px; border-radius: 4px; font-size: 0.68rem; text-transform: uppercase;">Custom Edited</span>
                  </div>
                </div>

                <div id="q-gst-removed-placeholder" style="display: none; background: #1E293B; border: 1.5px dashed #475569; border-radius: 6px; padding: 0.65rem 0.85rem; align-items: center; justify-content: space-between;">
                  <span style="color: #94A3B8; font-size: 0.82rem; font-weight: 600;">🚫 GST Excluded (₹0.00)</span>
                  <button type="button" onclick="restoreApplicableGST()" class="btn btn-sm btn-outline" style="border-color: #F2821A; color: #F2821A; font-size: 0.75rem; padding: 3px 10px; font-weight: 700;">+ Add GST</button>
                </div>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
              <div>
                <label class="form-label" style="color: #CBD5E1;">Transportation & Unloading Charges (₹)</label>
                <input type="number" id="q-transport" class="form-control" value="1000" oninput="recalculateQuotationTotals()" style="background: #1E293B; color: #FFF;">
              </div>
              <div>
                <label class="form-label" style="color: #F2821A; font-weight: 800;">Total Gross Amount (₹)</label>
                <input type="number" id="q-gross-total" class="form-control" value="48200" readonly style="background: #1E293B; color: #F2821A; font-size: 1.15rem; font-weight: 900; border-color: #F2821A;">
              </div>
            </div>

            <div style="background: #1E293B; border-radius: 6px; padding: 0.75rem 1rem;">
              <div style="font-size: 0.75rem; color: #94A3B8; text-transform: uppercase; font-weight: 700; margin-bottom: 2px;">Amount in Words:</div>
              <div id="q-words-preview" style="font-size: 0.95rem; color: #F8FAFC; font-weight: 600; font-style: italic;">
                Rupees Forty-Eight Thousand Two Hundred only
              </div>
            </div>
          </div>

          <!-- 6. Terms & Conditions (Removable Section & Modular Clauses) -->
          <div style="background: #090D16; border: 1px solid #334155; border-radius: 8px; padding: 1.25rem; margin-bottom: 1.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid #334155; padding-bottom: 0.75rem;">
              <label style="display: flex; align-items: center; gap: 0.6rem; cursor: pointer; color: #FFF; font-weight: 700; margin: 0; font-size: 0.95rem;">
                <input type="checkbox" id="q-include-terms" checked onchange="toggleTermsConfig()" style="width: 18px; height: 18px; accent-color: #F2821A; cursor: pointer;">
                Include Terms & Conditions Section in Quotation
              </label>
              <button type="button" id="btn-add-term" class="btn btn-sm btn-outline" onclick="addTermClauseRow()" style="border-color: #F2821A; color: #F2821A;">
                + Add Clause
              </button>
            </div>

            <div id="terms-excluded-notice" style="display: none; background: #1E293B; border-left: 4px solid #64748B; padding: 0.85rem 1.25rem; border-radius: 6px; color: #94A3B8; font-size: 0.88rem;">
              ℹ️ <strong>Terms & Conditions Section Excluded:</strong> This section will be completely removed from the printed quotation document.
            </div>

            <div id="terms-clauses-wrapper">
              <div id="terms-clauses-list">
                <!-- Dynamic Term Clause Rows inserted here -->
              </div>
            </div>
          </div>

          <!-- 7. Concluding & Signatory Details -->
          <div style="background: #090D16; border: 1px solid #334155; border-radius: 8px; padding: 1.25rem; margin-bottom: 1.5rem;">
            <div style="font-size: 0.85rem; font-weight: 700; color: #94A3B8; text-transform: uppercase; margin-bottom: 0.75rem; letter-spacing: 1px;">
              Closing & Authorized Signatory
            </div>
            <div style="margin-bottom: 1rem;">
              <label class="form-label" style="color: #CBD5E1;">Concluding Request Text</label>
              <textarea id="q-concluding" class="form-control" style="background: #1E293B; color: #FFF; min-height: 50px;">We kindly request you to review our rates and favor us with the supply order. We assure you of our prompt service and highest standards of quality.</textarea>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem;">
              <div>
                <label class="form-label" style="color: #CBD5E1;">Signatory Name</label>
                <input type="text" id="q-signatory" class="form-control" value="Sushil Kumar" style="background: #1E293B; color: #FFF;">
              </div>
              <div>
                <label class="form-label" style="color: #CBD5E1;">Designation</label>
                <input type="text" id="q-sig-title" class="form-control" value="Proprietor" style="background: #1E293B; color: #FFF;">
              </div>
              <div>
                <label class="form-label" style="color: #CBD5E1;">Division / Dept</label>
                <input type="text" id="q-sig-dept" class="form-control" value="Procurement Division" style="background: #1E293B; color: #FFF;">
              </div>
            </div>
          </div>

          <!-- Submit Buttons -->
          <div style="display: flex; gap: 1rem;">
            <button type="submit" class="btn btn-primary" style="flex: 2; padding: 0.95rem; font-size: 1.05rem; font-weight: 800; background: #F2821A;">
              🖨️ Generate & Print Formal Quotation (PDF)
            </button>
            <button type="button" class="btn btn-outline" onclick="saveQuotationDraft()" style="flex: 1; padding: 0.95rem;">
              💾 Save to Database
            </button>
          </div>

        </form>
      </div>

      <!-- Right Column: Previously Generated Quotations Log -->
      <div>
        <div class="admin-card-table" style="padding: 1.5rem; position: sticky; top: 1rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
            <h3 style="font-size: 1.1rem; font-weight: 700; margin: 0;">Previously Generated Quotations (${quotes.length})</h3>
          </div>

          <div class="table-responsive" style="max-height: 600px; overflow-y: auto;">
            <table class="data-table" style="font-size: 0.85rem;">
              <thead>
                <tr>
                  <th>Ref. No</th>
                  <th>Recipient / Org</th>
                  <th>Gross Total</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${quotes.length === 0 ? `
                  <tr><td colspan="4" style="text-align: center; color: #64748B;">No quotations generated yet.</td></tr>
                ` : quotes.map(q => `
                  <tr>
                    <td>
                      <code style="font-size: 0.75rem; color: #F2821A;">${q.ref_no || q.id}</code><br>
                      <small style="color: #64748B;">${q.date || new Date(q.created_at || Date.now()).toLocaleDateString()}</small>
                    </td>
                    <td>
                      <strong>${q.recipient_org || q.customer_name || 'Municipal Department'}</strong><br>
                      <small style="color: #94A3B8;">${q.recipient_location || ''}</small>
                    </td>
                    <td>
                      <strong>₹ ${Number(q.gross_total || q.grand_total || 48200).toLocaleString('en-IN')}</strong>
                    </td>
                    <td style="white-space: nowrap;">
                      <a href="/api/quotes/${q.id || q.ref_no}/pdf" target="_blank" class="btn btn-sm btn-outline" style="padding: 4px 8px; font-size: 0.75rem;">
                        🖨️ Print
                      </a>
                      <button type="button" onclick="deleteQuotationRecord('${q.id}')" style="background: none; border: none; color: #EF4444; cursor: pointer; margin-left: 6px; font-weight: 700;">
                        ✕
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  `;

  // Initialize Default Items and Terms
  initDefaultQuotationRow();
  initDefaultTermsClauses();

  // Attach Form Submit
  document.getElementById('formal-quotation-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleQuotationSubmission(true);
  });
}

function initDefaultQuotationRow() {
  const container = document.getElementById('quotation-items-container');
  if (!container) return;
  container.innerHTML = '';
  addQuotationItemRow({
    sl: 1,
    description: "Supply of Hydrated Lime Powder (50 kg Bag) & Bleaching Powder",
    qty: "32 Bags",
    unit_rate: 1250,
    gst_rate: 18,
    taxable_amount: 40000
  });
}

function addQuotationItemRow(item = null) {
  const container = document.getElementById('quotation-items-container');
  if (!container) return;
  const count = container.children.length + 1;
  const isGST = document.getElementById('q-include-gst') ? document.getElementById('q-include-gst').checked : true;

  const row = document.createElement('div');
  row.className = 'quote-item-row';
  row.style.cssText = `display: grid; grid-template-columns: ${isGST ? '0.4fr 2fr 0.9fr 0.9fr 0.6fr 1fr 0.3fr' : '0.4fr 2.3fr 1fr 1fr 1.2fr 0.3fr'}; gap: 0.5rem; margin-bottom: 0.6rem; align-items: center;`;
  
  const desc = item ? item.description : '';
  const qty = item ? item.qty : '10 Bags';
  const unitRate = item ? item.unit_rate : 1000;
  const globalGSTRate = document.getElementById('q-global-gst-rate') ? parseFloat(document.getElementById('q-global-gst-rate').value) : 18;
  const gstRate = item ? item.gst_rate : globalGSTRate;
  const taxable = item ? item.taxable_amount : 10000;

  row.innerHTML = `
    <input type="text" class="form-control item-sl" value="${count}" style="background: #1E293B; color: #FFF; text-align: center; padding: 6px;">
    <input type="text" class="form-control item-desc" value="${desc}" placeholder="Description of Material" style="background: #1E293B; color: #FFF; padding: 6px;">
    <input type="text" class="form-control item-qty" value="${qty}" oninput="recalculateQuotationTotals()" placeholder="e.g. 32 Bags" style="background: #1E293B; color: #FFF; padding: 6px;">
    <input type="number" class="form-control item-rate" value="${unitRate}" oninput="recalculateQuotationTotals()" placeholder="Rate (₹)" style="background: #1E293B; color: #FFF; padding: 6px;">
    <input type="number" class="form-control item-gst" value="${gstRate}" oninput="recalculateQuotationTotals()" placeholder="GST %" style="background: #1E293B; color: #FFF; padding: 6px; display: ${isGST ? 'block' : 'none'};">
    <input type="number" class="form-control item-taxable" value="${taxable}" oninput="recalculateQuotationTotals(true)" placeholder="Taxable (₹)" style="background: #1E293B; color: #FFF; font-weight: 700; padding: 6px;">
    <button type="button" onclick="this.parentElement.remove(); recalculateQuotationTotals();" style="background: none; border: none; color: #EF4444; font-weight: 900; cursor: pointer; font-size: 1rem;">✕</button>
  `;

  container.appendChild(row);
  recalculateQuotationTotals();
}

let isGSTCustomEdited = false;

function handleManualGSTInput() {
  isGSTCustomEdited = true;
  const badge = document.getElementById('q-gst-edit-badge');
  const status = document.getElementById('q-gst-status-text');
  if (badge) badge.style.display = 'inline-block';
  if (status) status.textContent = 'Custom amount applied';
  recalculateQuotationTotals();
}

function resetToAutoGST() {
  isGSTCustomEdited = false;
  const badge = document.getElementById('q-gst-edit-badge');
  const status = document.getElementById('q-gst-status-text');
  if (badge) badge.style.display = 'none';
  if (status) status.textContent = 'Editable (auto-calculated)';
  recalculateQuotationTotals();
}

function removeApplicableGST() {
  const gstCheck = document.getElementById('q-include-gst');
  if (gstCheck) {
    gstCheck.checked = false;
  }
  toggleGSTConfig();
}

function restoreApplicableGST() {
  const gstCheck = document.getElementById('q-include-gst');
  if (gstCheck) {
    gstCheck.checked = true;
  }
  toggleGSTConfig();
  resetToAutoGST();
}

function toggleGSTConfig() {
  const isIncluded = document.getElementById('q-include-gst').checked;
  const gstHeader = document.getElementById('q-gst-col-header');
  const amountHeader = document.getElementById('q-amount-col-header');
  const subtotalLabel = document.getElementById('q-subtotal-label');
  const tableHeaders = document.getElementById('q-table-headers');
  const gstRateWrap = document.getElementById('q-gst-rate-wrap');

  const inputContainer = document.getElementById('q-gst-input-container');
  const removedPlaceholder = document.getElementById('q-gst-removed-placeholder');
  const autoCalcBtn = document.getElementById('btn-gst-autocalc');
  const removeBtn = document.getElementById('btn-remove-applicable-gst');

  if (tableHeaders) {
    tableHeaders.style.gridTemplateColumns = isIncluded 
      ? '0.4fr 2fr 0.9fr 0.9fr 0.6fr 1fr 0.3fr' 
      : '0.4fr 2.3fr 1fr 1fr 1.2fr 0.3fr';
  }
  if (gstHeader) gstHeader.style.display = isIncluded ? 'block' : 'none';
  if (amountHeader) amountHeader.textContent = isIncluded ? 'Taxable Amt (₹)' : 'Total Amt (₹)';
  if (subtotalLabel) subtotalLabel.textContent = isIncluded ? 'Taxable Subtotal (₹)' : 'Subtotal (₹)';
  if (gstRateWrap) gstRateWrap.style.display = isIncluded ? 'flex' : 'none';

  if (inputContainer) inputContainer.style.display = isIncluded ? 'block' : 'none';
  if (removedPlaceholder) removedPlaceholder.style.display = isIncluded ? 'none' : 'flex';
  if (autoCalcBtn) autoCalcBtn.style.display = isIncluded ? 'inline' : 'none';
  if (removeBtn) removeBtn.style.display = isIncluded ? 'inline' : 'none';

  document.querySelectorAll('.quote-item-row').forEach(row => {
    row.style.gridTemplateColumns = isIncluded 
      ? '0.4fr 2fr 0.9fr 0.9fr 0.6fr 1fr 0.3fr' 
      : '0.4fr 2.3fr 1fr 1fr 1.2fr 0.3fr';
    const gstInput = row.querySelector('.item-gst');
    if (gstInput) gstInput.style.display = isIncluded ? 'block' : 'none';
  });

  recalculateQuotationTotals();
}

function applyGlobalGSTRate(rate) {
  document.querySelectorAll('.quote-item-row .item-gst').forEach(input => {
    input.value = rate;
  });
  recalculateQuotationTotals();
}

function toggleTermsConfig() {
  const isIncluded = document.getElementById('q-include-terms').checked;
  const wrapper = document.getElementById('terms-clauses-wrapper');
  const notice = document.getElementById('terms-excluded-notice');
  const addBtn = document.getElementById('btn-add-term');
  if (wrapper) wrapper.style.display = isIncluded ? 'block' : 'none';
  if (notice) notice.style.display = isIncluded ? 'none' : 'block';
  if (addBtn) addBtn.style.display = isIncluded ? 'inline-block' : 'none';
}

function initDefaultTermsClauses() {
  const container = document.getElementById('terms-clauses-list');
  if (!container) return;
  container.innerHTML = '';
  addTermClauseRow("1. Validity", "This quotation remains valid for acceptance until 30th November 2026.");
  addTermClauseRow("2. Payment Terms", "30% mobilization advance upon issuance of the formal Purchase / Work Order; balance payment against delivery and physical verification of stock.");
  addTermClauseRow("3. Delivery Point", "Direct consignee store delivery within municipal premises / transit store point as designated by the department.");
  addTermClauseRow("4. Quality Standard", "All bags will be supplied sealed in moisture-proof packaging in compliance with public sanitation grade standards.");
}

function addTermClauseRow(title = "", text = "") {
  const container = document.getElementById('terms-clauses-list');
  if (!container) return;
  const count = container.children.length + 1;
  const div = document.createElement('div');
  div.className = 'term-clause-row';
  div.style.cssText = 'display: grid; grid-template-columns: 1.1fr 3fr 0.4fr; gap: 0.75rem; margin-bottom: 0.75rem; align-items: center; background: #1E293B; padding: 0.6rem 0.8rem; border-radius: 6px; border: 1px solid #334155;';
  div.innerHTML = `
    <input type="text" class="form-control term-title" value="${title || `${count}. Clause`}" placeholder="Clause Title (e.g. 5. Warranty)" style="background: #090D16; color: #F2821A; font-weight: 700; padding: 6px;">
    <input type="text" class="form-control term-text" value="${text}" placeholder="Terms text / condition details" style="background: #090D16; color: #FFF; padding: 6px;">
    <button type="button" onclick="this.parentElement.remove()" style="background: none; border: none; color: #EF4444; font-weight: 800; cursor: pointer; font-size: 0.85rem;" title="Remove this clause">✕ Remove</button>
  `;
  container.appendChild(div);
}

function recalculateQuotationTotals(manualTaxable = false) {
  const isGST = document.getElementById('q-include-gst') ? document.getElementById('q-include-gst').checked : true;
  const rows = document.querySelectorAll('.quote-item-row');
  let subtotal = 0;
  let totalGST = 0;

  rows.forEach((row, idx) => {
    const slInput = row.querySelector('.item-sl');
    if (slInput) slInput.value = (idx + 1);

    const qtyStr = row.querySelector('.item-qty').value;
    const rateVal = parseFloat(row.querySelector('.item-rate').value) || 0;
    const gstRateVal = parseFloat(row.querySelector('.item-gst')?.value) || 18;
    const taxableInput = row.querySelector('.item-taxable');

    // Extract numeric quantity
    const match = qtyStr.match(/(\d+(\.\d+)?)/);
    const qtyNum = match ? parseFloat(match[0]) : 1;

    let itemTaxable = 0;
    if (manualTaxable && taxableInput && parseFloat(taxableInput.value)) {
      itemTaxable = parseFloat(taxableInput.value);
    } else {
      itemTaxable = Math.round(qtyNum * rateVal);
      if (taxableInput) taxableInput.value = itemTaxable;
    }

    subtotal += itemTaxable;
    if (isGST) {
      totalGST += Math.round(itemTaxable * (gstRateVal / 100));
    }
  });

  const subtotalEl = document.getElementById('q-subtotal');
  if (subtotalEl) subtotalEl.value = subtotal;

  const gstEl = document.getElementById('q-gst-amount');
  let gstAmount = 0;
  if (!isGST) {
    gstAmount = 0;
    if (gstEl) gstEl.value = 0;
  } else if (isGSTCustomEdited && gstEl && gstEl.value !== '') {
    gstAmount = parseFloat(gstEl.value) || 0;
  } else {
    gstAmount = totalGST;
    if (gstEl) gstEl.value = totalGST;
  }

  const transportVal = parseFloat(document.getElementById('q-transport').value) || 0;
  const grossTotal = subtotal + gstAmount + transportVal;

  const grossEl = document.getElementById('q-gross-total');
  if (grossEl) grossEl.value = grossTotal;

  const words = numberToIndianWordsJS(grossTotal);
  const wordsEl = document.getElementById('q-words-preview');
  if (wordsEl) wordsEl.textContent = words;
}

function loadDhamdahaReferenceDefaults() {
  document.getElementById('q-ref').value = "GV/PROC/2026-27/QT-9042";
  document.getElementById('q-date').value = "08/10/2026";
  document.getElementById('q-recip-designation').value = "The Executive Officer / Competent Authority";
  document.getElementById('q-recip-org').value = "Office of the Nagar Panchayat / Municipal Council";
  document.getElementById('q-recip-loc').value = "Dhamdaha, Bihar.";
  document.getElementById('q-recip-email').value = "nagarpanchayatdhamdhaha@gmail.com";
  document.getElementById('q-recip-phone').value = "+91 9835012345";
  document.getElementById('q-subject').value = "Submission of Formal Quotation for Supply of Hydrated Lime Powder & Bleaching Powder – reg.";
  document.getElementById('q-salutation').value = "Respected Sir/Madam,";
  document.getElementById('q-body').value = `With reference to the ongoing sanitation and public health maintenance requirements under your esteemed office, we are pleased to submit our formal rate quotation for the supply of high-grade Hydrated Lime Powder and Bleaching Powder.

Ganita Ventures is committed to providing standard-compliant materials with timely execution. The itemized commercial proposal is detailed below for your kind consideration:`;
  
  // Reset GST to ON
  const gstCheck = document.getElementById('q-include-gst');
  if (gstCheck) {
    gstCheck.checked = true;
    toggleGSTConfig();
    resetToAutoGST();
  }

  // Reset Terms to ON
  const termsCheck = document.getElementById('q-include-terms');
  if (termsCheck) {
    termsCheck.checked = true;
    toggleTermsConfig();
  }

  initDefaultQuotationRow();
  initDefaultTermsClauses();

  document.getElementById('q-transport').value = 1000;
  document.getElementById('q-concluding').value = "We kindly request you to review our rates and favor us with the supply order. We assure you of our prompt service and highest standards of quality.";
  document.getElementById('q-signatory').value = "Sushil Kumar";
  document.getElementById('q-sig-title').value = "Proprietor";
  document.getElementById('q-sig-dept').value = "Procurement Division";

  recalculateQuotationTotals();
}

async function handleQuotationSubmission(openPrintWindow = true) {
  const isGST = document.getElementById('q-include-gst') ? document.getElementById('q-include-gst').checked : true;
  const isTerms = document.getElementById('q-include-terms') ? document.getElementById('q-include-terms').checked : true;

  const rows = document.querySelectorAll('.quote-item-row');
  const items = [];
  rows.forEach((row, idx) => {
    items.push({
      sl: idx + 1,
      description: row.querySelector('.item-desc').value,
      qty: row.querySelector('.item-qty').value,
      unit_rate: parseFloat(row.querySelector('.item-rate').value) || 0,
      gst_rate: isGST ? (parseFloat(row.querySelector('.item-gst').value) || 18) : 0,
      taxable_amount: parseFloat(row.querySelector('.item-taxable').value) || 0
    });
  });

  // Collect terms list
  const termsList = [];
  if (isTerms) {
    document.querySelectorAll('.term-clause-row').forEach(row => {
      const title = row.querySelector('.term-title').value.trim();
      const text = row.querySelector('.term-text').value.trim();
      if (text) {
        termsList.push(title ? `<strong>${title}:</strong> ${text}` : text);
      }
    });
  }

  const grossTotal = parseFloat(document.getElementById('q-gross-total').value) || 0;
  const quoteData = {
    ref_no: document.getElementById('q-ref').value,
    date: document.getElementById('q-date').value,
    recipient_designation: document.getElementById('q-recip-designation').value,
    recipient_org: document.getElementById('q-recip-org').value,
    recipient_location: document.getElementById('q-recip-loc').value,
    recipient_email: document.getElementById('q-recip-email').value,
    recipient_phone: document.getElementById('q-recip-phone').value,
    customer_name: `${document.getElementById('q-recip-designation').value}, ${document.getElementById('q-recip-org').value}`,
    customer_email: document.getElementById('q-recip-email').value,
    customer_phone: document.getElementById('q-recip-phone').value,
    subject: document.getElementById('q-subject').value,
    salutation: document.getElementById('q-salutation').value,
    body_text: document.getElementById('q-body').value,
    items: items,
    include_gst: isGST,
    include_terms: isTerms,
    terms_list: termsList,
    taxable_subtotal: parseFloat(document.getElementById('q-subtotal').value) || 0,
    gst_rate: isGST ? (isGSTCustomEdited ? 0 : 18) : 0,
    gst_amount: isGST ? (parseFloat(document.getElementById('q-gst-amount').value) || 0) : 0,
    transport_charges: parseFloat(document.getElementById('q-transport').value) || 0,
    gross_total: grossTotal,
    amount_words: numberToIndianWordsJS(grossTotal),
    concluding_text: document.getElementById('q-concluding').value,
    closing: "Thanking you.\n\nYours faithfully,",
    signatory: document.getElementById('q-signatory').value,
    signatory_title: document.getElementById('q-sig-title').value,
    signatory_dept: document.getElementById('q-sig-dept').value,
    status: "Submitted"
  };

  try {
    const res = await fetch(`${API_BASE}/admin/quotes`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(quoteData)
    });
    const createdQuote = await res.json();

    // Also persist in letters collection for dual route compatibility
    await fetch(`${API_BASE}/admin/letters`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ ...quoteData, id: createdQuote.id })
    });

    if (openPrintWindow && createdQuote.id) {
      window.open(`/api/quotes/${createdQuote.id}/pdf`, '_blank');
    }
    renderQuotationGeneratorTab();
  } catch (err) {
    alert("Error saving quotation: " + err.message);
  }
}

async function saveQuotationDraft() {
  await handleQuotationSubmission(false);
  alert("Quotation successfully saved to database!");
}

async function deleteQuotationRecord(id) {
  if (confirm("Delete this quotation record?")) {
    await fetch(`${API_BASE}/admin/quotes/${id}`, { method: 'DELETE', headers: authHeaders() });
    await fetch(`${API_BASE}/admin/letters/${id}`, { method: 'DELETE', headers: authHeaders() });
    renderQuotationGeneratorTab();
  }
}

// Aliases for sidebar routes
async function renderLettersTab() {
  renderQuotationGeneratorTab();
}

async function renderQuotesTab() {
  renderQuotationGeneratorTab();
}

// ==========================================
// 2B. TAX INVOICE & BILLING ENGINE
// Supports filling rates with GST or without GST
// ==========================================
let invoiceItems = [];
let editingInvoiceId = null;
let activeInvoiceViewMode = 'create'; // 'create' or 'history'
let defaultInvoiceRateMode = 'exclusive'; // 'exclusive' (without GST) or 'inclusive' (with GST)

// Master Display & Mandatory Configuration for Invoice Parts
let invoiceDisplayConfig = {
  // Brand Header
  show_logo: true,
  show_tagline: true,
  show_company_gstin: true,
  show_header_state: true,
  show_title_banner: true,

  // Buyer / Consignee
  show_customer_name: true,
  req_customer_name: true,
  show_customer_address: true,
  req_customer_address: true,
  show_customer_gstin: true,
  req_customer_gstin: false,
  show_customer_phone: true,
  req_customer_phone: false,
  show_customer_email: false,
  req_customer_email: false,

  // Metadata / Logistics
  show_inv_no: true,
  req_inv_no: true,
  show_inv_date: true,
  req_inv_date: true,
  show_due_date: true,
  req_due_date: false,
  show_pos: true,
  req_pos: true,
  show_po_ref: true,
  req_po_ref: false,
  show_vehicle: true,
  req_vehicle: false,
  show_reverse_charge: true,

  // Items Table Columns
  show_col_hsn: true,
  req_col_hsn: false,
  show_col_qty: true,
  show_col_unit: true,
  show_col_rate_exclusive: true,
  show_col_rate_inclusive: true,
  show_col_taxable: true,
  show_col_tax: true,
  show_col_total: true,

  // Financial & Bottom
  show_hsn_summary_table: true,
  show_freight: true,
  show_discount: true,
  show_round_off: true,
  show_amount_words: true,
  show_bank_details: true,
  show_terms: true,
  req_terms: false,
  show_signatory: true
};

function renderFieldHeader(label, fieldKey, options = { hasMandatory: true }) {
  const isShown = invoiceDisplayConfig['show_' + fieldKey] !== false;
  const isReq = !!invoiceDisplayConfig['req_' + fieldKey];
  
  return `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
      <label class="form-label" style="color: #CBD5E1; font-size: 0.82rem; font-weight: 600; margin: 0;">
        ${label} <span id="req-star-${fieldKey}" style="color: #EF4444; font-weight: bold; ${isReq && isShown ? '' : 'display: none;'}">*</span>
        <span id="excluded-badge-${fieldKey}" style="display: ${isShown ? 'none' : 'inline-block'}; font-size: 0.68rem; background: #334155; color: #94A3B8; padding: 1px 6px; border-radius: 4px; margin-left: 6px;">🚫 Removed</span>
      </label>
      <div style="display: inline-flex; align-items: center; gap: 8px; font-size: 0.72rem; user-select: none;">
        <label style="cursor: pointer; display: flex; align-items: center; gap: 3px; color: ${isShown ? '#38BDF8' : '#64748B'}; margin: 0;" title="Include on printed invoice or remove">
          <input type="checkbox" id="cfg-show_${fieldKey}" ${isShown ? 'checked' : ''} onchange="toggleInvoiceField('${fieldKey}', 'show')">
          <span>Include</span>
        </label>
        ${options.hasMandatory ? `
          <label style="cursor: pointer; display: flex; align-items: center; gap: 3px; color: ${isReq ? '#F59E0B' : '#64748B'}; margin: 0;" title="Mark this field as mandatory or optional">
            <input type="checkbox" id="cfg-req_${fieldKey}" ${isReq ? 'checked' : ''} ${!isShown ? 'disabled' : ''} onchange="toggleInvoiceField('${fieldKey}', 'req')">
            <span>Required</span>
          </label>
        ` : ''}
      </div>
    </div>
  `;
}

function toggleInvoiceField(fieldKey, type) {
  const key = `${type}_${fieldKey}`;
  const el = document.getElementById(`cfg-${key}`);
  if (el) {
    invoiceDisplayConfig[key] = el.checked;
  }
  
  if (type === 'show') {
    const isShown = el ? el.checked : true;
    const reqEl = document.getElementById(`cfg-req_${fieldKey}`);
    const inputId = fieldKey === 'terms' ? 'inv-notes' : (fieldKey === 'pos' ? 'inv-pos' : `inv-${fieldKey.replace(/_/g, '-')}`);
    const inputEl = document.getElementById(inputId);
    const badgeEl = document.getElementById(`excluded-badge-${fieldKey}`);
    const starEl = document.getElementById(`req-star-${fieldKey}`);
    
    if (!isShown) {
      if (reqEl) {
        reqEl.disabled = true;
      }
      if (starEl) starEl.style.display = 'none';
      if (inputEl) {
        inputEl.style.opacity = '0.35';
        inputEl.style.border = '1px dashed #64748B';
      }
      if (badgeEl) badgeEl.style.display = 'inline-block';
    } else {
      if (reqEl) {
        reqEl.disabled = false;
        if (reqEl.checked && starEl) starEl.style.display = 'inline';
      }
      if (inputEl) {
        inputEl.style.opacity = '1';
        inputEl.style.border = '1px solid #334155';
      }
      if (badgeEl) badgeEl.style.display = 'none';
    }
    
    if (el && el.parentElement) {
      el.parentElement.style.color = isShown ? '#38BDF8' : '#64748B';
    }
  } else if (type === 'req') {
    const isReq = el ? el.checked : false;
    const starEl = document.getElementById(`req-star-${fieldKey}`);
    if (starEl) starEl.style.display = isReq ? 'inline' : 'none';
    if (el && el.parentElement) {
      el.parentElement.style.color = isReq ? '#F59E0B' : '#64748B';
    }
  }
}

function applyInvoiceConfigPreset(presetName) {
  if (presetName === 'all') {
    Object.keys(invoiceDisplayConfig).forEach(k => {
      if (k.startsWith('show_')) invoiceDisplayConfig[k] = true;
    });
    invoiceDisplayConfig.req_customer_name = true;
    invoiceDisplayConfig.req_customer_address = true;
    invoiceDisplayConfig.req_inv_no = true;
    invoiceDisplayConfig.req_inv_date = true;
    invoiceDisplayConfig.req_pos = true;
  } else if (presetName === 'retail') {
    invoiceDisplayConfig.show_po_ref = false;
    invoiceDisplayConfig.show_vehicle = false;
    invoiceDisplayConfig.show_customer_gstin = false;
    invoiceDisplayConfig.show_customer_email = false;
    invoiceDisplayConfig.show_hsn_summary_table = false;
    invoiceDisplayConfig.req_po_ref = false;
    invoiceDisplayConfig.req_vehicle = false;
    invoiceDisplayConfig.req_customer_gstin = false;
  } else if (presetName === 'service') {
    invoiceDisplayConfig.show_vehicle = false;
    invoiceDisplayConfig.show_col_unit = false;
    invoiceDisplayConfig.req_vehicle = false;
  } else if (presetName === 'minimal') {
    invoiceDisplayConfig.show_po_ref = false;
    invoiceDisplayConfig.show_vehicle = false;
    invoiceDisplayConfig.show_due_date = false;
    invoiceDisplayConfig.show_hsn_summary_table = false;
    invoiceDisplayConfig.show_bank_details = false;
    invoiceDisplayConfig.show_terms = false;
    invoiceDisplayConfig.show_col_hsn = false;
  }
  syncInvoiceConfigUI();
}

function syncInvoiceConfigUI() {
  Object.keys(invoiceDisplayConfig).forEach(k => {
    const el = document.getElementById(`cfg-${k}`);
    if (el) {
      el.checked = !!invoiceDisplayConfig[k];
      if (k.startsWith('show_')) {
        const fieldKey = k.replace('show_', '');
        toggleInvoiceField(fieldKey, 'show');
      } else if (k.startsWith('req_')) {
        const fieldKey = k.replace('req_', '');
        toggleInvoiceField(fieldKey, 'req');
      }
    }
  });
}

function toggleHeaderIdentityPanel() {
  const panel = document.getElementById('header-identity-settings-panel');
  if (panel) {
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  }
}

async function renderInvoicesTab() {
  const container = document.getElementById('admin-tab-content');
  if (!container) return;

  container.innerHTML = `
    <div style="display:flex; justify-content:center; padding:3rem;">
      <div style="color:#94A3B8;">Loading Tax Invoice & Billing Engine...</div>
    </div>
  `;

  try {
    const res = await fetch(`${API_BASE}/admin/invoices`, { headers: authHeaders() });
    const invoices = await res.json();

    // Initialize with default items if empty
    if (invoiceItems.length === 0 && !editingInvoiceId) {
      invoiceItems = [
        {
          sl: 1,
          description: "Premium Grade Hydrated Lime Powder (50 Kg Bag)",
          hsn: "2522",
          qty: 40,
          unit: "Bags",
          rate_type: "exclusive",
          entered_rate: 850,
          unit_rate: 850,
          rate_with_gst: 1003,
          gst_rate: 18,
          taxable_amount: 34000,
          gst_amount: 6120,
          cgst_amount: 3060,
          sgst_amount: 3060,
          igst_amount: 0,
          total_amount: 40120
        },
        {
          sl: 2,
          description: "Stable Bleaching Powder 33% Available Chlorine (25 Kg Bag)",
          hsn: "2828",
          qty: 30,
          unit: "Bags",
          rate_type: "inclusive",
          entered_rate: 850,
          unit_rate: 720.34,
          rate_with_gst: 850,
          gst_rate: 18,
          taxable_amount: 21610.17,
          gst_amount: 3889.83,
          cgst_amount: 1944.92,
          sgst_amount: 1944.92,
          igst_amount: 0,
          total_amount: 25500
        }
      ];
    }

    container.innerHTML = `
      <!-- Top Firm Identity Banner -->
      <div style="background: linear-gradient(135deg, #090D16 0%, #1E293B 100%); border: 1px solid #334155; border-radius: 12px; padding: 1.25rem 1.75rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <img src="/assets/img/logo.png" alt="Ganita Ventures" style="height: 50px;">
          <div>
            <h2 style="margin: 0; font-size: 1.35rem; color: #FFF; font-family: 'Outfit', sans-serif; letter-spacing: 1px;">GANITA VENTURES</h2>
            <div style="font-size: 0.8rem; font-weight: 700; color: #F2821A; letter-spacing: 1px;">TAX INVOICE & GST BILLING ENGINE</div>
            <div style="font-size: 0.8rem; color: #94A3B8; margin-top: 2px;">Puraniganj, Munger, Bihar – 811201 | GSTIN: 10AAAAA0000A1Z5</div>
          </div>
        </div>
        <div style="display: flex; gap: 0.6rem; align-items: center; flex-wrap: wrap;">
          <button type="button" class="btn btn-sm ${activeInvoiceViewMode === 'create' ? 'btn-primary' : 'btn-outline'}" onclick="setInvoiceViewMode('create')" style="display: flex; align-items: center; gap: 0.4rem;">
            <span>🧾</span> ${editingInvoiceId ? 'Edit Invoice' : 'New Invoice Generator'}
          </button>
          <button type="button" class="btn btn-sm ${activeInvoiceViewMode === 'history' ? 'btn-primary' : 'btn-outline'}" onclick="setInvoiceViewMode('history')" style="display: flex; align-items: center; gap: 0.4rem;">
            <span>📋</span> Saved Invoices (${invoices.length})
          </button>
        </div>
      </div>

      ${activeInvoiceViewMode === 'history' ? renderSavedInvoicesListHTML(invoices) : renderInvoiceBuilderFormHTML()}
    `;

    if (activeInvoiceViewMode === 'create') {
      renderInvoiceItemsRows();
      recalculateInvoiceFinancials();
      syncInvoiceConfigUI();
    }
  } catch (err) {
    container.innerHTML = `<div style="color: #EF4444; padding: 2rem;">Error loading invoices: ${err.message}</div>`;
  }
}

function setInvoiceViewMode(mode) {
  activeInvoiceViewMode = mode;
  renderInvoicesTab();
}

function renderSavedInvoicesListHTML(invoices) {
  if (invoices.length === 0) {
    return `
      <div class="admin-card-table" style="text-align: center; padding: 4rem 1.5rem; color: #94A3B8;">
        <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">🧾</div>
        <h4 style="color: #FFF; margin-bottom: 0.5rem;">No Invoices Generated Yet</h4>
        <p style="font-size: 0.9rem; margin-bottom: 1.25rem;">Create and print your first GST Tax Invoice with customized rate options.</p>
        <button class="btn btn-primary" onclick="setInvoiceViewMode('create')">+ Create First Tax Invoice</button>
      </div>
    `;
  }

  return `
    <div class="admin-card-table">
      <div class="table-header-bar" style="display: flex; justify-content: space-between; align-items: center;">
        <div class="table-title">Tax Invoice Records (${invoices.length})</div>
        <button class="btn btn-sm btn-primary" onclick="startNewInvoice()">+ Create New Invoice</button>
      </div>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Invoice No</th>
              <th>Date</th>
              <th>Customer / Department</th>
              <th>Items & Qty</th>
              <th>Place of Supply</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${invoices.map(inv => {
              const itemsCount = (inv.items || []).length;
              return `
                <tr>
                  <td><strong style="color: #F2821A; font-family: monospace; font-size: 0.95rem;">${inv.invoice_no || inv.id}</strong></td>
                  <td>${inv.invoice_date || 'N/A'}</td>
                  <td>
                    <strong>${inv.customer_name}</strong>
                    ${inv.customer_gstin ? `<br><small style="color: #94A3B8;">GSTIN: ${inv.customer_gstin}</small>` : ''}
                  </td>
                  <td>${itemsCount} item${itemsCount > 1 ? 's' : ''}</td>
                  <td><span class="badge badge-primary">${inv.place_of_supply || 'Bihar (10)'}</span></td>
                  <td><strong style="color: #10B981; font-size: 1rem;">₹${Number(inv.grand_total || 0).toLocaleString('en-IN')}</strong></td>
                  <td><span class="badge badge-success">${inv.payment_status || 'Generated'}</span></td>
                  <td style="text-align: right;">
                    <div style="display: inline-flex; gap: 0.4rem;">
                      <a href="/api/admin/invoices/${inv.id}/print" target="_blank" class="btn btn-sm btn-primary" style="padding: 0.25rem 0.6rem; font-size: 0.75rem; text-decoration: none;">
                        🖨️ Print / PDF
                      </a>
                      <button type="button" class="btn btn-sm btn-outline" onclick="loadInvoiceForEditing('${inv.id}')" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">
                        ✏️ Edit
                      </button>
                      <button type="button" class="btn btn-sm btn-outline" onclick="deleteInvoiceRecord('${inv.id}')" style="border-color: #EF4444; color: #EF4444; padding: 0.25rem 0.5rem; font-size: 0.75rem;">
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderInvoiceBuilderFormHTML() {
  const today = new Date().toISOString().split('T')[0];
  const defaultDueDate = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];
  const autoInvNo = `INV/GV/2026-27/${Math.floor(100 + Math.random() * 900)}`;

  return `
    <div class="admin-card-table" style="padding: 1.75rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid #334155; padding-bottom: 1rem; flex-wrap: wrap; gap: 0.75rem;">
        <div>
          <h3 style="font-size: 1.3rem; font-weight: 700; color: #F2821A; margin: 0; display: flex; align-items: center; gap: 0.5rem;">
            🧾 ${editingInvoiceId ? 'Edit Tax Invoice #' + editingInvoiceId : 'Generate GST Tax Invoice'}
          </h3>
          <div style="font-size: 0.85rem; color: #94A3B8; margin-top: 2px;">
            Supports flexible rate inputs: <strong>Without GST (Exclusive)</strong> or <strong>With GST (Inclusive)</strong>. Every section can be marked mandatory or removed.
          </div>
        </div>
        <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
          <button type="button" class="btn btn-sm btn-outline" onclick="loadDhamdahaInvoicePreset()" style="border-color: #F2821A; color: #F2821A;">
            🏢 Quick Fill Dhamdaha Govt Preset
          </button>
          <button type="button" class="btn btn-sm btn-outline" onclick="startNewInvoice()">
            🔄 Reset Form
          </button>
        </div>
      </div>

      <!-- Quick Layout Presets & Master Controls Bar -->
      <div style="background: #090D16; border: 1px solid #334155; border-radius: 8px; padding: 0.75rem 1rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
        <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
          <span style="font-size: 0.8rem; font-weight: 700; color: #F2821A; text-transform: uppercase;">⚡ Quick Layout Presets:</span>
          <button type="button" class="btn btn-sm btn-outline" onclick="applyInvoiceConfigPreset('all')" style="font-size: 0.75rem; padding: 3px 8px;">
            🏛️ Full B2B GST (All Fields)
          </button>
          <button type="button" class="btn btn-sm btn-outline" onclick="applyInvoiceConfigPreset('retail')" style="font-size: 0.75rem; padding: 3px 8px;">
            🛍️ Retail / Cash Memo
          </button>
          <button type="button" class="btn btn-sm btn-outline" onclick="applyInvoiceConfigPreset('service')" style="font-size: 0.75rem; padding: 3px 8px;">
            🛠️ Service Work Order
          </button>
          <button type="button" class="btn btn-sm btn-outline" onclick="applyInvoiceConfigPreset('minimal')" style="font-size: 0.75rem; padding: 3px 8px;">
            📄 Minimal Clean Bill
          </button>
        </div>
        <button type="button" class="btn btn-sm btn-outline" onclick="toggleHeaderIdentityPanel()" style="font-size: 0.75rem; padding: 3px 10px; border-color: #38BDF8; color: #38BDF8;">
          ⚙️ Header & Identity Settings
        </button>
      </div>

      <!-- Collapsible Header Identity Settings Panel -->
      <div id="header-identity-settings-panel" style="display: none; background: #0B111E; border: 1px dashed #38BDF8; border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem;">
        <div style="font-size: 0.85rem; font-weight: 700; color: #38BDF8; margin-bottom: 0.5rem;">
          ⚙️ Printed Invoice Header & Letterhead Visibility Options:
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem; font-size: 0.8rem;">
          <label style="display: flex; align-items: center; gap: 6px; color: #CBD5E1; cursor: pointer;">
            <input type="checkbox" id="cfg-show_logo" checked onchange="toggleInvoiceField('logo', 'show')">
            Company Logo (Ganita Ventures)
          </label>
          <label style="display: flex; align-items: center; gap: 6px; color: #CBD5E1; cursor: pointer;">
            <input type="checkbox" id="cfg-show_tagline" checked onchange="toggleInvoiceField('tagline', 'show')">
            Company Tagline / Slogan
          </label>
          <label style="display: flex; align-items: center; gap: 6px; color: #CBD5E1; cursor: pointer;">
            <input type="checkbox" id="cfg-show_company_gstin" checked onchange="toggleInvoiceField('company_gstin', 'show')">
            Firm GSTIN & Regd Office Banner
          </label>
          <label style="display: flex; align-items: center; gap: 6px; color: #CBD5E1; cursor: pointer;">
            <input type="checkbox" id="cfg-show_header_state" checked onchange="toggleInvoiceField('header_state', 'show')">
            State & Original for Recipient Badge
          </label>
          <label style="display: flex; align-items: center; gap: 6px; color: #CBD5E1; cursor: pointer;">
            <input type="checkbox" id="cfg-show_title_banner" checked onchange="toggleInvoiceField('title_banner', 'show')">
            Rule 46 Tax Invoice Banner
          </label>
        </div>
      </div>

      <form id="invoice-builder-form" onsubmit="handleInvoiceSave(event)">
        <!-- 1. Two-Column Meta & Customer Details -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
          
          <!-- Customer / Bill To Box -->
          <div style="background: #090D16; border: 1px solid #334155; border-radius: 8px; padding: 1.25rem;">
            <div style="font-size: 0.85rem; font-weight: 700; color: #94A3B8; text-transform: uppercase; margin-bottom: 0.75rem; letter-spacing: 0.5px; display: flex; justify-content: space-between; align-items: center;">
              <span>🏢 Buyer / Consignee (Bill To & Ship To)</span>
            </div>
            
            <div style="margin-bottom: 0.85rem;">
              ${renderFieldHeader('Party / Organization Name', 'customer_name', { hasMandatory: true })}
              <input type="text" id="inv-customer-name" class="form-control" value="Nagar Panchayat Dhamdaha" style="background: #1E293B; color: #FFF;">
            </div>

            <div style="margin-bottom: 0.85rem;">
              ${renderFieldHeader('Address & Destination', 'customer_address', { hasMandatory: true })}
              <input type="text" id="inv-customer-address" class="form-control" value="Main Road, Ward No. 4, Dhamdaha, District Purnea, Bihar - 854301" style="background: #1E293B; color: #FFF;">
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
              <div>
                ${renderFieldHeader('Buyer GSTIN / UIN', 'customer_gstin', { hasMandatory: true })}
                <input type="text" id="inv-customer-gstin" class="form-control" value="10ABCDE1234F1Z5" placeholder="e.g. 10AAAAA0000A1Z5" style="background: #1E293B; color: #FFF;">
              </div>
              <div>
                ${renderFieldHeader('Contact Phone', 'customer_phone', { hasMandatory: true })}
                <input type="text" id="inv-customer-phone" class="form-control" value="+91 9835012345" style="background: #1E293B; color: #FFF;">
              </div>
            </div>

            <div style="margin-top: 0.85rem;">
              ${renderFieldHeader('Contact Email', 'customer_email', { hasMandatory: true })}
              <input type="email" id="inv-customer-email" class="form-control" value="nagarpanchayatdhamdaha@gmail.com" placeholder="Email address" style="background: #1E293B; color: #FFF;">
            </div>
          </div>

          <!-- Invoice Metadata Box -->
          <div style="background: #090D16; border: 1px solid #334155; border-radius: 8px; padding: 1.25rem;">
            <div style="font-size: 0.85rem; font-weight: 700; color: #94A3B8; text-transform: uppercase; margin-bottom: 0.75rem; letter-spacing: 0.5px;">
              🧾 Invoice Details & Logistics
            </div>

            <div style="display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 0.75rem; margin-bottom: 0.85rem;">
              <div>
                ${renderFieldHeader('Invoice No.', 'inv_no', { hasMandatory: true })}
                <input type="text" id="inv-number" class="form-control" value="${autoInvNo}" style="background: #1E293B; color: #FFF; font-family: monospace; font-weight: 700;">
              </div>
              <div>
                ${renderFieldHeader('Invoice Date', 'inv_date', { hasMandatory: true })}
                <input type="date" id="inv-date" class="form-control" value="${today}" style="background: #1E293B; color: #FFF;">
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 0.75rem; margin-bottom: 0.85rem;">
              <div>
                ${renderFieldHeader('Place of Supply', 'pos', { hasMandatory: true })}
                <select id="inv-pos" class="form-control" onchange="recalculateInvoiceFinancials()" style="background: #1E293B; color: #FFF;">
                  <option value="Bihar (10)">Intra-State: Bihar (10) - CGST + SGST</option>
                  <option value="Inter-State (IGST)">Inter-State: Outside Bihar - IGST</option>
                </select>
              </div>
              <div>
                ${renderFieldHeader('Payment Due Date', 'due_date', { hasMandatory: true })}
                <input type="date" id="inv-due-date" class="form-control" value="${defaultDueDate}" style="background: #1E293B; color: #FFF;">
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
              <div>
                ${renderFieldHeader('PO / Work Order Ref', 'po_ref', { hasMandatory: true })}
                <input type="text" id="inv-po-ref" class="form-control" value="PO/DHM/2026/892" placeholder="Work Order No" style="background: #1E293B; color: #FFF;">
              </div>
              <div>
                ${renderFieldHeader('Transport / Vehicle No', 'vehicle', { hasMandatory: true })}
                <input type="text" id="inv-vehicle" class="form-control" value="Road / BR-08-G-4512" placeholder="Vehicle No" style="background: #1E293B; color: #FFF;">
              </div>
            </div>

            <div style="margin-top: 0.85rem; padding-top: 0.5rem; border-top: 1px solid #1E293B; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.82rem; color: #CBD5E1; font-weight: 600;">Reverse Charge Mechanism (RCM):</span>
              <label style="cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 0.75rem; color: #94A3B8;">
                <input type="checkbox" id="cfg-show_reverse_charge" checked onchange="toggleInvoiceField('reverse_charge', 'show')">
                Include on Invoice
              </label>
            </div>
          </div>
        </div>

        <!-- 2. Line Items Section (With Rate Mode Options: with GST / without GST) -->
        <div style="background: #090D16; border: 1px solid #334155; border-radius: 8px; padding: 1.25rem; margin-bottom: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.75rem;">
            <div>
              <div style="font-size: 0.95rem; font-weight: 700; color: #FFF; text-transform: uppercase; letter-spacing: 0.5px;">
                📦 Items, Quantities & Rates (With / Without GST)
              </div>
              <div style="font-size: 0.8rem; color: #94A3B8;">
                Input rates <strong>Without GST (Base Rate)</strong> OR <strong>With GST (Inclusive Rate)</strong>. Select which columns to include on printed invoice.
              </div>
            </div>

            <!-- Global Default Rate Mode Selector -->
            <div style="display: flex; align-items: center; gap: 0.5rem; background: #1E293B; padding: 4px 10px; border-radius: 8px; border: 1px solid #334155;">
              <span style="font-size: 0.78rem; font-weight: 700; color: #CBD5E1;">Rate Mode for Items:</span>
              <button type="button" class="btn btn-sm ${defaultInvoiceRateMode === 'exclusive' ? 'btn-primary' : 'btn-outline'}" onclick="setGlobalInvoiceRateMode('exclusive')" style="font-size: 0.75rem; padding: 3px 8px;">
                🟢 Without GST
              </button>
              <button type="button" class="btn btn-sm ${defaultInvoiceRateMode === 'inclusive' ? 'btn-primary' : 'btn-outline'}" onclick="setGlobalInvoiceRateMode('inclusive')" style="font-size: 0.75rem; padding: 3px 8px;">
                🔵 With GST
              </button>
            </div>
          </div>

          <!-- Invoice Columns Include/Remove Strip -->
          <div style="background: #1E293B; border: 1px solid #334155; border-radius: 6px; padding: 6px 12px; margin-bottom: 0.85rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
            <span style="font-size: 0.75rem; font-weight: 700; color: #F2821A;">Columns to Include on Invoice:</span>
            <div style="display: flex; gap: 10px; font-size: 0.75rem; flex-wrap: wrap; color: #CBD5E1;">
              <label style="cursor: pointer; display: flex; align-items: center; gap: 3px;">
                <input type="checkbox" id="cfg-show_col_hsn" checked onchange="toggleInvoiceField('col_hsn', 'show')"> HSN/SAC
              </label>
              <label style="cursor: pointer; display: flex; align-items: center; gap: 3px; color: #F59E0B;" title="Require HSN code for each item">
                <input type="checkbox" id="cfg-req_col_hsn" onchange="toggleInvoiceField('col_hsn', 'req')"> Mandatory HSN
              </label>
              <label style="cursor: pointer; display: flex; align-items: center; gap: 3px;">
                <input type="checkbox" id="cfg-show_col_unit" checked onchange="toggleInvoiceField('col_unit', 'show')"> Unit
              </label>
              <label style="cursor: pointer; display: flex; align-items: center; gap: 3px;">
                <input type="checkbox" id="cfg-show_col_rate_exclusive" checked onchange="toggleInvoiceField('col_rate_exclusive', 'show')"> Rate (w/o GST)
              </label>
              <label style="cursor: pointer; display: flex; align-items: center; gap: 3px;">
                <input type="checkbox" id="cfg-show_col_rate_inclusive" checked onchange="toggleInvoiceField('col_rate_inclusive', 'show')"> Rate (with GST)
              </label>
              <label style="cursor: pointer; display: flex; align-items: center; gap: 3px;">
                <input type="checkbox" id="cfg-show_col_tax" checked onchange="toggleInvoiceField('col_tax', 'show')"> GST Tax Breakdown
              </label>
            </div>
          </div>

          <!-- Items Table -->
          <div class="table-responsive" style="overflow-x: auto; -webkit-overflow-scrolling: touch; border: 1px solid #1E293B; border-radius: 8px;">
            <table class="invoice-items-table" style="width: 100%; min-width: 1080px;">
              <colgroup>
                <col style="width: 32px;">
                <col style="width: 250px;">
                <col style="width: 80px;">
                <col style="width: 75px;">
                <col style="width: 85px;">
                <col style="width: 105px;">
                <col style="width: 115px;">
                <col style="width: 70px;">
                <col style="width: 95px;">
                <col style="width: 90px;">
                <col style="width: 105px;">
                <col style="width: 35px;">
              </colgroup>
              <thead>
                <tr>
                  <th style="text-align: center;">#</th>
                  <th>Item Description</th>
                  <th style="text-align: center;">HSN/SAC</th>
                  <th style="text-align: center;">Qty</th>
                  <th style="text-align: center;">Unit</th>
                  <th style="text-align: center;">Rate Type</th>
                  <th style="text-align: right;">Rate (₹)</th>
                  <th style="text-align: center;">GST %</th>
                  <th style="text-align: right;">Taxable (₹)</th>
                  <th style="text-align: right;">GST (₹)</th>
                  <th style="text-align: right;">Total (₹)</th>
                  <th style="text-align: center;"></th>
                </tr>
              </thead>
              <tbody id="invoice-items-tbody">
                <!-- Rendered dynamically -->
              </tbody>
            </table>
          </div>

          <!-- Table Bottom Bar: Quick Shortcuts -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; flex-wrap: wrap; gap: 0.75rem; border-top: 1px solid #1E293B; padding-top: 1rem;">
            <div style="display: flex; gap: 0.4rem; flex-wrap: wrap; align-items: center;">
              <span style="font-size: 0.75rem; font-weight: 700; color: #94A3B8;">Quick Add:</span>
              <button type="button" class="btn btn-sm btn-outline" onclick="addInvoiceItemPreset('lime')" style="font-size: 0.75rem; padding: 3px 8px;">
                + Lime Powder 50kg
              </button>
              <button type="button" class="btn btn-sm btn-outline" onclick="addInvoiceItemPreset('bleaching')" style="font-size: 0.75rem; padding: 3px 8px;">
                + Bleaching Powder 25kg
              </button>
              <button type="button" class="btn btn-sm btn-outline" onclick="addInvoiceItemPreset('phenyl')" style="font-size: 0.75rem; padding: 3px 8px;">
                + White Phenyl 5L
              </button>
              <button type="button" class="btn btn-sm btn-outline" onclick="addInvoiceItemPreset('stationery')" style="font-size: 0.75rem; padding: 3px 8px;">
                + Office Stationery
              </button>
            </div>
            <button type="button" class="btn btn-sm btn-primary" onclick="addNewBlankInvoiceRow()" style="display: flex; align-items: center; gap: 0.35rem;">
              <span>➕</span> Add Line Item
            </button>
          </div>
        </div>

        <!-- 3. Totals, Freight & Financial Summary -->
        <div style="display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 1.5rem; margin-bottom: 1.5rem;">
          
          <!-- Notes & Remittance Details -->
          <div style="background: #090D16; border: 1px solid #334155; border-radius: 8px; padding: 1.25rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
              <div style="font-size: 0.85rem; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.5px;">
                🏦 Bank Payment Details & Terms
              </div>
              <label style="cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 0.75rem; color: #38BDF8;">
                <input type="checkbox" id="cfg-show_bank_details" checked onchange="toggleInvoiceField('bank_details', 'show')">
                Include Bank Box
              </label>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 0.75rem;">
              <div>
                ${renderFieldHeader('Bank Name', 'bank_name', { hasMandatory: false })}
                <input type="text" id="inv-bank-name" class="form-control" value="State Bank of India" style="background: #1E293B; color: #FFF;">
              </div>
              <div>
                ${renderFieldHeader('Account No.', 'bank_account', { hasMandatory: false })}
                <input type="text" id="inv-bank-acc" class="form-control" value="3892019283019" style="background: #1E293B; color: #FFF; font-family: monospace;">
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 0.75rem;">
              <div>
                ${renderFieldHeader('IFSC Code', 'bank_ifsc', { hasMandatory: false })}
                <input type="text" id="inv-bank-ifsc" class="form-control" value="SBIN0000136" style="background: #1E293B; color: #FFF; font-family: monospace;">
              </div>
              <div>
                ${renderFieldHeader('Branch & UPI ID', 'bank_upi', { hasMandatory: false })}
                <input type="text" id="inv-bank-upi" class="form-control" value="Munger Branch | 8709605306@upi" style="background: #1E293B; color: #FFF;">
              </div>
            </div>

            <div>
              ${renderFieldHeader('Invoice Terms & Conditions / Notes', 'terms', { hasMandatory: true })}
              <textarea id="inv-notes" class="form-control" rows="2" style="background: #1E293B; color: #FFF;">1. Goods received in sound condition. 2. Payment due within 15 days from delivery date. 3. Subject to Munger Jurisdiction only.</textarea>
            </div>
          </div>

          <!-- Financial Calculation Box -->
          <div style="background: #090D16; border: 1px solid #334155; border-radius: 8px; padding: 1.25rem; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                <div style="font-size: 0.85rem; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.5px;">
                  💰 Financial Summary
                </div>
                <label style="cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 0.72rem; color: #38BDF8;" title="Show or remove HSN breakdown table on printed invoice">
                  <input type="checkbox" id="cfg-show_hsn_summary_table" checked onchange="toggleInvoiceField('hsn_summary_table', 'show')">
                  HSN Summary Table
                </label>
              </div>

              <div style="display: flex; justify-content: space-between; padding: 0.4rem 0; border-bottom: 1px solid #1E293B; font-size: 0.9rem;">
                <span style="color: #94A3B8;">Taxable Amount:</span>
                <strong style="color: #FFF;" id="inv-subtotal-display">₹0.00</strong>
              </div>

              <div id="inv-tax-breakdown-display" style="padding: 0.4rem 0; border-bottom: 1px solid #1E293B; font-size: 0.88rem;">
                <!-- CGST + SGST or IGST -->
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-top: 0.5rem; margin-bottom: 0.5rem;">
                <div>
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                    <label style="font-size: 0.78rem; color: #CBD5E1; margin: 0;">Freight (₹)</label>
                    <label style="font-size: 0.68rem; color: #38BDF8; cursor: pointer; margin: 0;">
                      <input type="checkbox" id="cfg-show_freight" checked onchange="toggleInvoiceField('freight', 'show')"> Include
                    </label>
                  </div>
                  <input type="number" id="inv-freight" class="form-control" value="1200" step="any" oninput="recalculateInvoiceFinancials()" style="background: #1E293B; color: #FFF; font-size: 0.85rem;">
                </div>
                <div>
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                    <label style="font-size: 0.78rem; color: #CBD5E1; margin: 0;">Discount (₹)</label>
                    <label style="font-size: 0.68rem; color: #38BDF8; cursor: pointer; margin: 0;">
                      <input type="checkbox" id="cfg-show_discount" checked onchange="toggleInvoiceField('discount', 'show')"> Include
                    </label>
                  </div>
                  <input type="number" id="inv-discount" class="form-control" value="0" step="any" oninput="recalculateInvoiceFinancials()" style="background: #1E293B; color: #FFF; font-size: 0.85rem;">
                </div>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0; font-size: 0.75rem; color: #94A3B8;">
                <label style="cursor: pointer; display: flex; align-items: center; gap: 4px;">
                  <input type="checkbox" id="cfg-show_amount_words" checked onchange="toggleInvoiceField('amount_words', 'show')"> Include Amount in Words
                </label>
                <label style="cursor: pointer; display: flex; align-items: center; gap: 4px;">
                  <input type="checkbox" id="cfg-show_signatory" checked onchange="toggleInvoiceField('signatory', 'show')"> Include Signatory Stamp Box
                </label>
              </div>
            </div>

            <!-- Grand Total Bar -->
            <div style="background: #1E293B; border: 1.5px solid #F2821A; border-radius: 8px; padding: 0.9rem 1.1rem; margin-top: 0.75rem;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #CBD5E1; font-size: 0.95rem; font-weight: 700;">TOTAL INVOICE VALUE:</span>
                <span id="inv-grand-total-display" style="color: #F2821A; font-size: 1.35rem; font-weight: 900;">₹0.00</span>
              </div>
              <div id="inv-words-display" style="font-size: 0.78rem; color: #94A3B8; font-style: italic; margin-top: 4px;">
                Rupees Zero only
              </div>
            </div>
          </div>
        </div>

        <!-- Submit & Actions Bar -->
        <div style="display: flex; justify-content: flex-end; gap: 0.75rem; border-top: 1px solid #334155; padding-top: 1.25rem;">
          <button type="button" class="btn btn-outline" onclick="setInvoiceViewMode('history')">Cancel</button>
          <button type="submit" id="btn-save-inv" class="btn btn-primary" style="display: flex; align-items: center; gap: 0.5rem;">
            <span>💾</span> Save Tax Invoice
          </button>
          <button type="button" class="btn btn-primary" onclick="handleSaveAndPrintInvoice()" style="background: #10B981; border-color: #10B981; display: flex; align-items: center; gap: 0.5rem;">
            <span>🖨️</span> Save & Print / PDF
          </button>
        </div>
      </form>
    </div>
  `;
}

function renderInvoiceItemsRows() {
  const tbody = document.getElementById('invoice-items-tbody');
  if (!tbody) return;

  tbody.innerHTML = invoiceItems.map((it, idx) => {
    const isInclusive = it.rate_type === 'inclusive';
    const ratePlaceholder = isInclusive ? 'Rate with GST' : 'Rate w/o GST';
    const otherRateLabel = isInclusive 
      ? `(Excl: ₹${Number(it.unit_rate || 0).toFixed(2)})` 
      : `(Incl: ₹${Number(it.rate_with_gst || 0).toFixed(2)})`;

    return `
      <tr style="border-bottom: 1px solid #1E293B;">
        <td style="text-align: center; color: #94A3B8; font-weight: 700; font-size: 0.82rem;">${idx + 1}</td>
        <td>
          <input type="text" class="table-input" value="${escapeHtml(it.description || '')}" placeholder="Item description & specifications" oninput="updateInvoiceItemField(${idx}, 'description', this.value)" required>
        </td>
        <td>
          <input type="text" class="table-input" value="${escapeHtml(it.hsn || '2522')}" placeholder="HSN" oninput="updateInvoiceItemField(${idx}, 'hsn', this.value)" style="text-align: center; font-family: monospace;">
        </td>
        <td>
          <input type="number" class="table-input" value="${it.qty || 1}" min="0.01" step="any" oninput="updateInvoiceItemField(${idx}, 'qty', this.value)" style="text-align: center; font-weight: 700;" required>
        </td>
        <td>
          <select class="table-input" onchange="updateInvoiceItemField(${idx}, 'unit', this.value)">
            <option value="Bags" ${it.unit === 'Bags' ? 'selected' : ''}>Bags</option>
            <option value="Kg" ${it.unit === 'Kg' ? 'selected' : ''}>Kg</option>
            <option value="Pcs" ${it.unit === 'Pcs' ? 'selected' : ''}>Pcs</option>
            <option value="Box" ${it.unit === 'Box' ? 'selected' : ''}>Box</option>
            <option value="Litres" ${it.unit === 'Litres' ? 'selected' : ''}>Litres</option>
            <option value="MT" ${it.unit === 'MT' ? 'selected' : ''}>MT</option>
            <option value="Quintal" ${it.unit === 'Quintal' ? 'selected' : ''}>Quintal</option>
            <option value="Nos" ${it.unit === 'Nos' ? 'selected' : ''}>Nos</option>
            <option value="Set" ${it.unit === 'Set' ? 'selected' : ''}>Set</option>
          </select>
        </td>
        <td>
          <select class="table-input" onchange="updateInvoiceItemField(${idx}, 'rate_type', this.value)" style="background: ${isInclusive ? '#1E3A8A' : '#14532D'}; color: #FFF; font-weight: 700;">
            <option value="exclusive" ${!isInclusive ? 'selected' : ''}>Excl. GST</option>
            <option value="inclusive" ${isInclusive ? 'selected' : ''}>Incl. GST</option>
          </select>
        </td>
        <td>
          <input type="number" class="table-input" value="${it.entered_rate !== undefined ? it.entered_rate : (isInclusive ? it.rate_with_gst : it.unit_rate)}" step="0.01" min="0" oninput="updateInvoiceItemField(${idx}, 'entered_rate', this.value)" placeholder="${ratePlaceholder}" style="text-align: right; font-weight: 700;" required>
          <div style="font-size: 0.68rem; color: #94A3B8; text-align: right; margin-top: 2px; white-space: nowrap;">
            ${otherRateLabel}
          </div>
        </td>
        <td>
          <select class="table-input" onchange="updateInvoiceItemField(${idx}, 'gst_rate', this.value)" style="text-align: center;">
            <option value="0" ${Number(it.gst_rate) === 0 ? 'selected' : ''}>0%</option>
            <option value="5" ${Number(it.gst_rate) === 5 ? 'selected' : ''}>5%</option>
            <option value="12" ${Number(it.gst_rate) === 12 ? 'selected' : ''}>12%</option>
            <option value="18" ${Number(it.gst_rate) === 18 ? 'selected' : ''}>18%</option>
            <option value="28" ${Number(it.gst_rate) === 28 ? 'selected' : ''}>28%</option>
          </select>
        </td>
        <td style="text-align: right; color: #CBD5E1; font-weight: 600; white-space: nowrap;">
          ₹${Number(it.taxable_amount || 0).toFixed(2)}
        </td>
        <td style="text-align: right; color: #38BDF8; font-weight: 600; white-space: nowrap;">
          ₹${Number(it.gst_amount || 0).toFixed(2)}
        </td>
        <td style="text-align: right; color: #F2821A; font-weight: 800; white-space: nowrap;">
          ₹${Number(it.total_amount || 0).toFixed(2)}
        </td>
        <td style="text-align: center;">
          <button type="button" onclick="removeInvoiceItemRow(${idx})" style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 6px; color: #EF4444; width: 28px; height: 28px; font-size: 1.1rem; line-height: 1; cursor: pointer; display: inline-flex; align-items: center; justify-content: center;" title="Remove Item">&times;</button>
        </td>
      </tr>
    `;
  }).join('');
}

function updateInvoiceItemField(idx, field, value) {
  if (!invoiceItems[idx]) return;

  if (field === 'qty') {
    invoiceItems[idx].qty = Math.max(0.01, parseFloat(value) || 0);
  } else if (field === 'gst_rate') {
    invoiceItems[idx].gst_rate = parseFloat(value) || 0;
  } else if (field === 'entered_rate') {
    invoiceItems[idx].entered_rate = parseFloat(value) || 0;
  } else if (field === 'rate_type') {
    invoiceItems[idx].rate_type = value;
    // When toggling rate type, update entered_rate to match
    if (value === 'inclusive') {
      invoiceItems[idx].entered_rate = invoiceItems[idx].rate_with_gst || invoiceItems[idx].unit_rate;
    } else {
      invoiceItems[idx].entered_rate = invoiceItems[idx].unit_rate || invoiceItems[idx].entered_rate;
    }
  } else {
    invoiceItems[idx][field] = value;
  }

  // Calculate row financials
  const qty = Number(invoiceItems[idx].qty) || 1;
  const gstRate = Number(invoiceItems[idx].gst_rate) || 0;
  const enteredRate = Number(invoiceItems[idx].entered_rate) || 0;
  const isInclusive = invoiceItems[idx].rate_type === 'inclusive';

  if (isInclusive) {
    // Entered rate is WITH GST
    const rateWithGST = enteredRate;
    const totalAmount = qty * rateWithGST;
    const taxableAmount = totalAmount / (1 + (gstRate / 100));
    const baseUnitRate = enteredRate / (1 + (gstRate / 100));
    const gstAmount = totalAmount - taxableAmount;

    invoiceItems[idx].rate_with_gst = rateWithGST;
    invoiceItems[idx].unit_rate = Number(baseUnitRate.toFixed(2));
    invoiceItems[idx].taxable_amount = Number(taxableAmount.toFixed(2));
    invoiceItems[idx].gst_amount = Number(gstAmount.toFixed(2));
    invoiceItems[idx].cgst_amount = Number((gstAmount / 2).toFixed(2));
    invoiceItems[idx].sgst_amount = Number((gstAmount / 2).toFixed(2));
    invoiceItems[idx].igst_amount = Number(gstAmount.toFixed(2));
    invoiceItems[idx].total_amount = Number(totalAmount.toFixed(2));
  } else {
    // Entered rate is WITHOUT GST (Exclusive)
    const baseUnitRate = enteredRate;
    const taxableAmount = qty * baseUnitRate;
    const gstAmount = taxableAmount * (gstRate / 100);
    const rateWithGST = baseUnitRate * (1 + (gstRate / 100));
    const totalAmount = taxableAmount + gstAmount;

    invoiceItems[idx].unit_rate = baseUnitRate;
    invoiceItems[idx].rate_with_gst = Number(rateWithGST.toFixed(2));
    invoiceItems[idx].taxable_amount = Number(taxableAmount.toFixed(2));
    invoiceItems[idx].gst_amount = Number(gstAmount.toFixed(2));
    invoiceItems[idx].cgst_amount = Number((gstAmount / 2).toFixed(2));
    invoiceItems[idx].sgst_amount = Number((gstAmount / 2).toFixed(2));
    invoiceItems[idx].igst_amount = Number(gstAmount.toFixed(2));
    invoiceItems[idx].total_amount = Number(totalAmount.toFixed(2));
  }

  renderInvoiceItemsRows();
  recalculateInvoiceFinancials();
}

function setGlobalInvoiceRateMode(mode) {
  defaultInvoiceRateMode = mode;
  invoiceItems.forEach((it, idx) => {
    it.rate_type = mode;
    if (mode === 'inclusive') {
      it.entered_rate = it.rate_with_gst || it.unit_rate;
    } else {
      it.entered_rate = it.unit_rate || it.entered_rate;
    }
    updateInvoiceItemField(idx, 'rate_type', mode);
  });
  renderInvoicesTab();
}

function addNewBlankInvoiceRow() {
  const isInc = defaultInvoiceRateMode === 'inclusive';
  invoiceItems.push({
    sl: invoiceItems.length + 1,
    description: '',
    hsn: '2522',
    qty: 1,
    unit: 'Bags',
    rate_type: defaultInvoiceRateMode,
    entered_rate: 1000,
    unit_rate: isInc ? 847.46 : 1000,
    rate_with_gst: isInc ? 1000 : 1180,
    gst_rate: 18,
    taxable_amount: isInc ? 847.46 : 1000,
    gst_amount: isInc ? 152.54 : 180,
    cgst_amount: isInc ? 76.27 : 90,
    sgst_amount: isInc ? 76.27 : 90,
    igst_amount: isInc ? 152.54 : 180,
    total_amount: isInc ? 1000 : 1180
  });
  renderInvoiceItemsRows();
  recalculateInvoiceFinancials();
}

function addInvoiceItemPreset(type) {
  const isInc = defaultInvoiceRateMode === 'inclusive';
  let p = {};
  if (type === 'lime') {
    p = {
      description: "Premium Hydrated Lime Powder (50 Kg Bag)",
      hsn: "2522",
      qty: 25,
      unit: "Bags",
      rate: isInc ? 1000 : 850,
      gst: 18
    };
  } else if (type === 'bleaching') {
    p = {
      description: "Stable Bleaching Powder 33% Grade (25 Kg Bag)",
      hsn: "2828",
      qty: 20,
      unit: "Bags",
      rate: isInc ? 850 : 720,
      gst: 18
    };
  } else if (type === 'phenyl') {
    p = {
      description: "Concentrated White Disinfectant Phenyl (5 Litre Can)",
      hsn: "3808",
      qty: 15,
      unit: "Nos",
      rate: isInc ? 350 : 296.61,
      gst: 18
    };
  } else if (type === 'stationery') {
    p = {
      description: "Institutional Office Stationery & Register Pack",
      hsn: "4820",
      qty: 10,
      unit: "Set",
      rate: isInc ? 1200 : 1016.95,
      gst: 18
    };
  }

  const enteredRate = p.rate;
  const gstRate = p.gst;
  const qty = p.qty;

  let unit_rate, rate_with_gst, taxable, gstAmt, total;
  if (isInc) {
    total = qty * enteredRate;
    taxable = total / (1 + (gstRate / 100));
    unit_rate = enteredRate / (1 + (gstRate / 100));
    gstAmt = total - taxable;
    rate_with_gst = enteredRate;
  } else {
    unit_rate = enteredRate;
    taxable = qty * unit_rate;
    gstAmt = taxable * (gstRate / 100);
    rate_with_gst = unit_rate * (1 + (gstRate / 100));
    total = taxable + gstAmt;
  }

  invoiceItems.push({
    sl: invoiceItems.length + 1,
    description: p.description,
    hsn: p.hsn,
    qty: p.qty,
    unit: p.unit,
    rate_type: defaultInvoiceRateMode,
    entered_rate: enteredRate,
    unit_rate: Number(unit_rate.toFixed(2)),
    rate_with_gst: Number(rate_with_gst.toFixed(2)),
    gst_rate: gstRate,
    taxable_amount: Number(taxable.toFixed(2)),
    gst_amount: Number(gstAmt.toFixed(2)),
    cgst_amount: Number((gstAmt / 2).toFixed(2)),
    sgst_amount: Number((gstAmt / 2).toFixed(2)),
    igst_amount: Number(gstAmt.toFixed(2)),
    total_amount: Number(total.toFixed(2))
  });

  renderInvoiceItemsRows();
  recalculateInvoiceFinancials();
}

function removeInvoiceItemRow(idx) {
  invoiceItems.splice(idx, 1);
  if (invoiceItems.length === 0) {
    addNewBlankInvoiceRow();
  } else {
    invoiceItems.forEach((it, i) => it.sl = i + 1);
    renderInvoiceItemsRows();
    recalculateInvoiceFinancials();
  }
}

function recalculateInvoiceFinancials() {
  const posEl = document.getElementById('inv-pos');
  const posVal = posEl ? posEl.value : 'Bihar (10)';
  const isInterState = posVal.toLowerCase().includes('inter') || 
                       (!posVal.toLowerCase().includes('bihar') && !posVal.includes('10'));

  let taxableSubtotal = 0;
  let totalCGST = 0;
  let totalSGST = 0;
  let totalIGST = 0;

  invoiceItems.forEach(it => {
    const tax = Number(it.taxable_amount) || 0;
    const gst = Number(it.gst_amount) || 0;
    taxableSubtotal += tax;

    if (isInterState) {
      totalIGST += gst;
    } else {
      totalCGST += (gst / 2);
      totalSGST += (gst / 2);
    }
  });

  const freightEl = document.getElementById('inv-freight');
  const discountEl = document.getElementById('inv-discount');
  const freight = Number(freightEl ? freightEl.value : 0) || 0;
  const discount = Number(discountEl ? discountEl.value : 0) || 0;

  const rawGrandTotal = taxableSubtotal + (isInterState ? totalIGST : (totalCGST + totalSGST)) + freight - discount;
  const roundedGrandTotal = Math.round(rawGrandTotal);
  const roundOff = Number((roundedGrandTotal - rawGrandTotal).toFixed(2));

  // Update DOM displays
  const subtotalDisplay = document.getElementById('inv-subtotal-display');
  if (subtotalDisplay) subtotalDisplay.textContent = `₹${taxableSubtotal.toFixed(2)}`;

  const taxBreakdownDisplay = document.getElementById('inv-tax-breakdown-display');
  if (taxBreakdownDisplay) {
    if (isInterState) {
      taxBreakdownDisplay.innerHTML = `
        <div style="display: flex; justify-content: space-between; color: #38BDF8;">
          <span>IGST Total:</span>
          <strong>₹${totalIGST.toFixed(2)}</strong>
        </div>
      `;
    } else {
      taxBreakdownDisplay.innerHTML = `
        <div style="display: flex; justify-content: space-between; color: #38BDF8; margin-bottom: 2px;">
          <span>CGST Total:</span>
          <strong>₹${totalCGST.toFixed(2)}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; color: #38BDF8;">
          <span>SGST Total:</span>
          <strong>₹${totalSGST.toFixed(2)}</strong>
        </div>
      `;
    }
  }

  const grandTotalDisplay = document.getElementById('inv-grand-total-display');
  if (grandTotalDisplay) grandTotalDisplay.textContent = `₹${roundedGrandTotal.toLocaleString('en-IN')}.00`;

  const wordsDisplay = document.getElementById('inv-words-display');
  if (wordsDisplay) wordsDisplay.textContent = numberToIndianWordsJS(roundedGrandTotal);
}

function loadDhamdahaInvoicePreset() {
  document.getElementById('inv-customer-name').value = "The Executive Officer, Nagar Panchayat Dhamdaha";
  document.getElementById('inv-customer-address').value = "Office of the Nagar Panchayat Dhamdaha, District Purnea, Bihar - 854301";
  document.getElementById('inv-customer-gstin').value = "10ABCDE1234F1Z5";
  document.getElementById('inv-customer-phone').value = "+91 9835012345";
  document.getElementById('inv-pos').value = "Bihar (10)";
  document.getElementById('inv-po-ref').value = "PO/NPD/SAN/2026/892";
  document.getElementById('inv-vehicle').value = "Road / BR-08-G-4512";
  document.getElementById('inv-freight').value = "1200";

  invoiceItems = [
    {
      sl: 1,
      description: "High Grade Hydrated Lime Powder 90%+ Purity (50 Kg Bag)",
      hsn: "2522",
      qty: 40,
      unit: "Bags",
      rate_type: "exclusive",
      entered_rate: 850,
      unit_rate: 850,
      rate_with_gst: 1003,
      gst_rate: 18,
      taxable_amount: 34000,
      gst_amount: 6120,
      cgst_amount: 3060,
      sgst_amount: 3060,
      igst_amount: 0,
      total_amount: 40120
    },
    {
      sl: 2,
      description: "Stable Bleaching Powder (Grade 1 ISI) 25 Kg Bag",
      hsn: "2828",
      qty: 30,
      unit: "Bags",
      rate_type: "inclusive",
      entered_rate: 850,
      unit_rate: 720.34,
      rate_with_gst: 850,
      gst_rate: 18,
      taxable_amount: 21610.17,
      gst_amount: 3889.83,
      cgst_amount: 1944.92,
      sgst_amount: 1944.92,
      igst_amount: 0,
      total_amount: 25500
    }
  ];

  renderInvoiceItemsRows();
  recalculateInvoiceFinancials();
}

function startNewInvoice() {
  editingInvoiceId = null;
  invoiceItems = [];
  renderInvoicesTab();
}

async function handleInvoiceSave(e, printAfterSave = false) {
  if (e && e.preventDefault) e.preventDefault();

  const customerName = (document.getElementById('inv-customer-name') ? document.getElementById('inv-customer-name').value : '').trim();

  // Dynamic validation based on configured mandatory flags
  const mandatoryRules = [
    { key: 'customer_name', name: 'Party / Organization Name', elId: 'inv-customer-name' },
    { key: 'customer_address', name: 'Address & Destination', elId: 'inv-customer-address' },
    { key: 'customer_gstin', name: 'Buyer GSTIN / UIN', elId: 'inv-customer-gstin' },
    { key: 'customer_phone', name: 'Contact Phone', elId: 'inv-customer-phone' },
    { key: 'customer_email', name: 'Contact Email', elId: 'inv-customer-email' },
    { key: 'inv_no', name: 'Invoice Number', elId: 'inv-number' },
    { key: 'inv_date', name: 'Invoice Date', elId: 'inv-date' },
    { key: 'due_date', name: 'Payment Due Date', elId: 'inv-due-date' },
    { key: 'pos', name: 'Place of Supply', elId: 'inv-pos' },
    { key: 'po_ref', name: 'PO / Work Order Ref', elId: 'inv-po-ref' },
    { key: 'vehicle', name: 'Transport / Vehicle No', elId: 'inv-vehicle' },
    { key: 'bank_name', name: 'Bank Name', elId: 'inv-bank-name' },
    { key: 'bank_account', name: 'Bank Account No', elId: 'inv-bank-acc' },
    { key: 'bank_ifsc', name: 'IFSC Code', elId: 'inv-bank-ifsc' },
    { key: 'terms', name: 'Terms & Conditions', elId: 'inv-notes' }
  ];

  for (const rule of mandatoryRules) {
    if (invoiceDisplayConfig['req_' + rule.key] && invoiceDisplayConfig['show_' + rule.key] !== false) {
      const el = document.getElementById(rule.elId);
      if (!el || !el.value.trim()) {
        alert(`⚠️ Mandatory Field Required: Please enter "${rule.name}" before saving.`);
        if (el) el.focus();
        return;
      }
    }
  }

  if (invoiceDisplayConfig.req_col_hsn && invoiceDisplayConfig.show_col_hsn !== false) {
    for (let i = 0; i < invoiceItems.length; i++) {
      if (!invoiceItems[i].hsn || !invoiceItems[i].hsn.trim()) {
        alert(`⚠️ Mandatory Field Required: Line item #${i+1} is missing HSN/SAC code.`);
        return;
      }
    }
  }

  if (invoiceItems.length === 0) {
    alert("Please add at least one line item");
    return;
  }

  const saveBtn = document.getElementById('btn-save-inv');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving Invoice...";
  }

  const posVal = document.getElementById('inv-pos').value;
  const isInterState = posVal.toLowerCase().includes('inter') || 
                       (!posVal.toLowerCase().includes('bihar') && !posVal.includes('10'));

  let taxableSubtotal = 0;
  let totalCGST = 0;
  let totalSGST = 0;
  let totalIGST = 0;

  invoiceItems.forEach(it => {
    taxableSubtotal += Number(it.taxable_amount) || 0;
    const gst = Number(it.gst_amount) || 0;
    if (isInterState) totalIGST += gst;
    else {
      totalCGST += (gst / 2);
      totalSGST += (gst / 2);
    }
  });

  const freight = Number(document.getElementById('inv-freight').value) || 0;
  const discount = Number(document.getElementById('inv-discount').value) || 0;
  const rawGrandTotal = taxableSubtotal + (isInterState ? totalIGST : (totalCGST + totalSGST)) + freight - discount;
  const roundedGrandTotal = Math.round(rawGrandTotal);
  const roundOff = Number((roundedGrandTotal - rawGrandTotal).toFixed(2));
  const amountWords = numberToIndianWordsJS(roundedGrandTotal);

  const payload = {
    invoice_no: document.getElementById('inv-number').value.trim(),
    invoice_date: document.getElementById('inv-date').value,
    due_date: document.getElementById('inv-due-date').value,
    place_of_supply: posVal,
    po_number: document.getElementById('inv-po-ref').value.trim(),
    vehicle_no: document.getElementById('inv-vehicle').value.trim(),
    reverse_charge: false,
    transport_mode: "Road Delivery",
    customer_name: customerName,
    customer_address: document.getElementById('inv-customer-address').value.trim(),
    customer_gstin: document.getElementById('inv-customer-gstin').value.trim(),
    customer_phone: document.getElementById('inv-customer-phone').value.trim(),
    customer_email: (document.getElementById('inv-customer-email') ? document.getElementById('inv-customer-email').value : '').trim(),
    items: invoiceItems,
    rate_mode: defaultInvoiceRateMode,
    display_config: { ...invoiceDisplayConfig },
    taxable_subtotal: Number(taxableSubtotal.toFixed(2)),
    cgst_total: Number(totalCGST.toFixed(2)),
    sgst_total: Number(totalSGST.toFixed(2)),
    igst_total: Number(totalIGST.toFixed(2)),
    freight_charges: freight,
    discount: discount,
    round_off: roundOff,
    grand_total: roundedGrandTotal,
    amount_words: amountWords,
    bank_name: document.getElementById('inv-bank-name').value.trim(),
    bank_account: document.getElementById('inv-bank-acc').value.trim(),
    bank_ifsc: document.getElementById('inv-bank-ifsc').value.trim(),
    bank_upi: document.getElementById('inv-bank-upi').value.trim(),
    notes: document.getElementById('inv-notes').value.trim(),
    payment_status: "Pending"
  };

  try {
    let res;
    if (editingInvoiceId) {
      res = await fetch(`${API_BASE}/admin/invoices/${editingInvoiceId}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });
    } else {
      res = await fetch(`${API_BASE}/admin/invoices`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });
    }

    const saved = await res.json();
    if (res.ok) {
      alert(editingInvoiceId ? "Invoice updated successfully!" : "Tax Invoice generated successfully!");
      if (printAfterSave && saved.id) {
        window.open(`/api/admin/invoices/${saved.id}/print`, '_blank');
      }
      activeInvoiceViewMode = 'history';
      renderInvoicesTab();
    } else {
      alert("Error saving invoice: " + (saved.error || "Unknown error"));
    }
  } catch (err) {
    alert("Network error: " + err.message);
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = "💾 Save Tax Invoice";
    }
  }
}

function handleSaveAndPrintInvoice() {
  handleInvoiceSave(null, true);
}

async function loadInvoiceForEditing(id) {
  try {
    const res = await fetch(`${API_BASE}/admin/invoices`, { headers: authHeaders() });
    const list = await res.json();
    const inv = list.find(x => x.id === id);
    if (!inv) return;

    editingInvoiceId = inv.id;
    if (inv.display_config) {
      invoiceDisplayConfig = Object.assign({}, invoiceDisplayConfig, inv.display_config);
    }
    invoiceItems = (inv.items || []).map(it => ({
      ...it,
      entered_rate: it.entered_rate !== undefined ? it.entered_rate : (it.rate_type === 'inclusive' ? it.rate_with_gst : it.unit_rate)
    }));
    activeInvoiceViewMode = 'create';
    renderInvoicesTab();

    setTimeout(() => {
      if (document.getElementById('inv-customer-name')) {
        document.getElementById('inv-customer-name').value = inv.customer_name || '';
        document.getElementById('inv-customer-address').value = inv.customer_address || '';
        document.getElementById('inv-customer-gstin').value = inv.customer_gstin || '';
        document.getElementById('inv-customer-phone').value = inv.customer_phone || '';
        if (document.getElementById('inv-customer-email')) {
          document.getElementById('inv-customer-email').value = inv.customer_email || '';
        }
        document.getElementById('inv-number').value = inv.invoice_no || inv.id;
        document.getElementById('inv-date').value = inv.invoice_date || '';
        document.getElementById('inv-due-date').value = inv.due_date || '';
        document.getElementById('inv-pos').value = inv.place_of_supply || 'Bihar (10)';
        document.getElementById('inv-po-ref').value = inv.po_number || '';
        document.getElementById('inv-vehicle').value = inv.vehicle_no || '';
        document.getElementById('inv-freight').value = inv.freight_charges || 0;
        document.getElementById('inv-discount').value = inv.discount || 0;
        document.getElementById('inv-bank-name').value = inv.bank_name || 'State Bank of India';
        document.getElementById('inv-bank-acc').value = inv.bank_account || '3892019283019';
        document.getElementById('inv-bank-ifsc').value = inv.bank_ifsc || 'SBIN0000136';
        document.getElementById('inv-bank-upi').value = inv.bank_upi || '8709605306@upi';
        document.getElementById('inv-notes').value = inv.notes || '';
        renderInvoiceItemsRows();
        recalculateInvoiceFinancials();
        syncInvoiceConfigUI();
      }
    }, 50);
  } catch (err) {
    alert("Failed to load invoice: " + err.message);
  }
}

async function deleteInvoiceRecord(id) {
  if (!confirm("Are you sure you want to delete this Tax Invoice record?")) return;
  try {
    const res = await fetch(`${API_BASE}/admin/invoices/${id}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    if (res.ok) {
      renderInvoicesTab();
    } else {
      alert("Failed to delete invoice");
    }
  } catch (err) {
    alert("Network error: " + err.message);
  }
}

// 3. Orders Management Tab
async function renderOrdersTab() {
  const container = document.getElementById('admin-tab-content');
  const res = await fetch(`${API_BASE}/admin/orders`, { headers: authHeaders() });
  const orders = await res.json();

  container.innerHTML = `
    <div class="admin-card-table">
      <div class="table-header-bar">
        <div class="table-title">Customer Orders List (${orders.length})</div>
      </div>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Phone</th>
              <th>City</th>
              <th>Total</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${orders.map(o => `
              <tr>
                <td><strong>${o.id}</strong></td>
                <td>${o.customer_name}</td>
                <td>${o.customer_phone}</td>
                <td>${o.city}</td>
                <td>₹ ${(o.total_amount || 0).toLocaleString('en-IN')}</td>
                <td>
                  <select onchange="updateOrderStatus('${o.id}', this.value)" style="background: #090D16; color: #F2821A; border: 1px solid #334155; padding: 0.3rem 0.5rem; border-radius: 6px; font-weight: 600;">
                    ${['Order Received', 'Confirmed', 'Processing', 'Packed', 'Dispatched', 'Out for Delivery', 'Delivered', 'Cancelled'].map(s => `
                      <option value="${s}" ${o.order_status === s ? 'selected' : ''}>${s}</option>
                    `).join('')}
                  </select>
                </td>
                <td>
                  <button class="btn btn-sm btn-outline" onclick="alert('Order Items: ' + JSON.stringify(o.items, null, 2))">View Details</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

async function updateOrderStatus(orderId, status) {
  try {
    const res = await fetch(`${API_BASE}/admin/orders/${orderId}/status`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ order_status: status })
    });
    if (res.ok) alert(`Order ${orderId} updated to ${status}`);
  } catch (err) {
    alert('Failed to update status: ' + err.message);
  }
}

// 4. Products CMS Tab
async function renderProductsTab() {
  const container = document.getElementById('admin-tab-content');
  const res = await fetch(`${API_BASE}/products`);
  const products = await res.json();

  container.innerHTML = `
    <div style="margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
      <h3>Product Catalog CMS (Active 3 Products)</h3>
      <button class="btn btn-primary" onclick="openProductModal()">+ Add New Product</button>
    </div>

    <div class="admin-card-table">
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Product Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Mode</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${products.map(p => `
              <tr>
                <td><code>${p.sku}</code></td>
                <td><strong>${p.name}</strong></td>
                <td>${p.category}</td>
                <td>₹ ${p.discount_price || p.price}</td>
                <td><span class="badge badge-info">${p.mode}</span></td>
                <td>${p.stock_qty} ${p.unit}</td>
                <td><span class="badge ${p.status === 'active' ? 'badge-success' : 'badge-danger'}">${p.status}</span></td>
                <td>
                  <button class="btn btn-sm btn-outline" onclick="deleteProduct('${p.id}')" style="color:#EF4444">Delete</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

async function openProductModal() {
  const name = prompt("Enter Product Name:");
  if (!name) return;
  const sku = prompt("Enter SKU:", "GV-CHM-505");
  const price = parseFloat(prompt("Enter Selling Price (₹):", "500"));
  const cat = prompt("Enter Category:", "Chemicals & Minerals");

  const newProd = {
    sku,
    name,
    category: cat,
    short_description: "High quality commercial product sourced by Ganita Ventures.",
    description: "Built for industrial and commercial reliability.",
    price: price,
    discount_price: price,
    unit: "Bag",
    min_order_qty: 1,
    stock_qty: 100,
    stock_status: "in_stock",
    gst_percent: 18,
    brand: "Ganita Standard",
    mode: "buy_now",
    status: "active"
  };

  const res = await fetch(`${API_BASE}/admin/products`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(newProd)
  });

  if (res.ok) {
    alert("Product added successfully!");
    renderProductsTab();
  }
}

async function deleteProduct(id) {
  if (confirm("Are you sure you want to delete this product?")) {
    await fetch(`${API_BASE}/admin/products/${id}`, { method: 'DELETE', headers: authHeaders() });
    renderProductsTab();
  }
}

// 5. Services CMS Tab
async function renderServicesTab() {
  const container = document.getElementById('admin-tab-content');
  const res = await fetch(`${API_BASE}/services`);
  const services = await res.json();

  container.innerHTML = `
    <div style="margin-bottom: 1.5rem; display: flex; justify-content: space-between;">
      <h3>Service Categories CMS</h3>
      <button class="btn btn-primary" onclick="openServiceModal()">+ Add New Service</button>
    </div>

    <div class="admin-card-table">
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Service Name</th>
              <th>Description</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${services.map(s => `
              <tr>
                <td>#${s.ordering}</td>
                <td><strong>${s.name}</strong></td>
                <td>${s.description}</td>
                <td><span class="badge badge-success">${s.status}</span></td>
                <td>
                  <button class="btn btn-sm btn-outline" onclick="deleteService('${s.id}')">Delete</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

async function openServiceModal() {
  const name = prompt("Enter Service Name:");
  if (!name) return;
  const desc = prompt("Enter Short Description:");

  await fetch(`${API_BASE}/admin/services`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ name, description: desc, icon: "package", status: "active", ordering: 9 })
  });

  renderServicesTab();
}

async function deleteService(id) {
  if (confirm("Delete this service?")) {
    await fetch(`${API_BASE}/admin/services/${id}`, { method: 'DELETE', headers: authHeaders() });
    renderServicesTab();
  }
}

// 6. RFQs Tab
async function renderRFQsTab() {
  const container = document.getElementById('admin-tab-content');
  const res = await fetch(`${API_BASE}/admin/rfqs`, { headers: authHeaders() });
  const rfqs = await res.json();

  container.innerHTML = `
    <div class="admin-card-table">
      <div class="table-header-bar"><div class="table-title">Incoming RFQ & BOQ Requests (${rfqs.length})</div></div>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>RFQ ID</th>
              <th>Organization</th>
              <th>Contact Person</th>
              <th>Email / Phone</th>
              <th>Requirements</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${rfqs.map(r => `
              <tr>
                <td><code>${r.id}</code></td>
                <td><strong>${r.org_name}</strong></td>
                <td>${r.contact_person} (${r.designation})</td>
                <td>${r.email}<br><small>${r.phone}</small></td>
                <td>${r.required_products}</td>
                <td><span class="badge badge-warning">${r.status}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// 7. Quotation Generator Tab
// Powered by unified renderQuotationGeneratorTab() above

// 8. CRM Leads Tab
async function renderLeadsTab() {
  const container = document.getElementById('admin-tab-content');
  const res = await fetch(`${API_BASE}/admin/leads`, { headers: authHeaders() });
  const leads = await res.json();

  container.innerHTML = `
    <div class="admin-card-table">
      <div class="table-header-bar"><div class="table-title">CRM Lead Pipeline (${leads.length})</div></div>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Lead Name</th>
              <th>Company</th>
              <th>Phone / Email</th>
              <th>Requirement</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${leads.map(l => `
              <tr>
                <td>${new Date(l.created_at).toLocaleDateString()}</td>
                <td><strong>${l.name}</strong></td>
                <td>${l.company || 'N/A'}</td>
                <td>${l.phone}<br><small>${l.email}</small></td>
                <td>${l.subject}</td>
                <td><span class="badge badge-purple">${l.status}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// 9. Projects Tab & Proof Management
let projectProofFiles = [];
let editingProjectId = null;

async function renderProjectsTab() {
  const container = document.getElementById('admin-tab-content');
  if (!container) return;

  container.innerHTML = `
    <div style="display:flex; justify-content:center; padding:3rem;">
      <div style="color:#94A3B8;">Loading projects showcase...</div>
    </div>
  `;

  try {
    const res = await fetch(`${API_BASE}/projects`);
    const projects = await res.json();

    container.innerHTML = `
      <div class="admin-card-table">
        <div class="table-header-bar" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <div>
            <div class="table-title">Projects Showcase & Work Proof</div>
            <div style="font-size: 0.85rem; color: #94A3B8; margin-top: 0.2rem;">
              Manage completed and ongoing projects with verifiable PDF work orders, supply receipts, and site photos.
            </div>
          </div>
          <button class="btn btn-primary" onclick="openProjectModal()" style="display: flex; align-items: center; gap: 0.5rem;">
            <span>➕</span> Add Done Project
          </button>
        </div>

        <div style="padding: 1.5rem; display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem;">
          ${projects.length === 0 ? `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: #94A3B8;">
              <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">🏗️</div>
              <h4 style="color: #FFF; margin-bottom: 0.5rem;">No projects added yet</h4>
              <p style="font-size: 0.9rem; margin-bottom: 1.25rem;">Add your completed and verified projects along with proof of completion.</p>
              <button class="btn btn-primary" onclick="openProjectModal()">+ Add Your First Project</button>
            </div>
          ` : projects.map(p => {
            const proofFiles = p.proof_files || [];
            const pdfCount = proofFiles.filter(f => f.type === 'pdf' || (f.url && f.url.toLowerCase().endsWith('.pdf'))).length;
            const imgCount = proofFiles.length - pdfCount;
            const statusColor = (p.status || '').toLowerCase().includes('complete') ? '#10B981' : '#F59E0B';
            
            return `
              <div style="background: #090D16; border: 1px solid #334155; border-radius: 12px; padding: 1.4rem; display: flex; flex-direction: column; justify-content: space-between; position: relative;">
                <div>
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem; gap: 0.5rem;">
                    <span style="display: inline-block; padding: 0.2rem 0.6rem; border-radius: 6px; font-size: 0.75rem; font-weight: 700; background: ${statusColor}22; color: ${statusColor}; border: 1px solid ${statusColor}44;">
                      ${p.status || 'Completed'}
                    </span>
                    <span style="font-size: 0.75rem; color: #94A3B8;">${p.completion_date || 'Recent'}</span>
                  </div>

                  <h4 style="font-size: 1.15rem; color: #FFF; margin-bottom: 0.4rem; font-family: 'Outfit', sans-serif;">${p.title}</h4>
                  
                  <div style="font-size: 0.85rem; color: #F2821A; font-weight: 600; margin-bottom: 0.5rem;">
                    🏢 Client: ${p.client}
                  </div>
                  
                  ${p.location ? `<div style="font-size: 0.8rem; color: #94A3B8; margin-bottom: 0.5rem;">📍 Location: ${p.location}</div>` : ''}
                  ${p.project_value ? `<div style="font-size: 0.8rem; color: #38BDF8; font-weight: 600; margin-bottom: 0.5rem;">💰 Order Value: ${p.project_value}</div>` : ''}

                  <p style="font-size: 0.85rem; color: #CBD5E1; line-height: 1.5; margin-bottom: 1rem;">
                    ${p.description || 'No description provided.'}
                  </p>

                  <!-- Proof Badges -->
                  <div style="background: #1E293B; border: 1px solid #334155; border-radius: 8px; padding: 0.6rem 0.8rem; margin-bottom: 1rem;">
                    <div style="font-size: 0.75rem; font-weight: 700; color: #94A3B8; margin-bottom: 0.35rem; text-transform: uppercase; letter-spacing: 0.5px;">
                      Attached Proof (${proofFiles.length})
                    </div>
                    ${proofFiles.length > 0 ? `
                      <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
                        ${pdfCount > 0 ? `<span style="font-size: 0.75rem; background: #EF444422; color: #F87171; padding: 0.15rem 0.45rem; border-radius: 4px; border: 1px solid #EF444444;">📄 ${pdfCount} PDF${pdfCount > 1 ? 's' : ''}</span>` : ''}
                        ${imgCount > 0 ? `<span style="font-size: 0.75rem; background: #3B82F622; color: #60A5FA; padding: 0.15rem 0.45rem; border-radius: 4px; border: 1px solid #3B82F644;">🖼️ ${imgCount} Photo${imgCount > 1 ? 's' : ''}</span>` : ''}
                      </div>
                    ` : `
                      <span style="font-size: 0.75rem; color: #64748B;">No proof documents attached yet</span>
                    `}
                  </div>
                </div>

                <!-- Card Actions -->
                <div style="display: flex; gap: 0.5rem; border-top: 1px solid #1E293B; padding-top: 0.9rem; margin-top: auto;">
                  ${proofFiles.length > 0 ? `
                    <button type="button" class="btn btn-sm btn-outline" onclick="previewProjectProof('${p.id}')" style="flex: 1; border-color: #38BDF8; color: #38BDF8; font-size: 0.75rem; padding: 0.4rem 0.5rem;">
                      👁️ View Proof
                    </button>
                  ` : ''}
                  <button type="button" class="btn btn-sm btn-outline" onclick="openProjectModal('${p.id}')" style="flex: 1; font-size: 0.75rem; padding: 0.4rem 0.5rem;">
                    ✏️ Edit
                  </button>
                  <button type="button" class="btn btn-sm btn-outline" onclick="deleteProject('${p.id}')" style="border-color: #EF4444; color: #EF4444; font-size: 0.75rem; padding: 0.4rem 0.6rem;" title="Delete Project">
                    🗑️
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Add/Edit Project Modal -->
      <div id="project-modal" class="modal-overlay">
        <div class="modal-container" style="max-width: 680px;">
          <div class="modal-header">
            <h3 id="project-modal-title" style="margin: 0; color: #FFF; font-size: 1.25rem;">Add Done Project</h3>
            <button type="button" onclick="closeProjectModal()" style="background: none; border: none; color: #94A3B8; font-size: 1.5rem; cursor: pointer;">&times;</button>
          </div>
          <div class="modal-body">
            <form id="project-form" onsubmit="saveProjectForm(event)">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                <div style="grid-column: 1 / -1;">
                  <label class="form-label" style="color: #CBD5E1; font-size: 0.85rem; font-weight: 600;">Project Title *</label>
                  <input type="text" id="proj-title" class="form-control" placeholder="e.g. Municipal Sanitation Chemical Supply - Munger" required style="background: #090D16; color: #FFF; border-color: #334155;">
                </div>
                <div>
                  <label class="form-label" style="color: #CBD5E1; font-size: 0.85rem; font-weight: 600;">Client / Department *</label>
                  <input type="text" id="proj-client" class="form-control" placeholder="e.g. Munger Municipal Corporation" required style="background: #090D16; color: #FFF; border-color: #334155;">
                </div>
                <div>
                  <label class="form-label" style="color: #CBD5E1; font-size: 0.85rem; font-weight: 600;">Location</label>
                  <input type="text" id="proj-location" class="form-control" placeholder="e.g. Munger, Bihar" style="background: #090D16; color: #FFF; border-color: #334155;">
                </div>
                <div>
                  <label class="form-label" style="color: #CBD5E1; font-size: 0.85rem; font-weight: 600;">Completion Date / Period</label>
                  <input type="text" id="proj-date" class="form-control" placeholder="e.g. August 2026" style="background: #090D16; color: #FFF; border-color: #334155;">
                </div>
                <div>
                  <label class="form-label" style="color: #CBD5E1; font-size: 0.85rem; font-weight: 600;">Status</label>
                  <select id="proj-status" class="form-control" style="background: #090D16; color: #FFF; border-color: #334155;">
                    <option value="Completed">Completed & Verified</option>
                    <option value="Delivered">Successfully Delivered</option>
                    <option value="Ongoing">Ongoing / In Progress</option>
                  </select>
                </div>
                <div style="grid-column: 1 / -1;">
                  <label class="form-label" style="color: #CBD5E1; font-size: 0.85rem; font-weight: 600;">Project / Order Value (Optional)</label>
                  <input type="text" id="proj-value" class="form-control" placeholder="e.g. ₹4,85,000" style="background: #090D16; color: #FFF; border-color: #334155;">
                </div>
                <div style="grid-column: 1 / -1;">
                  <label class="form-label" style="color: #CBD5E1; font-size: 0.85rem; font-weight: 600;">Project Scope & Description *</label>
                  <textarea id="proj-desc" class="form-control" rows="3" placeholder="Describe the materials supplied, execution details, quality standards, or institutional scope..." required style="background: #090D16; color: #FFF; border-color: #334155;"></textarea>
                </div>
              </div>

              <!-- Proof Files Upload Box -->
              <div style="border: 2px dashed #334155; border-radius: 10px; padding: 1.25rem; background: #090D16; margin-bottom: 1.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                  <div>
                    <strong style="color: #FFF; font-size: 0.95rem;">📎 Proof Documents & Images</strong>
                    <div style="font-size: 0.8rem; color: #94A3B8;">Upload PDFs (Work Orders, Delivery Proofs) and Images (Site/Delivery Photos)</div>
                  </div>
                  <label class="btn btn-sm btn-primary" style="margin: 0; cursor: pointer; display: inline-flex; align-items: center; gap: 0.4rem;">
                    <span>📁</span> Choose Files
                    <input type="file" id="proj-file-input" multiple accept=".pdf,image/*" style="display: none;" onchange="handleProofFilesSelected(this)">
                  </label>
                </div>

                <div id="upload-status" style="display:none; font-size:0.85rem; color:#F2821A; margin-bottom:0.75rem;">
                  ⏳ Uploading proof files to server, please wait...
                </div>

                <!-- Uploaded Proof List -->
                <div id="proof-files-list" style="display: flex; flex-direction: column; gap: 0.6rem;">
                  <!-- Rendered dynamically -->
                </div>
              </div>

              <div class="modal-footer" style="padding: 1rem 0 0 0; margin-top: 1rem;">
                <button type="button" class="btn btn-outline" onclick="closeProjectModal()">Cancel</button>
                <button type="submit" id="proj-save-btn" class="btn btn-primary">💾 Save Project</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Proof Preview Modal -->
      <div id="proof-preview-modal" class="modal-overlay">
        <div class="modal-container" style="max-width: 720px;">
          <div class="modal-header">
            <h3 id="preview-modal-title" style="margin: 0; color: #FFF; font-size: 1.2rem;">Project Proof & Verification</h3>
            <button type="button" onclick="closeProofPreviewModal()" style="background: none; border: none; color: #94A3B8; font-size: 1.5rem; cursor: pointer;">&times;</button>
          </div>
          <div class="modal-body" id="preview-modal-body">
            <!-- Rendered dynamically -->
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div style="color: #EF4444; padding: 2rem;">Failed to load projects: ${err.message}</div>`;
  }
}

function openProjectModal(id = null) {
  editingProjectId = id;
  projectProofFiles = [];
  const modal = document.getElementById('project-modal');
  const title = document.getElementById('project-modal-title');
  const form = document.getElementById('project-form');
  
  if (!modal) return;
  
  if (id) {
    title.textContent = 'Edit Done Project';
    fetch(`${API_BASE}/projects`).then(res => res.json()).then(projects => {
      const p = projects.find(x => x.id === id);
      if (p) {
        document.getElementById('proj-title').value = p.title || '';
        document.getElementById('proj-client').value = p.client || '';
        document.getElementById('proj-location').value = p.location || '';
        document.getElementById('proj-date').value = p.completion_date || '';
        document.getElementById('proj-status').value = p.status || 'Completed';
        document.getElementById('proj-value').value = p.project_value || '';
        document.getElementById('proj-desc').value = p.description || '';
        projectProofFiles = p.proof_files ? [...p.proof_files] : [];
        renderProofFilesList();
      }
    });
  } else {
    title.textContent = 'Add Done Project';
    if (form) form.reset();
    renderProofFilesList();
  }

  modal.classList.add('active');
}

function closeProjectModal() {
  const modal = document.getElementById('project-modal');
  if (modal) modal.classList.remove('active');
  editingProjectId = null;
  projectProofFiles = [];
}

function renderProofFilesList() {
  const container = document.getElementById('proof-files-list');
  if (!container) return;

  if (projectProofFiles.length === 0) {
    container.innerHTML = `
      <div style="font-size: 0.85rem; color: #64748B; text-align: center; padding: 0.75rem;">
        No proof files attached yet. Select PDFs (Challans, Work Orders) or site images.
      </div>
    `;
    return;
  }

  container.innerHTML = projectProofFiles.map((file, idx) => {
    const isPdf = file.type === 'pdf' || (file.url && file.url.toLowerCase().endsWith('.pdf'));
    return `
      <div style="display: flex; align-items: center; justify-content: space-between; background: #1E293B; border: 1px solid #334155; border-radius: 8px; padding: 0.6rem 0.8rem; gap: 0.75rem;">
        <div style="display: flex; align-items: center; gap: 0.6rem; overflow: hidden; flex: 1;">
          <span style="font-size: 1.25rem;">${isPdf ? '📄' : '🖼️'}</span>
          <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;">
            <input type="text" value="${escapeHtml(file.title || file.name || 'Proof Document')}" onchange="updateProofTitle(${idx}, this.value)" placeholder="Document Label" style="background: transparent; border: none; border-bottom: 1px dashed #64748B; color: #FFF; font-size: 0.85rem; width: 100%; outline: none;">
            <div style="font-size: 0.75rem; color: #94A3B8;">${file.name || 'Attached file'}</div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <a href="${file.url}" target="_blank" class="btn btn-sm btn-outline" style="padding: 0.2rem 0.5rem; font-size: 0.75rem;">View</a>
          <button type="button" onclick="removeProofFile(${idx})" style="background: none; border: none; color: #EF4444; cursor: pointer; font-size: 1.1rem; padding: 0.2rem;" title="Remove file">&times;</button>
        </div>
      </div>
    `;
  }).join('');
}

function updateProofTitle(idx, title) {
  if (projectProofFiles[idx]) {
    projectProofFiles[idx].title = title;
  }
}

function removeProofFile(idx) {
  projectProofFiles.splice(idx, 1);
  renderProofFilesList();
}

async function handleProofFilesSelected(input) {
  const files = input.files;
  if (!files || files.length === 0) return;

  const statusEl = document.getElementById('upload-status');
  if (statusEl) statusEl.style.display = 'block';

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      const base64Data = await readFileAsBase64(file);
      const res = await fetch(`${API_BASE}/admin/upload`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          filename: file.name,
          data: base64Data
        })
      });
      const data = await res.json();
      if (data.success) {
        projectProofFiles.push({
          name: file.name,
          title: file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " "),
          url: data.url,
          type: data.type,
          size: data.size
        });
      } else {
        alert(`Failed to upload ${file.name}: ${data.error || 'Server error'}`);
      }
    } catch (err) {
      alert(`Error reading ${file.name}: ${err.message}`);
    }
  }

  if (statusEl) statusEl.style.display = 'none';
  input.value = '';
  renderProofFilesList();
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}

async function saveProjectForm(e) {
  e.preventDefault();
  const saveBtn = document.getElementById('proj-save-btn');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
  }

  const payload = {
    title: document.getElementById('proj-title').value.trim(),
    client: document.getElementById('proj-client').value.trim(),
    location: document.getElementById('proj-location').value.trim(),
    completion_date: document.getElementById('proj-date').value.trim(),
    status: document.getElementById('proj-status').value,
    project_value: document.getElementById('proj-value').value.trim(),
    description: document.getElementById('proj-desc').value.trim(),
    proof_files: projectProofFiles
  };

  try {
    let res;
    if (editingProjectId) {
      res = await fetch(`${API_BASE}/admin/projects/${editingProjectId}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });
    } else {
      res = await fetch(`${API_BASE}/admin/projects`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });
    }

    if (res.ok) {
      alert(editingProjectId ? 'Project updated successfully!' : 'Done project added successfully!');
      closeProjectModal();
      renderProjectsTab();
    } else {
      const err = await res.json();
      alert('Error saving project: ' + (err.error || 'Unknown error'));
    }
  } catch (err) {
    alert('Network error saving project: ' + err.message);
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = '💾 Save Project';
    }
  }
}

async function deleteProject(id) {
  if (!confirm('Are you sure you want to delete this project and its proof records?')) return;
  try {
    const res = await fetch(`${API_BASE}/admin/projects/${id}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    if (res.ok) {
      renderProjectsTab();
    } else {
      alert('Failed to delete project');
    }
  } catch (err) {
    alert('Network error: ' + err.message);
  }
}

async function previewProjectProof(id) {
  const res = await fetch(`${API_BASE}/projects`);
  const projects = await res.json();
  const p = projects.find(x => x.id === id);
  if (!p) return;

  const modal = document.getElementById('proof-preview-modal');
  const title = document.getElementById('preview-modal-title');
  const body = document.getElementById('preview-modal-body');
  if (!modal || !body) return;

  title.textContent = `Proof & Documents: ${p.title}`;
  const files = p.proof_files || [];

  if (files.length === 0) {
    body.innerHTML = `<div style="text-align: center; color: #94A3B8; padding: 2rem;">No proof documents attached to this project.</div>`;
  } else {
    body.innerHTML = `
      <div style="margin-bottom: 1.25rem; color: #94A3B8; font-size: 0.9rem; background: #090D16; padding: 0.75rem 1rem; border-radius: 8px; border: 1px solid #334155;">
        🏢 Client: <strong style="color: #FFF;">${p.client}</strong> | 📍 Location: <strong style="color: #FFF;">${p.location || 'Bihar'}</strong> | 📅 Status: <strong style="color: #10B981;">${p.status} (${p.completion_date || 'Done'})</strong>
      </div>
      <div style="display: flex; flex-direction: column; gap: 0.85rem;">
        ${files.map(f => {
          const isPdf = f.type === 'pdf' || (f.url && f.url.toLowerCase().endsWith('.pdf'));
          return `
            <div style="background: #090D16; border: 1px solid #334155; border-radius: 8px; padding: 1rem; display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap;">
              <div style="display: flex; align-items: center; gap: 0.75rem; flex: 1; min-width: 200px;">
                <span style="font-size: 1.75rem;">${isPdf ? '📄' : '🖼️'}</span>
                <div>
                  <div style="color: #FFF; font-weight: 600; font-size: 0.95rem;">${f.title || f.name}</div>
                  <div style="color: #94A3B8; font-size: 0.8rem;">${isPdf ? 'PDF Document / Verification Certificate' : 'Execution Photo / Delivery Proof'}</div>
                </div>
              </div>
              <div style="display: flex; gap: 0.5rem;">
                <a href="${f.url}" target="_blank" class="btn btn-sm btn-primary" style="text-decoration: none;">
                  ${isPdf ? '👁️ Open PDF' : '🔍 View Full Image'}
                </a>
                <a href="${f.url}" download class="btn btn-sm btn-outline" style="text-decoration: none;">
                  📥 Download
                </a>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  modal.classList.add('active');
}

function closeProofPreviewModal() {
  const modal = document.getElementById('proof-preview-modal');
  if (modal) modal.classList.remove('active');
}

// 10. Settings Tab
async function renderSettingsTab() {
  const container = document.getElementById('admin-tab-content');
  const res = await fetch(`${API_BASE}/settings`);
  const settings = await res.json();

  container.innerHTML = `
    <div class="admin-card-table" style="padding: 2rem;">
      <h3 style="margin-bottom: 1.5rem;">Dynamic Website Settings</h3>
      <form id="settings-form">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
          <div>
            <label class="form-label" style="color:#FFF;">Company Name</label>
            <input type="text" id="set-site-name" class="form-control" value="${settings.site_name}" style="background:#090D16; color:#FFF;">
          </div>
          <div>
            <label class="form-label" style="color:#FFF;">Tagline</label>
            <input type="text" id="set-tagline" class="form-control" value="${settings.tagline}" style="background:#090D16; color:#FFF;">
          </div>
          <div>
            <label class="form-label" style="color:#FFF;">Proprietor</label>
            <input type="text" id="set-proprietor" class="form-control" value="${settings.proprietor}" style="background:#090D16; color:#FFF;">
          </div>
          <div>
            <label class="form-label" style="color:#FFF;">Phone</label>
            <input type="text" id="set-phone" class="form-control" value="${settings.phone}" style="background:#090D16; color:#FFF;">
          </div>
          <div>
            <label class="form-label" style="color:#FFF;">Email</label>
            <input type="text" id="set-email" class="form-control" value="${settings.email}" style="background:#090D16; color:#FFF;">
          </div>
          <div>
            <label class="form-label" style="color:#FFF;">GSTIN</label>
            <input type="text" id="set-gstin" class="form-control" value="${settings.gstin || ''}" style="background:#090D16; color:#FFF;">
          </div>
        </div>
        <div style="margin-top: 1.5rem;">
          <label class="form-label" style="color:#FFF;">Address</label>
          <input type="text" id="set-address" class="form-control" value="${settings.address}" style="background:#090D16; color:#FFF;">
        </div>
        <button type="submit" class="btn btn-primary" style="margin-top: 2rem;">Save Settings</button>
      </form>
    </div>
  `;

  document.getElementById('settings-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const updated = {
      site_name: document.getElementById('set-site-name').value,
      tagline: document.getElementById('set-tagline').value,
      proprietor: document.getElementById('set-proprietor').value,
      phone: document.getElementById('set-phone').value,
      email: document.getElementById('set-email').value,
      gstin: document.getElementById('set-gstin').value,
      address: document.getElementById('set-address').value
    };

    const sRes = await fetch(`${API_BASE}/admin/settings`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(updated)
    });

    if (sRes.ok) alert("Settings saved successfully!");
  });
}

function adminLogout() {
  localStorage.removeItem('gv_admin_token');
  location.reload();
}

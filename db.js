/**
 * db.js - Persistent JSON Database Engine for Ganita Ventures
 * High-performance, zero-dependency thread-safe file store with auto-seeding
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial Database Schema and Seed Data
const initialSchema = {
  settings: {
    site_name: "Ganita Ventures",
    tagline: "Trading • Supplies • Projects • Services",
    slogan: "Reliable Supplies. Smarter Business.",
    description: "Ganita Ventures connects individuals, institutions and businesses with reliable products, procurement and supply solutions.",
    proprietor: "Sushil Kumar",
    phone: "+91 8709605306",
    email: "ganitaventures87@gmail.com",
    address: "Puraniganj, Munger, Bihar - 811201",
    gstin: "10AAAAA0000A1Z5",
    whatsapp_number: "918709605306",
    currency_symbol: "₹",
    cod_enabled: true,
    payment_gateway_enabled: false,
    privacy_policy: "At Ganita Ventures, we prioritize the privacy and security of our clients, institutional buyers, and individual customers...",
    terms_conditions: "By accessing Ganita Ventures website or placing procurement orders, you agree to our terms of service..."
  },
  stats: [
    { id: "stat_1", label: "Product Categories", count: "25+", icon: "grid" },
    { id: "stat_2", label: "Institutional Clients", count: "120+", icon: "building" },
    { id: "stat_3", label: "Orders Fulfilled", count: "2,500+", icon: "check-circle" },
    { id: "stat_4", label: "Cities Served", count: "35+", icon: "map-pin" }
  ],
  admins: [
    {
      id: "admin_1",
      username: "admin",
      email: "ganitaventures87@gmail.com",
      salt: "c84f8841a156e520",
      password_hash: crypto.pbkdf2Sync("admin123", "c84f8841a156e520", 1000, 64, "sha512").toString("hex"),
      role: "super_admin",
      name: "Sushil Kumar",
      created_at: new Date().toISOString()
    }
  ],
  services: [
    {
      id: "srv_1",
      name: "General Trading",
      slug: "general-trading",
      icon: "package",
      description: "Wholesale and retail trading of high-grade chemicals, lime powder, bleaching powder, and commercial supplies across Bihar.",
      status: "active",
      ordering: 1
    },
    {
      id: "srv_2",
      name: "Institutional Supplies",
      slug: "institutional-supplies",
      icon: "briefcase",
      description: "Bulk supply chain management for schools, offices, hospitals, and municipal bodies with guaranteed delivery timelines.",
      status: "active",
      ordering: 2
    },
    {
      id: "srv_3",
      name: "Industrial & Chemical Sourcing",
      slug: "industrial-chemical-sourcing",
      icon: "file-text",
      description: "Direct manufacturer sourcing of high-grade lime powder, bleaching disinfectant, and chemical raw materials.",
      status: "active",
      ordering: 3
    }
  ],
  products: [
    {
      id: "prod_lime",
      sku: "GV-CHM-101",
      name: "High Grade Hydrated Lime Powder (Calcium Hydroxide)",
      category: "Chemicals & Minerals",
      short_description: "Premium quality industrial hydrated lime powder for water treatment, civil projects, and chemical processing.",
      description: "Superior quality white hydrated lime powder (purity 90%+). Ideal for municipal water treatment, soil stabilization, chemical manufacturing, and sanitation. Packed in moisture-proof 50 kg HDPE bags.",
      price: 450,
      discount_price: 390,
      unit: "50 kg Bag",
      min_order_qty: 10,
      stock_qty: 2500,
      stock_status: "in_stock",
      gst_percent: 18,
      brand: "Ganita Chemical Spec",
      mode: "buy_now",
      featured: true,
      status: "active",
      image: "lime-powder.svg"
    },
    {
      id: "prod_bleaching",
      sku: "GV-SAN-202",
      name: "Stable Bleaching Powder (Chlorine Disinfectant Grade)",
      category: "Disinfectants & Sanitation",
      short_description: "High-concentration chlorine bleaching powder for municipal sanitation, water purification, and hygiene.",
      description: "High-grade stable bleaching powder containing 33%+ available chlorine. Formulated for heavy-duty municipal sanitation, drain disinfection, water purification, and hospital sanitization. Packed in airtight lined 25 kg / 50 kg drums or bags.",
      price: 850,
      discount_price: 780,
      unit: "Bag / Drum",
      min_order_qty: 5,
      stock_qty: 1500,
      stock_status: "in_stock",
      gst_percent: 18,
      brand: "Ganita Hygiene Grade",
      mode: "buy_now",
      featured: true,
      status: "active",
      image: "bleaching-powder.svg"
    },
    {
      id: "prod_stationery",
      sku: "GV-OFF-303",
      name: "Complete Institutional & Office Stationery Kit Bundle",
      category: "Office & Institutional Stationery",
      short_description: "All-in-one comprehensive stationery pack containing A4 copier paper, registers, files, pens, and desk accessories.",
      description: "Customizable high-volume office stationery bundle designed for government departments, schools, colleges, and corporate offices. Includes A4 75 GSM paper reams, hardbound registers, ring files, executive pens, staplers, and desk organizers.",
      price: 2450,
      discount_price: 2150,
      unit: "Kit Bundle",
      min_order_qty: 2,
      stock_qty: 350,
      stock_status: "in_stock",
      gst_percent: 12,
      brand: "Ganita Stationery Select",
      mode: "request_quote",
      featured: true,
      status: "active",
      image: "stationery-kit.svg"
    }
  ],
  letters: [
    {
      id: "LTR-GV-2026-9042",
      ref_no: "GV/PROC/2026-27/QT-9042",
      date: "08/10/2026",
      recipient_designation: "The Executive Officer / Competent Authority",
      recipient_org: "Office of the Nagar Panchayat / Municipal Council",
      recipient_location: "Dhamdaha, Bihar.",
      recipient_email: "nagarpanchayatdhamdhaha@gmail.com",
      recipient_phone: "+91 9835012345",
      subject: "Submission of Formal Quotation for Supply of Hydrated Lime Powder & Bleaching Powder – reg.",
      salutation: "Respected Sir/Madam,",
      body_text: "With reference to the ongoing sanitation and public health maintenance requirements under your esteemed office, we are pleased to submit our formal rate quotation for the supply of high-grade Hydrated Lime Powder and Bleaching Powder.\n\nGanita Ventures is committed to providing standard-compliant materials with timely execution. The itemized commercial proposal is detailed below for your kind consideration:",
      items: [
        {
          sl: 1,
          description: "Supply of Hydrated Lime Powder (50 kg Bag) & Bleaching Powder",
          qty: "32 Bags",
          unit_rate: 1250,
          gst_rate: 18,
          taxable_amount: 40000
        }
      ],
      taxable_subtotal: 40000,
      gst_rate: 18,
      gst_amount: 7200,
      transport_charges: 1000,
      gross_total: 48200,
      amount_words: "Rupees Forty-Eight Thousand Two Hundred only",
      validity_term: "This quotation remains valid for acceptance until 30th November 2026.",
      payment_term: "30% mobilization advance upon issuance of the formal Purchase / Work Order; balance payment against delivery and physical verification of stock.",
      delivery_term: "Direct consignee store delivery within municipal premises / transit store point as designated by the department.",
      quality_term: "All bags will be supplied sealed in moisture-proof packaging in compliance with public sanitation grade standards.",
      concluding_text: "We kindly request you to review our rates and favor us with the supply order. We assure you of our prompt service and highest standards of quality.",
      closing: "Thanking you.\n\nYours faithfully,",
      signatory: "Sushil Kumar",
      signatory_title: "Proprietor",
      signatory_dept: "Procurement Division",
      created_at: new Date().toISOString()
    }
  ],
  orders: [],
  rfqs: [],
  quotes: [],
  invoices: [],
  leads: [],
  tenders: [],
  projects: [],
  faqs: [
    { id: "faq_1", question: "What products does Ganita Ventures supply?", answer: "We supply industrial materials, cleaning supplies, stationery, and other products based on customer requirements.", category: "Products" },
    { id: "faq_2", question: "Do you accept bulk and institutional orders?", answer: "Yes, we accept bulk orders from businesses, institutions, and government departments.", category: "Orders & Procurement" },
    { id: "faq_3", question: "Can I request a quotation before placing an order?", answer: "Yes, share your requirements and quantities to receive a customised quotation.", category: "Quotations" },
    { id: "faq_4", question: "Do you supply to government departments?", answer: "Yes, we cater to government and institutional supply requirements, subject to applicable tender terms.", category: "Institutional & Govt" },
    { id: "faq_5", question: "Can I order products not listed on your website?", answer: "Yes, contact us with your specific requirements, and we'll check availability.", category: "Custom Sourcing" },
    { id: "faq_6", question: "Do you accept individual orders?", answer: "Yes, individuals and businesses can enquire about products and place orders.", category: "Customer Orders" },
    { id: "faq_7", question: "Which locations do you serve?", answer: "We are based in Munger, Bihar. Delivery availability depends on the product, quantity, and destination.", category: "Delivery & Logistics" },
    { id: "faq_8", question: "How can I place an order?", answer: "Browse our products, submit an enquiry, or contact our team directly.", category: "How to Order" },
    { id: "faq_9", question: "What payment methods do you accept?", answer: "Payment terms and available methods are confirmed during order processing.", category: "Payments & Invoicing" },
    { id: "faq_10", question: "How can I contact Ganita Ventures?", answer: "Reach us by phone or email through our website's contact section.", category: "Contact & Support" }
  ],
  audit_logs: [
    { id: "log_1", action: "System Initialized with Letter Generator support", user: "System", timestamp: new Date().toISOString() }
  ]
};

class DBEngine {
  constructor() {
    this.init();
  }

  init() {
    if (!fs.existsSync(DB_FILE)) {
      this.data = JSON.parse(JSON.stringify(initialSchema));
      this.save();
    } else {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        this.data = JSON.parse(raw);
        for (const key of Object.keys(initialSchema)) {
          if (!this.data[key]) {
            this.data[key] = initialSchema[key];
          }
        }
      } catch (err) {
        this.data = JSON.parse(JSON.stringify(initialSchema));
        this.save();
      }
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error("DB Save Error:", err);
    }
  }

  get(table) {
    return this.data[table] || [];
  }

  getOne(table, queryFn) {
    const list = this.get(table);
    return list.find(queryFn) || null;
  }

  filter(table, queryFn) {
    const list = this.get(table);
    return list.filter(queryFn);
  }

  insert(table, item) {
    if (!this.data[table]) {
      this.data[table] = [];
    }
    if (!item.id) {
      item.id = `${table.substring(0, 4)}_${Date.now()}`;
    }
    if (!item.created_at) {
      item.created_at = new Date().toISOString();
    }
    this.data[table].unshift(item);
    this.logAction(`Inserted into ${table}`, item.id);
    this.save();
    return item;
  }

  update(table, id, patch) {
    const list = this.get(table);
    const index = list.findIndex(x => x.id === id);
    if (index !== -1) {
      this.data[table][index] = { ...this.data[table][index], ...patch, updated_at: new Date().toISOString() };
      this.logAction(`Updated ${table}`, id);
      this.save();
      return this.data[table][index];
    }
    return null;
  }

  delete(table, id) {
    const list = this.get(table);
    const index = list.findIndex(x => x.id === id);
    if (index !== -1) {
      const removed = this.data[table].splice(index, 1)[0];
      this.logAction(`Deleted from ${table}`, id);
      this.save();
      return removed;
    }
    return null;
  }

  getSettings() {
    return this.data.settings || initialSchema.settings;
  }

  updateSettings(newSettings) {
    this.data.settings = { ...this.data.settings, ...newSettings };
    this.save();
    return this.data.settings;
  }

  logAction(action, target) {
    if (!this.data.audit_logs) this.data.audit_logs = [];
    this.data.audit_logs.unshift({
      id: `log_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      action,
      target,
      timestamp: new Date().toISOString()
    });
    if (this.data.audit_logs.length > 200) {
      this.data.audit_logs = this.data.audit_logs.slice(0, 200);
    }
  }
}

module.exports = new DBEngine();

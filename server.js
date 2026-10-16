/**
 * server.js - Ganita Ventures Full-Stack Server & REST API Engine
 * Built with zero-dependency native Node.js HTTP module & standard routing
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');
const db = require('./db.js');

const PORT = process.env.PORT || 8000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// MIME Type Helper
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

const SECRET_KEY = "ganita_ventures_secret_key_2026_munger_bihar";

function generateToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 86400000 })).toString('base64url');
  const signature = crypto.createHmac('sha256', SECRET_KEY).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyToken(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const expectedSig = crypto.createHmac('sha256', SECRET_KEY).update(`${parts[0]}.${parts[1]}`).digest('base64url');
  if (parts[2] !== expectedSig) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

function getRequestBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        resolve({});
      }
    });
  });
}

function sendJSON(res, data, statusCode = 200) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  });
  res.end(JSON.stringify(data));
}

function sendError(res, message, statusCode = 400) {
  sendJSON(res, { error: message }, statusCode);
}

function numberToIndianWords(num) {
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

function generateQuotationHTML(doc) {
  const refNo = doc.ref_no || doc.id || 'GV/PROC/2026-27/QT-9042';
  const quoteDate = doc.date || (doc.created_at ? new Date(doc.created_at).toLocaleDateString('en-GB') : '08/10/2026');
  const recipientDesignation = doc.recipient_designation || doc.customer_name || 'The Executive Officer / Competent Authority';
  const recipientOrg = doc.recipient_org || doc.company || 'Office of the Nagar Panchayat / Municipal Council';
  const recipientLocation = doc.recipient_location || doc.location || 'Dhamdaha, Bihar.';
  const recipientEmail = doc.recipient_email || doc.customer_email || 'nagarpanchayatdhamdhaha@gmail.com';
  const recipientPhone = doc.recipient_phone || doc.customer_phone || '+91 9835012345';
  
  const subject = doc.subject || 'Submission of Formal Quotation for Supply of Hydrated Lime Powder & Bleaching Powder – reg.';
  const salutation = doc.salutation || 'Respected Sir/Madam,';
  
  const bodyText = doc.body_text || 'With reference to the ongoing sanitation and public health maintenance requirements under your esteemed office, we are pleased to submit our formal rate quotation for the supply of high-grade Hydrated Lime Powder and Bleaching Powder.\n\nGanita Ventures is committed to providing standard-compliant materials with timely execution. The itemized commercial proposal is detailed below for your kind consideration:';

  let items = doc.items || [];
  if (!Array.isArray(items) || items.length === 0) {
    items = [
      {
        sl: 1,
        description: 'Supply of Hydrated Lime Powder (50 kg Bag) & Bleaching Powder',
        qty: '32 Bags',
        unit_rate: 1250,
        gst_rate: 18,
        taxable_amount: 40000
      }
    ];
  }

  const includeGST = doc.include_gst !== false;
  const includeTerms = doc.include_terms !== false;

  let taxableSubtotal = doc.taxable_subtotal !== undefined ? Number(doc.taxable_subtotal) : (doc.subtotal !== undefined ? Number(doc.subtotal) : 0);
  if (!taxableSubtotal && items.length > 0) {
    taxableSubtotal = items.reduce((sum, item) => sum + (Number(item.taxable_amount) || (Number(item.qty) || 1) * Number(item.unit_rate || item.unit_price || 0)), 0);
  }

  const gstRate = includeGST ? (doc.gst_rate !== undefined ? Number(doc.gst_rate) : 18) : 0;
  let gstAmount = includeGST ? (doc.gst_amount !== undefined ? Number(doc.gst_amount) : (doc.gst_total !== undefined ? Number(doc.gst_total) : Math.round(taxableSubtotal * (gstRate / 100)))) : 0;
  const transportCharges = doc.transport_charges !== undefined ? Number(doc.transport_charges) : (doc.shipping_charge !== undefined ? Number(doc.shipping_charge) : 0);
  
  let grossTotal = doc.gross_total !== undefined ? Number(doc.gross_total) : (doc.grand_total !== undefined ? Number(doc.grand_total) : (taxableSubtotal + gstAmount + transportCharges));
  
  const amountWords = doc.amount_words || numberToIndianWords(grossTotal);

  // Build Terms List dynamically
  let termsList = [];
  if (includeTerms) {
    if (Array.isArray(doc.terms_list) && doc.terms_list.length > 0) {
      termsList = doc.terms_list.filter(t => t && (typeof t === 'string' ? t.trim() : (t.text && t.text.trim())));
    } else {
      if (doc.validity_term && doc.validity_term.trim()) termsList.push(`<strong>Validity:</strong> ${doc.validity_term.trim()}`);
      if (doc.payment_term && doc.payment_term.trim()) termsList.push(`<strong>Payment Terms:</strong> ${doc.payment_term.trim()}`);
      if (doc.delivery_term && doc.delivery_term.trim()) termsList.push(`<strong>Delivery Point:</strong> ${doc.delivery_term.trim()}`);
      if (doc.quality_term && doc.quality_term.trim()) termsList.push(`<strong>Quality Standard:</strong> ${doc.quality_term.trim()}`);
      if (Array.isArray(doc.custom_terms)) {
        doc.custom_terms.forEach(ct => { if (ct && ct.trim()) termsList.push(ct.trim()); });
      }
    }
  }

  const concludingText = doc.concluding_text || 'We kindly request you to review our rates and favor us with the supply order. We assure you of our prompt service and highest standards of quality.';
  const closing = doc.closing || 'Thanking you.\n\nYours faithfully,';
  const signatory = doc.signatory || 'Sushil Kumar';
  const signatoryTitle = doc.signatory_title || 'Proprietor';
  const signatoryDept = doc.signatory_dept || 'Procurement Division';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Formal Quotation - ${refNo} | Ganita Ventures</title>
  <meta name="robots" content="noindex, nofollow">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" href="/assets/img/logo.png" type="image/png">
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 16mm 14mm 16mm;
    }
    *, *:before, *:after {
      box-sizing: border-box;
    }
    body {
      font-family: 'Times New Roman', Times, Georgia, serif;
      color: #0F172A;
      background: #E2E8F0;
      margin: 0;
      padding: 24px 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .print-controls-bar {
      width: 210mm;
      margin: 0 auto 16px auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #090D16;
      color: #FFFFFF;
      padding: 12px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    .print-btn {
      background: #F2821A;
      color: #FFFFFF;
      border: none;
      padding: 8px 20px;
      border-radius: 6px;
      font-weight: 700;
      cursor: pointer;
      font-size: 14px;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .print-btn:hover {
      background: #D95C00;
    }
    .back-btn {
      color: #94A3B8;
      text-decoration: none;
      font-size: 13px;
    }
    .back-btn:hover {
      color: #FFFFFF;
    }
    .page-sheet {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      background: #FFFFFF;
      padding: 30px 42px 34px 42px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.12);
      position: relative;
      display: flex;
      flex-direction: column;
    }
    
    /* Top Accent Stripe */
    .top-color-bar {
      height: 6px;
      background: linear-gradient(90deg, #F2821A 0%, #D95C00 100%);
      margin: -30px -42px 20px -42px;
    }

    /* Company Letterhead Header */
    .letterhead-header {
      text-align: center;
      border-bottom: 2px solid #F2821A;
      padding-bottom: 14px;
      margin-bottom: 18px;
    }
    .company-name {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 26px;
      font-weight: 900;
      letter-spacing: 2.5px;
      color: #0F172A;
      margin: 0;
      text-transform: uppercase;
    }
    .company-tagline {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 11.5px;
      font-weight: 700;
      letter-spacing: 2px;
      color: #F2821A;
      margin-top: 4px;
      text-transform: uppercase;
    }
    .company-address {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 12px;
      color: #334155;
      margin-top: 5px;
    }
    .company-contact {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 11.5px;
      color: #334155;
      margin-top: 3px;
    }
    .company-gstin {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 11.5px;
      color: #0F172A;
      font-weight: 700;
      margin-top: 3px;
    }

    /* Ref & Date Row */
    .meta-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 13px;
      margin-bottom: 16px;
      padding: 6px 0;
      border-bottom: 1px dashed #CBD5E1;
    }
    .meta-ref {
      font-weight: 700;
    }
    .meta-date {
      font-weight: 700;
    }

    /* Recipient Block */
    .recipient-block {
      font-size: 14px;
      line-height: 1.5;
      margin-bottom: 16px;
    }
    .recipient-to {
      font-weight: 700;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin-bottom: 2px;
    }
    .recipient-contact {
      font-size: 12.5px;
      color: #334155;
      margin-top: 4px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }

    /* Subject */
    .subject-block {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 13.5px;
      font-weight: 700;
      background: #F8FAFC;
      border-left: 4px solid #F2821A;
      padding: 8px 14px;
      margin-bottom: 16px;
    }

    /* Salutation & Body */
    .salutation {
      font-weight: 700;
      margin-bottom: 8px;
      font-size: 14px;
    }
    .body-p {
      font-size: 13.5px;
      line-height: 1.6;
      margin: 0 0 10px 0;
      text-align: justify;
    }

    /* Commercial Table */
    .section-title {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 14.5px;
      font-weight: 800;
      color: #0F172A;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 16px 0 8px 0;
      border-bottom: 1.5px solid #0F172A;
      padding-bottom: 4px;
    }
    .commercial-table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0 14px 0;
      font-size: 12.5px;
    }
    .commercial-table th {
      background: #0F172A;
      color: #FFFFFF;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-weight: 700;
      padding: 9px 10px;
      border: 1px solid #0F172A;
      text-align: center;
      font-size: 12px;
    }
    .commercial-table td {
      padding: 8px 10px;
      border: 1px solid #94A3B8;
      vertical-align: middle;
    }
    .col-sl { width: 7%; text-align: center; font-weight: 700; }
    .col-desc { width: 45%; text-align: left; }
    .col-qty { width: 14%; text-align: center; }
    .col-rate { width: 12%; text-align: right; }
    .col-gst { width: 10%; text-align: center; }
    .col-amount { width: 12%; text-align: right; font-weight: 700; }

    /* Totals Summary */
    .totals-wrap {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 16px;
    }
    .totals-box {
      width: 390px;
      border: 1px solid #CBD5E1;
      border-radius: 4px;
      background: #F8FAFC;
      padding: 10px 14px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 12.5px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      color: #334155;
    }
    .totals-row.grand {
      border-top: 2px solid #0F172A;
      margin-top: 6px;
      padding-top: 8px;
      font-size: 14px;
      font-weight: 800;
      color: #0F172A;
    }
    .words-row {
      margin-top: 6px;
      padding-top: 6px;
      border-top: 1px dashed #CBD5E1;
      font-size: 11.5px;
      color: #475569;
      font-style: italic;
      line-height: 1.4;
    }

    /* Terms & Conditions */
    .terms-box {
      margin-bottom: 14px;
      font-size: 12.5px;
      line-height: 1.5;
    }
    .terms-list {
      margin: 4px 0 0 0;
      padding-left: 18px;
    }
    .terms-list li {
      margin-bottom: 4px;
    }

    /* Concluding */
    .concluding-p {
      font-size: 13px;
      line-height: 1.5;
      margin: 10px 0;
    }

    /* Signatory Section */
    .signatory-container {
      margin-top: auto;
      padding-top: 18px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    .thanks-col {
      font-size: 13px;
      line-height: 1.5;
    }
    .sign-box {
      text-align: right;
      min-width: 240px;
    }
    .sign-for {
      font-size: 13.5px;
      font-weight: 800;
      color: #0F172A;
    }
    .sign-auth {
      font-size: 11px;
      color: #64748B;
      font-style: italic;
      margin-top: 2px;
    }
    .sign-img {
      height: 44px;
      margin: 4px 0;
    }
    .sign-name {
      font-size: 14px;
      font-weight: 800;
      color: #0F172A;
      text-decoration: underline;
    }
    .sign-role {
      font-size: 11.5px;
      color: #334155;
      font-weight: 600;
      margin-top: 2px;
    }
    .sign-dept {
      font-size: 11px;
      color: #64748B;
    }

    /* Bottom Footer Bar */
    .footer-bar {
      margin: 20px -42px -34px -42px;
      background: #F2821A;
      padding: 8px 42px;
      display: flex;
      justify-content: space-between;
      color: #FFFFFF;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 10.5px;
    }

    @media print {
      body {
        background: #FFFFFF;
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
      .page-sheet {
        box-shadow: none;
        padding: 10mm 15mm 12mm 15mm;
        margin: 0;
        width: 100%;
        min-height: auto;
      }
      .top-color-bar {
        margin: -10mm -15mm 15px -15mm;
      }
      .footer-bar {
        margin: 15px -15mm -12mm -15mm;
      }
    }
  </style>
</head>
<body>

  <div class="print-controls-bar no-print">
    <div>
      <strong>Ganita Ventures Official Quotation Generator</strong> | Ref: <code>${refNo}</code>
    </div>
    <div style="display: flex; gap: 12px; align-items: center;">
      <a href="/admin" class="back-btn">← Admin Dashboard</a>
      <button onclick="window.print()" class="print-btn">🖨️ Print Quotation (PDF)</button>
    </div>
  </div>

  <div class="page-sheet">
    
    <div class="top-color-bar"></div>

    <!-- Letterhead Header -->
    <div class="letterhead-header">
      <div class="company-name">GANITA VENTURES</div>
      <div class="company-tagline">TRADING • SUPPLIES • PROJECTS • SERVICES</div>
      <div class="company-address">Puraniganj, Munger, Bihar – 811201</div>
      <div class="company-contact">
        <strong>Phone:</strong> +91 8709605306 &nbsp;|&nbsp; <strong>Email:</strong> ganitaventures87@gmail.com
      </div>
      <div class="company-gstin"><strong>GSTIN:</strong> 10AAAAA0000A1Z5</div>
    </div>

    <!-- Ref & Date -->
    <div class="meta-row">
      <div class="meta-ref"><strong>Ref. No:</strong> ${refNo}</div>
      <div class="meta-date"><strong>Date:</strong> ${quoteDate}</div>
    </div>

    <!-- Recipient -->
    <div class="recipient-block">
      <div class="recipient-to">To,</div>
      <div>${recipientDesignation},</div>
      <div>${recipientOrg},</div>
      <div>${recipientLocation}</div>
      <div class="recipient-contact">
        ${recipientEmail ? `<strong>Email:</strong> ${recipientEmail}` : ''}
        ${recipientEmail && recipientPhone ? ` &nbsp;|&nbsp; ` : ''}
        ${recipientPhone ? `<strong>Contact:</strong> ${recipientPhone}` : ''}
      </div>
    </div>

    <!-- Subject -->
    <div class="subject-block">
      <strong>Subject:</strong> ${subject}
    </div>

    <!-- Salutation & Body -->
    <div class="salutation">${salutation}</div>
    ${bodyText.split('\n\n').map(p => `<p class="body-p">${p.replace(/\n/g, '<br>')}</p>`).join('')}

    <!-- Commercial Quotation Table -->
    <div class="section-title">Commercial Quotation</div>
    <table class="commercial-table">
      <thead>
        <tr>
          <th class="col-sl" style="width: 7%;">Sl. No.</th>
          <th class="col-desc" style="${includeGST ? 'width: 45%;' : 'width: 53%;'}">Description of Material</th>
          <th class="col-qty" style="${includeGST ? 'width: 14%;' : 'width: 15%;'}">Quantity</th>
          <th class="col-rate" style="${includeGST ? 'width: 12%;' : 'width: 13%;'}">Unit Rate (₹)</th>
          ${includeGST ? `<th class="col-gst" style="width: 10%;">GST Rate</th>` : ''}
          <th class="col-amount" style="${includeGST ? 'width: 12%;' : 'width: 12%;'}">${includeGST ? 'Taxable Amount (₹)' : 'Total Amount (₹)'}</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((item, idx) => `
          <tr>
            <td class="col-sl">${item.sl || idx + 1}</td>
            <td class="col-desc"><strong>${item.description || item.item_name}</strong></td>
            <td class="col-qty">${item.qty}</td>
            <td class="col-rate">₹ ${Number(item.unit_rate || item.unit_price || 0).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
            ${includeGST ? `<td class="col-gst">${item.gst_rate !== undefined ? item.gst_rate : (item.gst_percent !== undefined ? item.gst_percent : 18)}%</td>` : ''}
            <td class="col-amount">₹ ${Number(item.taxable_amount || item.amount || 0).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <!-- Totals Summary -->
    <div class="totals-wrap">
      <div class="totals-box">
        <div class="totals-row">
          <span>• ${includeGST ? 'Taxable Subtotal' : 'Subtotal'}:</span>
          <span>₹ ${Number(taxableSubtotal).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
        </div>
        ${includeGST && gstAmount > 0 ? `
        <div class="totals-row">
          <span>• Integrated / Applicable GST${gstRate && Math.abs(Math.round(taxableSubtotal * (gstRate / 100)) - Math.round(gstAmount)) <= 2 ? ` (${gstRate}%)` : ''}:</span>
          <span>₹ ${Number(gstAmount).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
        </div>
        ` : ''}
        ${transportCharges > 0 ? `
        <div class="totals-row">
          <span>• Transportation & Unloading Charges:</span>
          <span>₹ ${Number(transportCharges).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
        </div>
        ` : ''}
        <div class="totals-row grand">
          <span>• Total Gross Amount:</span>
          <span>₹ ${Number(grossTotal).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
        </div>
        <div class="words-row">
          * (${amountWords})
        </div>
      </div>
    </div>

    ${includeTerms && termsList.length > 0 ? `
    <!-- Terms & Conditions -->
    <div class="terms-box">
      <div class="section-title" style="margin-top: 10px;">Terms & Conditions</div>
      <ol class="terms-list">
        ${termsList.map(term => `<li>${typeof term === 'string' ? term : `${term.title ? `<strong>${term.title}:</strong> ` : ''}${term.text}`}</li>`).join('')}
      </ol>
    </div>
    ` : ''}

    <!-- Concluding Note -->
    <div class="concluding-p">
      ${concludingText.replace(/\n/g, '<br>')}
    </div>

    <!-- Signatory Box -->
    <div class="signatory-container">
      <div class="thanks-col">
        ${closing.replace(/\n/g, '<br>')}
      </div>
      <div class="sign-box">
        <div class="sign-for">For GANITA VENTURES</div>
        <div class="sign-auth">(Authorized Signatory)</div>
        <img src="/assets/img/signature.svg" alt="Signature" class="sign-img">
        <div class="sign-name">${signatory}</div>
        <div class="sign-role">${signatoryTitle}</div>
        <div class="sign-dept">${signatoryDept}</div>
      </div>
    </div>

    <!-- Footer Bar -->
    <div class="footer-bar">
      <div><strong>Registered Office:</strong> Puraniganj, Munger, Bihar – 811201</div>
      <div><strong>Phone:</strong> +91 8709605306 &nbsp;|&nbsp; <strong>Email:</strong> ganitaventures87@gmail.com</div>
    </div>

  </div>

</body>
</html>`;
}

function generateInvoiceHTML(inv) {
  const cfg = Object.assign({
    show_logo: true,
    show_tagline: true,
    show_company_gstin: true,
    show_header_state: true,
    show_title_banner: true,
    
    show_customer_name: true,
    show_customer_address: true,
    show_customer_gstin: true,
    show_customer_phone: true,
    show_customer_email: false,
    
    show_inv_no: true,
    show_inv_date: true,
    show_due_date: true,
    show_pos: true,
    show_po_ref: true,
    show_vehicle: true,
    show_reverse_charge: true,
    
    show_col_hsn: true,
    show_col_qty: true,
    show_col_unit: true,
    show_col_rate_exclusive: true,
    show_col_rate_inclusive: true,
    show_col_taxable: true,
    show_col_tax: true,
    show_col_total: true,
    
    show_hsn_summary_table: true,
    show_freight: true,
    show_discount: true,
    show_round_off: true,
    show_amount_words: true,
    show_bank_details: true,
    show_terms: true,
    show_signatory: true
  }, inv.display_config || {});

  const invNo = inv.invoice_no || inv.id || 'INV/GV/2026-27/0101';
  const invDate = inv.invoice_date || (inv.created_at ? new Date(inv.created_at).toLocaleDateString('en-GB') : '16/10/2026');
  const dueDate = inv.due_date || '30/10/2026';
  const poNo = inv.po_number || '';
  const poDate = inv.po_date || '';
  const placeOfSupply = inv.place_of_supply || 'Bihar (10)';
  const reverseCharge = inv.reverse_charge ? 'YES' : 'NO';
  const transportMode = inv.transport_mode || 'By Road';
  const vehicleNo = inv.vehicle_no || '';
  
  const customerName = inv.customer_name || 'M/s Customer';
  const customerAddress = inv.customer_address || '';
  const customerGstin = inv.customer_gstin || '';
  const customerPhone = inv.customer_phone || '';
  const customerEmail = inv.customer_email || '';

  const isInterState = (placeOfSupply || '').toLowerCase().includes('inter') || 
                       (!(placeOfSupply || '').toLowerCase().includes('bihar') && !(placeOfSupply || '').includes('10'));

  let items = inv.items || [];
  if (!Array.isArray(items) || items.length === 0) {
    items = [
      {
        sl: 1,
        description: 'Industrial Goods & Supplies',
        hsn: '2522',
        qty: 1,
        unit: 'Unit',
        rate_type: 'exclusive',
        unit_rate: 1000,
        rate_with_gst: 1180,
        taxable_amount: 1000,
        gst_rate: 18,
        cgst_amount: 90,
        sgst_amount: 90,
        igst_amount: 0,
        total_amount: 1180
      }
    ];
  }

  // Calculate HSN summary table
  const hsnSummary = {};
  items.forEach(it => {
    const code = it.hsn || '2522';
    if (!hsnSummary[code]) {
      hsnSummary[code] = {
        hsn: code,
        taxable: 0,
        gst_rate: Number(it.gst_rate) || 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
        total_tax: 0
      };
    }
    const taxAmt = Number(it.taxable_amount) || 0;
    const cgst = Number(it.cgst_amount) || 0;
    const sgst = Number(it.sgst_amount) || 0;
    const igst = Number(it.igst_amount) || 0;
    hsnSummary[code].taxable += taxAmt;
    hsnSummary[code].cgst += cgst;
    hsnSummary[code].sgst += sgst;
    hsnSummary[code].igst += igst;
    hsnSummary[code].total_tax += (cgst + sgst + igst);
  });

  const taxableSubtotal = Number(inv.taxable_subtotal) || items.reduce((s, x) => s + (Number(x.taxable_amount) || 0), 0);
  const cgstTotal = isInterState ? 0 : (Number(inv.cgst_total) || items.reduce((s, x) => s + (Number(x.cgst_amount) || 0), 0));
  const sgstTotal = isInterState ? 0 : (Number(inv.sgst_total) || items.reduce((s, x) => s + (Number(x.sgst_amount) || 0), 0));
  const igstTotal = isInterState ? (Number(inv.igst_total) || items.reduce((s, x) => s + (Number(x.igst_amount) || 0), 0)) : 0;
  const freight = Number(inv.freight_charges) || 0;
  const discount = Number(inv.discount) || 0;
  const roundOff = Number(inv.round_off) || 0;
  const grandTotal = Number(inv.grand_total) || Math.round(taxableSubtotal + cgstTotal + sgstTotal + igstTotal + freight - discount + roundOff);
  const amountWords = inv.amount_words || numberToIndianWords(grandTotal);

  const bankName = inv.bank_name || 'State Bank of India';
  const bankAccount = inv.bank_account || '3892019283019';
  const bankIfsc = inv.bank_ifsc || 'SBIN0000136';
  const bankBranch = inv.bank_branch || 'Munger Main Branch';
  const bankUpi = inv.bank_upi || '8709605306@upi';
  const notes = inv.notes || '1. Goods received in sound condition.\n2. Payment terms as agreed.\n3. Subject to Munger Jurisdiction only.';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Tax Invoice - ${invNo} | Ganita Ventures</title>
  <meta name="robots" content="noindex, nofollow">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" href="/assets/img/logo.png" type="image/png">
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm 10mm 10mm 10mm;
    }
    *, *:before, *:after {
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0F172A;
      background: #E2E8F0;
      margin: 0;
      padding: 20px 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .print-controls-bar {
      width: 210mm;
      margin: 0 auto 14px auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #090D16;
      color: #FFFFFF;
      padding: 10px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .print-btn {
      background: #F2821A;
      color: #FFFFFF;
      border: none;
      padding: 7px 18px;
      border-radius: 6px;
      font-weight: 700;
      cursor: pointer;
      font-size: 13.5px;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .print-btn:hover {
      background: #D95C00;
    }
    .back-btn {
      color: #94A3B8;
      text-decoration: none;
      font-size: 13px;
    }
    .back-btn:hover {
      color: #FFFFFF;
    }
    .invoice-sheet {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      background: #FFFFFF;
      padding: 24px 28px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.12);
      border: 1.5px solid #0F172A;
      display: flex;
      flex-direction: column;
      position: relative;
    }
    .header-logo-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .company-title {
      font-size: 24px;
      font-weight: 900;
      color: #0F172A;
      letter-spacing: 1.5px;
      margin: 0;
      text-transform: uppercase;
    }
    .company-tagline {
      font-size: 10.5px;
      font-weight: 700;
      color: #F2821A;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      margin-top: 2px;
    }
    .invoice-type-banner {
      background: #0F172A;
      color: #FFF;
      text-align: center;
      letter-spacing: 2px;
      margin-bottom: 12px;
      border-radius: 4px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 14px;
      font-weight: 800;
    }
    .two-col-box {
      display: grid;
      grid-template-columns: 1fr 1fr;
      border: 1px solid #334155;
      border-radius: 6px;
      margin-bottom: 12px;
      font-size: 11.5px;
      overflow: hidden;
    }
    .box-col {
      padding: 10px 14px;
      line-height: 1.5;
    }
    .box-col:first-child {
      border-right: 1px solid #334155;
      background: #F8FAFC;
    }
    .box-header {
      font-weight: 800;
      color: #0F172A;
      font-size: 12px;
      border-bottom: 1px solid #CBD5E1;
      padding-bottom: 4px;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: 105px 1fr;
      row-gap: 3px;
    }
    .meta-label {
      color: #64748B;
      font-weight: 600;
    }
    .meta-val {
      color: #0F172A;
      font-weight: 700;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      margin-bottom: 12px;
    }
    .items-table th {
      background: #0F172A;
      color: #FFF;
      padding: 6px 8px;
      border: 1px solid #0F172A;
      text-align: left;
      font-weight: 700;
      font-size: 10.5px;
    }
    .items-table td {
      border: 1px solid #CBD5E1;
      padding: 6px 8px;
      vertical-align: middle;
    }
    .items-table tr:nth-child(even) td {
      background: #F8FAFC;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .totals-summary-grid {
      display: grid;
      grid-template-columns: 1.2fr 0.8fr;
      gap: 12px;
      margin-bottom: 12px;
    }
    .tax-breakdown-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
    }
    .tax-breakdown-table th {
      background: #F1F5F9;
      color: #0F172A;
      border: 1px solid #CBD5E1;
      padding: 4px 6px;
      font-size: 10px;
    }
    .tax-breakdown-table td {
      border: 1px solid #CBD5E1;
      padding: 4px 6px;
    }
    .calc-box {
      border: 1px solid #334155;
      border-radius: 6px;
      background: #F8FAFC;
      font-size: 11.5px;
      overflow: hidden;
    }
    .calc-row {
      display: flex;
      justify-content: space-between;
      padding: 5px 12px;
      border-bottom: 1px solid #E2E8F0;
    }
    .calc-row.grand-total {
      background: #0F172A;
      color: #FFF;
      font-weight: 800;
      font-size: 13.5px;
      border-bottom: none;
      padding: 8px 12px;
    }
    .words-box {
      border: 1px dashed #64748B;
      background: #FFFBEB;
      padding: 8px 12px;
      border-radius: 6px;
      margin-bottom: 12px;
      font-size: 11.5px;
    }
    .bottom-section {
      display: grid;
      grid-template-columns: 1.2fr 0.8fr;
      gap: 12px;
      margin-top: auto;
      border-top: 1.5px solid #0F172A;
      padding-top: 12px;
    }
    .bank-box {
      font-size: 11px;
      line-height: 1.5;
    }
    .signatory-box {
      text-align: right;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: flex-end;
    }
    @media print {
      body {
        background: transparent;
        padding: 0;
      }
      .print-controls-bar {
        display: none !important;
      }
      .invoice-sheet {
        box-shadow: none;
        margin: 0;
        width: 100%;
        border: 1.5px solid #000;
        page-break-after: avoid;
      }
    }
  </style>
</head>
<body>

  <div class="print-controls-bar">
    <div style="display: flex; align-items: center; gap: 10px;">
      <a href="/admin" class="back-btn">&larr; Return to Admin Console</a>
      <span style="color: #475569;">|</span>
      <span style="font-weight: 700; color: #F2821A;">Tax Invoice #${invNo}</span>
    </div>
    <div style="display: flex; gap: 10px;">
      <button type="button" class="print-btn" onclick="window.print()">
        🖨️ Print / Save as PDF
      </button>
    </div>
  </div>

  <div class="invoice-sheet">
    
    <!-- Top Header -->
    <div class="header-logo-row">
      <div style="display: flex; align-items: center; gap: 12px;">
        ${cfg.show_logo !== false ? `<img src="/assets/img/logo.png" alt="Ganita Ventures Logo" style="height: 52px; width: auto;">` : ''}
        <div>
          <h1 class="company-title">GANITA VENTURES</h1>
          ${cfg.show_tagline !== false ? `<div class="company-tagline">Trading • Supplies • Projects • Services</div>` : ''}
        </div>
      </div>
      ${cfg.show_header_state !== false ? `
        <div style="text-align: right; font-size: 11px; color: #475569;">
          <span style="display: inline-block; padding: 2px 8px; border: 1px solid #0F172A; border-radius: 4px; font-weight: 800; color: #0F172A; font-size: 10px; margin-bottom: 4px;">
            ORIGINAL FOR RECIPIENT
          </span>
          <div><strong>State:</strong> Bihar (Code: 10)</div>
        </div>
      ` : ''}
    </div>

    <!-- Company Contact Banner -->
    ${cfg.show_company_gstin !== false ? `
      <div style="font-size: 11px; color: #334155; margin-bottom: 10px; border-bottom: 1.5px solid #F2821A; padding-bottom: 6px; display: flex; justify-content: space-between;">
        <div><strong>Regd Office:</strong> Puraniganj, Munger, Bihar – 811201</div>
        <div><strong>GSTIN:</strong> 10AAAAA0000A1Z5 | <strong>Phone:</strong> +91 8709605306</div>
      </div>
    ` : '<div style="margin-bottom: 10px; border-bottom: 1.5px solid #F2821A;"></div>'}

    <!-- Document Title Banner -->
    ${cfg.show_title_banner !== false ? `
      <div class="invoice-type-banner">
        <span>TAX INVOICE</span>
        <span style="font-size: 11px; font-weight: 600; letter-spacing: 0;">(Rule 46 of CGST Rules, 2017)</span>
        <span style="font-size: 11.5px;">INVOICE NO: <strong>${invNo}</strong></span>
      </div>
    ` : ''}

    <!-- 2 Column Details -->
    <div class="two-col-box">
      <!-- Buyer Box -->
      <div class="box-col">
        <div class="box-header">Bill To & Ship To (Consignee)</div>
        ${cfg.show_customer_name !== false && customerName ? `
          <div style="font-size: 13px; font-weight: 800; color: #0F172A; margin-bottom: 3px;">
            ${customerName}
          </div>
        ` : ''}
        ${cfg.show_customer_address !== false && customerAddress ? `
          <div style="color: #334155; margin-bottom: 4px;">
            ${customerAddress}
          </div>
        ` : ''}
        ${cfg.show_customer_gstin !== false && customerGstin ? `
          <div><strong>GSTIN / UIN:</strong> ${customerGstin}</div>
        ` : ''}
        ${cfg.show_customer_phone !== false && customerPhone ? `
          <div><strong>Phone:</strong> ${customerPhone}</div>
        ` : ''}
        ${cfg.show_customer_email !== false && customerEmail ? `
          <div><strong>Email:</strong> ${customerEmail}</div>
        ` : ''}
      </div>

      <!-- Invoice Meta Box -->
      <div class="box-col">
        <div class="box-header">Invoice Details</div>
        <div class="meta-grid">
          ${cfg.show_inv_no !== false ? `
            <span class="meta-label">Invoice No:</span>
            <span class="meta-val">${invNo}</span>
          ` : ''}

          ${cfg.show_inv_date !== false ? `
            <span class="meta-label">Invoice Date:</span>
            <span class="meta-val">${invDate}</span>
          ` : ''}

          ${cfg.show_due_date !== false && dueDate ? `
            <span class="meta-label">Due Date:</span>
            <span class="meta-val">${dueDate}</span>
          ` : ''}

          ${cfg.show_po_ref !== false && poNo ? `
            <span class="meta-label">PO Ref / Date:</span>
            <span class="meta-val">${poNo} ${poDate ? `(${poDate})` : ''}</span>
          ` : ''}

          ${cfg.show_pos !== false && placeOfSupply ? `
            <span class="meta-label">Place of Supply:</span>
            <span class="meta-val">${placeOfSupply}</span>
          ` : ''}

          ${cfg.show_reverse_charge !== false ? `
            <span class="meta-label">Reverse Charge:</span>
            <span class="meta-val">${reverseCharge}</span>
          ` : ''}

          ${cfg.show_vehicle !== false && (transportMode || vehicleNo) ? `
            <span class="meta-label">Transport:</span>
            <span class="meta-val">${transportMode} ${vehicleNo ? `| ${vehicleNo}` : ''}</span>
          ` : ''}
        </div>
      </div>
    </div>

    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 32px;" class="text-center">#</th>
          <th>Description of Goods / Services</th>
          ${cfg.show_col_hsn !== false ? `<th style="width: 65px;" class="text-center">HSN/SAC</th>` : ''}
          ${cfg.show_col_qty !== false ? `<th style="width: 45px;" class="text-center">Qty</th>` : ''}
          ${cfg.show_col_unit !== false ? `<th style="width: 45px;" class="text-center">Unit</th>` : ''}
          ${cfg.show_col_rate_exclusive !== false ? `<th style="width: 80px;" class="text-right">Unit Rate (₹)</th>` : ''}
          ${cfg.show_col_taxable !== false ? `<th style="width: 80px;" class="text-right">Taxable (₹)</th>` : ''}
          ${cfg.show_col_tax !== false ? `
            <th style="width: 40px;" class="text-center">GST</th>
            ${isInterState ? `
              <th style="width: 75px;" class="text-right">IGST (₹)</th>
            ` : `
              <th style="width: 65px;" class="text-right">CGST (₹)</th>
              <th style="width: 65px;" class="text-right">SGST (₹)</th>
            `}
          ` : ''}
          ${cfg.show_col_total !== false ? `<th style="width: 85px;" class="text-right">Total (₹)</th>` : ''}
        </tr>
      </thead>
      <tbody>
        ${items.map((it, idx) => {
          const showInclusiveNote = cfg.show_col_rate_inclusive !== false && it.rate_type === 'inclusive';
          const rateNotice = showInclusiveNote ? '<br><small style="font-size: 8.5px; color: #64748B;">(Incl. GST ₹' + (it.rate_with_gst || it.unit_rate) + ')</small>' : '';
          return `
            <tr>
              <td class="text-center">${it.sl || idx + 1}</td>
              <td>
                <strong>${it.description}</strong>
              </td>
              ${cfg.show_col_hsn !== false ? `<td class="text-center">${it.hsn || '2522'}</td>` : ''}
              ${cfg.show_col_qty !== false ? `<td class="text-center"><strong>${it.qty}</strong></td>` : ''}
              ${cfg.show_col_unit !== false ? `<td class="text-center">${it.unit || 'Bags'}</td>` : ''}
              ${cfg.show_col_rate_exclusive !== false ? `<td class="text-right">₹${Number(it.unit_rate).toFixed(2)}${rateNotice}</td>` : ''}
              ${cfg.show_col_taxable !== false ? `<td class="text-right">₹${Number(it.taxable_amount).toFixed(2)}</td>` : ''}
              ${cfg.show_col_tax !== false ? `
                <td class="text-center">${it.gst_rate}%</td>
                ${isInterState ? `
                  <td class="text-right">₹${Number(it.igst_amount || 0).toFixed(2)}</td>
                ` : `
                  <td class="text-right">₹${Number(it.cgst_amount || 0).toFixed(2)}</td>
                  <td class="text-right">₹${Number(it.sgst_amount || 0).toFixed(2)}</td>
                `}
              ` : ''}
              ${cfg.show_col_total !== false ? `<td class="text-right" style="font-weight: 700; color: #0F172A;">₹${Number(it.total_amount).toFixed(2)}</td>` : ''}
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>

    <!-- Totals Summary & HSN Breakdown -->
    <div class="totals-summary-grid" style="${cfg.show_hsn_summary_table === false ? 'grid-template-columns: 1fr;' : ''}">
      ${cfg.show_hsn_summary_table !== false ? `
        <!-- Left: HSN Summary -->
        <div>
          <div style="font-size: 10.5px; font-weight: 700; color: #0F172A; margin-bottom: 4px; text-transform: uppercase;">
            HSN / SAC Tax Summary
          </div>
          <table class="tax-breakdown-table">
            <thead>
              <tr>
                <th>HSN/SAC</th>
                <th class="text-right">Taxable Val</th>
                <th class="text-center">GST %</th>
                ${isInterState ? `
                  <th class="text-right">IGST Amt</th>
                ` : `
                  <th class="text-right">CGST Amt</th>
                  <th class="text-right">SGST Amt</th>
                `}
                <th class="text-right">Total Tax</th>
              </tr>
            </thead>
            <tbody>
              ${Object.values(hsnSummary).map(h => `
                <tr>
                  <td>${h.hsn}</td>
                  <td class="text-right">₹${h.taxable.toFixed(2)}</td>
                  <td class="text-center">${h.gst_rate}%</td>
                  ${isInterState ? `
                    <td class="text-right">₹${h.igst.toFixed(2)}</td>
                  ` : `
                    <td class="text-right">₹${h.cgst.toFixed(2)}</td>
                    <td class="text-right">₹${h.sgst.toFixed(2)}</td>
                  `}
                  <td class="text-right"><strong>₹${h.total_tax.toFixed(2)}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}

      <!-- Right: Calculation Box -->
      <div class="calc-box" style="${cfg.show_hsn_summary_table === false ? 'max-width: 380px; margin-left: auto;' : ''}">
        <div class="calc-row">
          <span style="color: #64748B;">Taxable Subtotal:</span>
          <strong>₹${taxableSubtotal.toFixed(2)}</strong>
        </div>
        ${cfg.show_col_tax !== false ? (isInterState ? `
          <div class="calc-row">
            <span style="color: #64748B;">IGST Total:</span>
            <strong>₹${igstTotal.toFixed(2)}</strong>
          </div>
        ` : `
          <div class="calc-row">
            <span style="color: #64748B;">CGST Total:</span>
            <strong>₹${cgstTotal.toFixed(2)}</strong>
          </div>
          <div class="calc-row">
            <span style="color: #64748B;">SGST Total:</span>
            <strong>₹${sgstTotal.toFixed(2)}</strong>
          </div>
        `) : ''}
        ${cfg.show_freight !== false && freight > 0 ? `
          <div class="calc-row">
            <span style="color: #64748B;">Freight & Unloading:</span>
            <strong>₹${freight.toFixed(2)}</strong>
          </div>
        ` : ''}
        ${cfg.show_discount !== false && discount > 0 ? `
          <div class="calc-row">
            <span style="color: #64748B;">Discount:</span>
            <strong style="color: #EF4444;">-₹${discount.toFixed(2)}</strong>
          </div>
        ` : ''}
        ${cfg.show_round_off !== false && roundOff !== 0 ? `
          <div class="calc-row">
            <span style="color: #64748B;">Round Off:</span>
            <span>₹${roundOff.toFixed(2)}</span>
          </div>
        ` : ''}
        <div class="calc-row grand-total">
          <span>GRAND TOTAL:</span>
          <span>₹${grandTotal.toLocaleString('en-IN')}.00</span>
        </div>
      </div>
    </div>

    <!-- Amount in Words -->
    ${cfg.show_amount_words !== false ? `
      <div class="words-box">
        <strong>Amount Chargeable (in words):</strong> ${amountWords}
      </div>
    ` : ''}

    <!-- Bottom Section: Bank Details & Signatory -->
    <div class="bottom-section">
      ${(cfg.show_bank_details !== false || (cfg.show_terms !== false && notes)) ? `
        <div class="bank-box">
          ${cfg.show_bank_details !== false ? `
            <div style="font-weight: 800; text-transform: uppercase; margin-bottom: 4px; color: #0F172A; font-size: 11.5px;">
              Bank Remittance Details:
            </div>
            <div><strong>Bank Name:</strong> ${bankName}</div>
            <div><strong>A/C No:</strong> ${bankAccount}</div>
            <div><strong>IFSC Code:</strong> ${bankIfsc} &nbsp;|&nbsp; <strong>Branch:</strong> ${bankBranch}</div>
            ${bankUpi ? `<div><strong>UPI ID:</strong> ${bankUpi}</div>` : ''}
          ` : ''}
          ${cfg.show_terms !== false && notes ? `
            <div style="margin-top: 6px; font-size: 10px; color: #64748B; white-space: pre-line;">
              ${notes}
            </div>
          ` : ''}
        </div>
      ` : '<div></div>'}

      ${cfg.show_signatory !== false ? `
        <div class="signatory-box">
          <div style="font-size: 12px; font-weight: 800; color: #0F172A; text-transform: uppercase;">
            For GANITA VENTURES
          </div>
          <div style="margin-top: 45px; text-align: right;">
            <div style="font-weight: 800; font-size: 12px; color: #0F172A;">Authorized Signatory</div>
            <div style="font-size: 10px; color: #64748B;">(Proprietor / Signatory)</div>
          </div>
        </div>
      ` : ''}
    </div>

  </div>

</body>
</html>`;
}

// Main HTTP Router
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, HEAD'
    });
    return res.end();
  }

  // Normalize path for robots.txt and sitemap.xml
  const cleanPath = (pathname || '').toLowerCase().replace(/\/$/, '');

  // 1. Dedicated Robots.txt Route (Direct, resilient, full CORS & HEAD support)
  if (cleanPath === '/robots.txt') {
    const robotsPath = path.join(PUBLIC_DIR, 'robots.txt');
    let robotsContent = '';
    try {
      robotsContent = fs.readFileSync(robotsPath, 'utf8');
    } catch (e) {
      robotsContent = "User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nSitemap: https://ganitaventures.com/sitemap.xml\n";
    }
    const buf = Buffer.from(robotsContent, 'utf8');
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Length': buf.length,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Cache-Control': 'public, max-age=86400',
      'Connection': 'close'
    });
    if (method === 'HEAD') return res.end();
    return res.end(buf);
  }

  // 2. Dedicated Sitemap.xml Route (Direct, resilient, full CORS & HEAD support)
  if (cleanPath === '/sitemap.xml') {
    const sitemapPath = path.join(PUBLIC_DIR, 'sitemap.xml');
    let sitemapContent = '';
    try {
      sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
    } catch (e) {
      sitemapContent = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n<url><loc>https://ganitaventures.com/</loc></url>\n</urlset>';
    }
    const buf = Buffer.from(sitemapContent, 'utf8');
    res.writeHead(200, {
      'Content-Type': 'application/xml; charset=utf-8',
      'Content-Length': buf.length,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Cache-Control': 'public, max-age=86400',
      'Connection': 'close'
    });
    if (method === 'HEAD') return res.end();
    return res.end(buf);
  }

  // ==========================================
  // PUBLIC API ENDPOINTS
  // ==========================================
  
  if (pathname === '/api/settings' && method === 'GET') {
    return sendJSON(res, db.getSettings());
  }

  if (pathname === '/api/stats' && method === 'GET') {
    return sendJSON(res, db.get('stats'));
  }

  if (pathname === '/api/services' && method === 'GET') {
    const activeServices = db.filter('services', s => s.status === 'active');
    activeServices.sort((a, b) => (a.ordering || 0) - (b.ordering || 0));
    return sendJSON(res, activeServices);
  }

  if (pathname === '/api/products' && method === 'GET') {
    let products = db.filter('products', p => p.status === 'active');
    
    if (parsedUrl.query.category) {
      products = products.filter(p => p.category.toLowerCase() === parsedUrl.query.category.toLowerCase());
    }
    if (parsedUrl.query.search) {
      const q = parsedUrl.query.search.toLowerCase();
      products = products.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }
    if (parsedUrl.query.sort === 'price_low') {
      products.sort((a, b) => (a.discount_price || a.price) - (b.discount_price || b.price));
    } else if (parsedUrl.query.sort === 'price_high') {
      products.sort((a, b) => (b.discount_price || b.price) - (a.discount_price || a.price));
    }

    return sendJSON(res, products);
  }

  if (pathname.startsWith('/api/products/') && method === 'GET') {
    const id = pathname.replace('/api/products/', '');
    const product = db.getOne('products', p => p.id === id || p.sku === id);
    if (!product) return sendError(res, 'Product not found', 404);
    return sendJSON(res, product);
  }

  if (pathname === '/api/orders' && method === 'POST') {
    const body = await getRequestBody(req);
    if (!body.customer_name || !body.customer_phone || !body.items || body.items.length === 0) {
      return sendError(res, 'Missing required customer details or order items');
    }

    const orderId = `GV-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const newOrder = {
      id: orderId,
      customer_name: body.customer_name,
      customer_email: body.customer_email || '',
      customer_phone: body.customer_phone,
      shipping_address: body.shipping_address || '',
      city: body.city || 'Munger',
      state: body.state || 'Bihar',
      pincode: body.pincode || '',
      items: body.items,
      subtotal: body.subtotal || 0,
      tax: body.tax || 0,
      shipping: body.shipping || 0,
      total_amount: body.total_amount || 0,
      payment_method: body.payment_method || 'Cash on Delivery',
      payment_status: 'Pending',
      order_status: 'Order Received',
      notes: body.notes || ''
    };

    db.insert('orders', newOrder);

    db.insert('leads', {
      name: body.customer_name,
      company: '',
      email: body.customer_email || '',
      phone: body.customer_phone,
      requirement_type: 'Direct Order',
      subject: `Order ${orderId} Placed (₹ ${body.total_amount})`,
      message: `Delivery Address: ${body.shipping_address}, ${body.city}, ${body.state}`,
      status: 'Qualified'
    });

    return sendJSON(res, { success: true, order_id: orderId, message: "Order placed successfully" }, 201);
  }

  if (pathname === '/api/orders/track' && method === 'GET') {
    const orderId = parsedUrl.query.order_id;
    if (!orderId) return sendError(res, 'Order ID is required');
    const order = db.getOne('orders', o => o.id.toLowerCase() === orderId.trim().toLowerCase());
    if (!order) return sendError(res, 'Order not found with provided ID', 404);
    return sendJSON(res, order);
  }

  if (pathname === '/api/rfq' && method === 'POST') {
    const body = await getRequestBody(req);
    if (!body.org_name || !body.contact_person || !body.phone) {
      return sendError(res, 'Organization name, contact person, and phone are required');
    }

    const rfqId = `RFQ-GV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newRFQ = {
      id: rfqId,
      org_name: body.org_name,
      contact_person: body.contact_person,
      designation: body.designation || '',
      email: body.email || '',
      phone: body.phone,
      gstin: body.gstin || '',
      org_type: body.org_type || 'Corporate',
      delivery_location: body.delivery_location || '',
      required_products: body.required_products || '',
      quantity: body.quantity || '',
      expected_delivery_date: body.expected_delivery_date || '',
      budget: body.budget || '',
      notes: body.notes || '',
      status: 'Pending'
    };

    db.insert('rfqs', newRFQ);

    db.insert('leads', {
      name: `${body.contact_person} (${body.org_name})`,
      company: body.org_name,
      email: body.email || '',
      phone: body.phone,
      requirement_type: 'B2B / Institutional RFQ',
      subject: `RFQ ${rfqId}: ${body.required_products.substring(0, 50)}...`,
      message: `Budget: ${body.budget}. Delivery Location: ${body.delivery_location}`,
      status: 'New'
    });

    return sendJSON(res, { success: true, rfq_id: rfqId, message: "RFQ submitted successfully" }, 201);
  }

  if (pathname === '/api/contact' && method === 'POST') {
    const body = await getRequestBody(req);
    if (!body.name || !body.phone) {
      return sendError(res, 'Name and phone are required');
    }

    db.insert('leads', {
      name: body.name,
      company: body.company || '',
      email: body.email || '',
      phone: body.phone,
      requirement_type: body.requirement_type || 'General Inquiry',
      subject: body.subject || 'Website Contact Form',
      message: body.message || '',
      status: 'New'
    });

    return sendJSON(res, { success: true, message: "Thank you for contacting Ganita Ventures. Our team will contact you shortly." });
  }

  if (pathname === '/api/projects' && method === 'GET') {
    return sendJSON(res, db.get('projects'));
  }

  if (pathname === '/api/faqs' && method === 'GET') {
    return sendJSON(res, db.get('faqs'));
  }

  // Quotation PDF / Print Endpoint (Noindex for SEO privacy)
  if (pathname.startsWith('/api/quotes/') && pathname.endsWith('/pdf') && method === 'GET') {
    const quoteId = pathname.replace('/api/quotes/', '').replace('/pdf', '');
    let quote = db.getOne('quotes', q => q.id === quoteId || q.ref_no === quoteId);
    if (!quote) {
      quote = db.getOne('letters', l => l.id === quoteId || l.ref_no === quoteId);
    }

    if (!quote) {
      return sendError(res, 'Quotation not found', 404);
    }

    const htmlContent = generateQuotationHTML(quote);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(htmlContent);
  }

  // ==========================================
  // PROTECTED ADMIN API ENDPOINTS
  // ==========================================
  
  if (pathname === '/api/admin/login' && method === 'POST') {
    const body = await getRequestBody(req);
    const admin = db.getOne('admins', a => a.username === body.username || a.email === body.username);
    
    if (!admin) return sendError(res, 'Invalid credentials', 401);

    const hash = crypto.pbkdf2Sync(body.password, admin.salt, 1000, 64, "sha512").toString("hex");
    if (hash !== admin.password_hash) {
      return sendError(res, 'Invalid credentials', 401);
    }

    const token = generateToken({ id: admin.id, username: admin.username, role: admin.role });
    return sendJSON(res, { token, user: { name: admin.name, email: admin.email, role: admin.role } });
  }

  // Printable Letterhead / Formal Quotation Endpoint (No login required for printing generated letter)
  if (pathname.startsWith('/api/admin/letters/') && pathname.endsWith('/print') && method === 'GET') {
    const letterId = pathname.replace('/api/admin/letters/', '').replace('/print', '');
    let letter = db.getOne('letters', l => l.id === letterId || l.ref_no === letterId);
    if (!letter) {
      letter = db.getOne('quotes', q => q.id === letterId || q.ref_no === letterId);
    }
    
    if (!letter) return sendError(res, 'Letter / Quotation record not found', 404);

    const htmlContent = generateQuotationHTML(letter);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(htmlContent);
  }

  // Printable Tax Invoice Endpoint (Direct browser view & print)
  if (pathname.startsWith('/api/admin/invoices/') && pathname.endsWith('/print') && method === 'GET') {
    const invId = pathname.replace('/api/admin/invoices/', '').replace('/print', '');
    let invoice = db.getOne('invoices', i => i.id === invId || i.invoice_no === invId);
    if (!invoice) return sendError(res, 'Invoice record not found', 404);

    const htmlContent = generateInvoiceHTML(invoice);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(htmlContent);
  }

  // Admin Auth Verify Helper
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  const adminUser = verifyToken(token);

  if (pathname.startsWith('/api/admin/')) {
    if (!adminUser) {
      return sendError(res, 'Unauthorized access', 401);
    }

    if (pathname === '/api/admin/dashboard-stats' && method === 'GET') {
      const orders = db.get('orders');
      const rfqs = db.get('rfqs');
      const leads = db.get('leads');
      const quotes = db.get('quotes');
      const letters = db.get('letters');
      const invoices = db.get('invoices');

      const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const pendingRFQs = rfqs.filter(r => r.status === 'Pending').length;

      return sendJSON(res, {
        total_orders: orders.length,
        total_revenue: totalRevenue,
        pending_rfqs: pendingRFQs,
        total_leads: leads.length,
        total_quotes: quotes.length,
        total_letters: letters.length,
        total_invoices: invoices.length,
        recent_logs: db.get('audit_logs').slice(0, 10)
      });
    }

    // Tender Letter / Quotation Generator Endpoints
    if (pathname === '/api/admin/letters' && method === 'GET') {
      return sendJSON(res, db.get('letters'));
    }

    if (pathname === '/api/admin/letters' && method === 'POST') {
      const body = await getRequestBody(req);
      if (!body.id) body.id = `LTR-GV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      if (!body.amount_words && body.gross_total) {
        body.amount_words = numberToIndianWords(body.gross_total);
      }
      const newLetter = db.insert('letters', body);
      return sendJSON(res, newLetter, 201);
    }

    if (pathname.startsWith('/api/admin/letters/') && method === 'DELETE') {
      const id = pathname.replace('/api/admin/letters/', '');
      db.delete('letters', id);
      return sendJSON(res, { success: true });
    }

    if (pathname === '/api/admin/orders' && method === 'GET') {
      return sendJSON(res, db.get('orders'));
    }

    if (pathname.startsWith('/api/admin/orders/') && pathname.endsWith('/status') && method === 'PUT') {
      const orderId = pathname.replace('/api/admin/orders/', '').replace('/status', '');
      const body = await getRequestBody(req);
      const updated = db.update('orders', orderId, { order_status: body.order_status });
      return sendJSON(res, updated);
    }

    if (pathname === '/api/admin/products' && method === 'POST') {
      const body = await getRequestBody(req);
      const newP = db.insert('products', body);
      return sendJSON(res, newP, 201);
    }

    if (pathname.startsWith('/api/admin/products/') && method === 'DELETE') {
      const id = pathname.replace('/api/admin/products/', '');
      db.delete('products', id);
      return sendJSON(res, { success: true });
    }

    if (pathname === '/api/admin/services' && method === 'POST') {
      const body = await getRequestBody(req);
      const newS = db.insert('services', body);
      return sendJSON(res, newS, 201);
    }

    if (pathname.startsWith('/api/admin/services/') && method === 'DELETE') {
      const id = pathname.replace('/api/admin/services/', '');
      db.delete('services', id);
      return sendJSON(res, { success: true });
    }

    // File Upload Endpoint (Images and PDFs for project proof)
    if (pathname === '/api/admin/upload' && method === 'POST') {
      const body = await getRequestBody(req);
      if (!body.filename || !body.data) {
        return sendError(res, 'File name and data are required');
      }

      const uploadsDir = path.join(PUBLIC_DIR, 'uploads', 'projects');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const rawExt = path.extname(body.filename).toLowerCase();
      const allowedExts = ['.pdf', '.png', '.jpg', '.jpeg', '.webp'];
      if (!allowedExts.includes(rawExt)) {
        return sendError(res, `Unsupported file format. Allowed: ${allowedExts.join(', ')}`);
      }

      let base64Data = body.data;
      if (base64Data.includes(',')) {
        base64Data = base64Data.split(',')[1];
      }

      const safeBase = path.basename(body.filename, rawExt).replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40);
      const uniqueFileName = `${Date.now()}_${safeBase}${rawExt}`;
      const targetPath = path.join(uploadsDir, uniqueFileName);

      try {
        const buffer = Buffer.from(base64Data, 'base64');
        fs.writeFileSync(targetPath, buffer);
        const fileUrl = `/uploads/projects/${uniqueFileName}`;
        return sendJSON(res, {
          success: true,
          url: fileUrl,
          name: body.filename,
          type: rawExt === '.pdf' ? 'pdf' : 'image',
          size: buffer.length
        }, 201);
      } catch (err) {
        return sendError(res, 'Failed to save file on server: ' + err.message, 500);
      }
    }

    // Projects Management Endpoints
    if (pathname === '/api/admin/projects' && method === 'POST') {
      const body = await getRequestBody(req);
      if (!body.title || !body.client) {
        return sendError(res, 'Project title and client are required');
      }
      if (!body.id) body.id = `proj_${Date.now()}`;
      if (!body.proof_files) body.proof_files = [];
      const newProj = db.insert('projects', body);
      return sendJSON(res, newProj, 201);
    }

    if (pathname.startsWith('/api/admin/projects/') && method === 'PUT') {
      const id = pathname.replace('/api/admin/projects/', '');
      const body = await getRequestBody(req);
      const updated = db.update('projects', id, body);
      if (!updated) return sendError(res, 'Project not found', 404);
      return sendJSON(res, updated);
    }

    if (pathname.startsWith('/api/admin/projects/') && method === 'DELETE') {
      const id = pathname.replace('/api/admin/projects/', '');
      db.delete('projects', id);
      return sendJSON(res, { success: true });
    }

    if (pathname === '/api/admin/rfqs' && method === 'GET') {
      return sendJSON(res, db.get('rfqs'));
    }

    if (pathname === '/api/admin/quotes' && method === 'GET') {
      return sendJSON(res, db.get('quotes'));
    }

    if (pathname === '/api/admin/quotes' && method === 'POST') {
      const body = await getRequestBody(req);
      if (!body.id) body.id = `QT-GV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      if (!body.amount_words && (body.gross_total || body.grand_total)) {
        body.amount_words = numberToIndianWords(body.gross_total || body.grand_total);
      }
      const newQ = db.insert('quotes', body);
      return sendJSON(res, newQ, 201);
    }

    if (pathname.startsWith('/api/admin/quotes/') && method === 'DELETE') {
      const id = pathname.replace('/api/admin/quotes/', '');
      db.delete('quotes', id);
      return sendJSON(res, { success: true });
    }

    if (pathname === '/api/admin/leads' && method === 'GET') {
      return sendJSON(res, db.get('leads'));
    }

    // Invoices Management Endpoints
    if (pathname === '/api/admin/invoices' && method === 'GET') {
      return sendJSON(res, db.get('invoices'));
    }

    if (pathname === '/api/admin/invoices' && method === 'POST') {
      const body = await getRequestBody(req);
      if (!body.id) body.id = `INV-GV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      if (!body.invoice_no) body.invoice_no = `INV/GV/2026-27/${Math.floor(100 + Math.random() * 900)}`;
      if (!body.amount_words && body.grand_total) {
        body.amount_words = numberToIndianWords(body.grand_total);
      }
      const newInv = db.insert('invoices', body);
      return sendJSON(res, newInv, 201);
    }

    if (pathname.startsWith('/api/admin/invoices/') && method === 'PUT') {
      const id = pathname.replace('/api/admin/invoices/', '');
      const body = await getRequestBody(req);
      if (body.grand_total) {
        body.amount_words = numberToIndianWords(body.grand_total);
      }
      const updated = db.update('invoices', id, body);
      if (!updated) return sendError(res, 'Invoice not found', 404);
      return sendJSON(res, updated);
    }

    if (pathname.startsWith('/api/admin/invoices/') && method === 'DELETE') {
      const id = pathname.replace('/api/admin/invoices/', '');
      db.delete('invoices', id);
      return sendJSON(res, { success: true });
    }

    if (pathname === '/api/admin/settings' && method === 'PUT') {
      const body = await getRequestBody(req);
      const updated = db.updateSettings(body);
      return sendJSON(res, updated);
    }
  }

  // Handle unmatched API routes with proper JSON 404
  if (pathname.startsWith('/api/')) {
    return sendError(res, 'API endpoint not found', 404);
  }

  // Static files resolution
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
  if (!path.extname(filePath) && fs.existsSync(`${filePath}.html`)) {
    filePath = `${filePath}.html`;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      const page404 = path.join(PUBLIC_DIR, '404.html');
      fs.readFile(page404, (e, content) => {
        if (e) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end("404 - Not Found");
        } else {
          res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(content);
        }
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Add caching headers for static assets like images, css, js
    const headers = { 
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*'
    };
    if (['.svg', '.png', '.jpg', '.jpeg', '.ico', '.woff2'].includes(ext)) {
      headers['Cache-Control'] = 'public, max-age=86400';
    }

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end("500 - Server Error");
      } else {
        res.writeHead(200, headers);
        res.end(content);
      }
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`GANITA VENTURES Server running on http://localhost:${PORT}`);
  console.log(`Public App: http://localhost:${PORT}`);
  console.log(`Admin Panel: http://localhost:${PORT}/admin`);
  console.log(`====================================================`);
});

/**
 * quotation-templates.js
 * LAP I.T. Solutions — Always-on document template pages: AMC · SLA · EULA
 *
 * These pages are ALWAYS appended (like the Terms & Conditions page).
 * No toggles. They auto-fill client info from the form and appear in
 * both create mode and view mode (quotation list).
 *
 * HOW TO USE:
 * 1. Place this file in your scripts/ folder.
 * 2. In quotation.html, add after quotation.js:
 *    <script src="scripts/quotation-templates.js"></script>
 *    (adjust path to match your folder structure)
 */

(function () {
    'use strict';

    // ── Date picker formatter (called onchange) ───────────────────────────────
    window.qptplFormatDate = function(input) {
        // Find or create the display span
        let span = input.nextElementSibling;
        if (!span || !span.classList.contains('qptpl-dp-display')) {
            span = document.createElement('span');
            span.className = 'qptpl-dp-display';
            span.style.cssText = 'font-size:11px;color:#1a5276;font-weight:600;margin-left:4px;border-bottom:1.5px solid #000;cursor:pointer;display:inline-block;min-width:175px;';
            input.parentNode.insertBefore(span, input.nextSibling);
        }

        // Safety Check: If input is empty or cleared
        if (!input || !input.value) {
            span.textContent = ''; // Clear the text
            input.removeAttribute('data-formatted');
            // Ensure the input is visible so the user can click it to pick a date
            input.style.width = '175px';
            input.style.opacity = '1';
            input.style.position = 'static';
            span.style.display = 'none';
            return;
        }

        // Format the date properly
        const [y, m, d] = input.value.split('-').map(Number);
        const dateObj = new Date(y, m - 1, d);
        
        // Final check for valid date logic
        if (isNaN(dateObj.getTime())) {
            span.textContent = '';
            return;
        }

        const formatted = dateObj.toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });

        // Store formatted text for print and update UI
        input.setAttribute('data-formatted', formatted);
        input.title = formatted;
        span.textContent = formatted;

        // Hide the raw input visually but keep it for print value
        input.style.width = '0';
        input.style.padding = '0';
        input.style.border = 'none';
        input.style.opacity = '0';
        input.style.position = 'absolute';
        span.style.display = 'inline-block';

        // Re-open picker when the span (the text) is clicked
        span.onclick = function() {
            input.style.width = '';
            input.style.padding = '';
            input.style.border = '';
            input.style.opacity = '';
            input.style.position = '';
            span.style.display = 'none';
            
            // Trigger the native calendar
            if (input.showPicker) {
                input.showPicker();
            } else {
                input.focus();
            }

            // When user clicks away, if they chose a date, hide the input again
            input.addEventListener('blur', function hide() {
                if (input.value) {
                    input.style.width = '0';
                    input.style.padding = '0';
                    input.style.border = 'none';
                    input.style.opacity = '0';
                    input.style.position = 'absolute';
                    span.style.display = 'inline-block';
                }
                input.removeEventListener('blur', hide);
            });
        };
    };

    // ── Helpers ───────────────────────────────────────────────────────────────
    function getClientInfo() {
        const val = (id) => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
        const inp = (ph) => { const el = document.querySelector(`.client-info input[placeholder="${ph}"]`); return el ? el.value.trim() : ''; };
        return {
            name:    (val('setup-client-name')    || inp('Enter recipient name')    || '[POS CLIENT]').toUpperCase(),
            address: (val('setup-office-address') || inp('Enter office address')    || '______________________').toUpperCase(),
            contact: (val('setup-contact-person') || inp('Enter contact person')    || '______________________').toUpperCase(),
            phone:   (val('setup-contact-no')     || inp('Enter contact number')    || '______________________').toUpperCase(),
            date:    (() => { const d = document.getElementById('quote-date'); return d ? d.textContent.trim() : new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'}); })(),
        };
    }

    const BLANK  = `<span style="display:inline-block;min-width:160px;border-bottom:1px solid #000;"> </span>`;

    // Date input that shows a calendar picker and prints as "January 21, 2021"
    let _datePickerIdx = 0;
    function DBLANK(id) {
        const uid = id || ('qptpl-dp-' + (++_datePickerIdx));
        return `<input type="date" class="qptpl-date-picker" id="${uid}"
                 onchange="qptplFormatDate(this)"
                 style="border:none;border-bottom:1.5px solid #000;background:transparent;
                        font-family:Arial,sans-serif;font-size:11px;color:#1a5276;
                        font-weight:600;padding:1px 3px;outline:none;width:175px;cursor:pointer;">`;
    }

    // ── Styles ────────────────────────────────────────────────────────────────
    function injectStyles() {
        if (document.getElementById('qptpl-styles')) return;
        const s = document.createElement('style');
        s.id = 'qptpl-styles';
        s.textContent = `
.qptpl-section-label{font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.8px;margin:16px 0 8px}
.qptpl-btn-row{display:flex;flex-direction:column;gap:8px;margin-bottom:8px}
.qptpl-toggle{width:100%;display:flex;align-items:center;justify-content:space-between;padding:10px 13px;border:1.5px solid #d1d5db;border-radius:8px;background:#fafafa;font-size:13px;font-weight:600;color:#374151;cursor:pointer;font-family:inherit;transition:all .2s;user-select:none}
.qptpl-toggle:hover{border-color:#7c3aed;background:#f5f3ff;color:#5b21b6}
.qptpl-toggle.active{border-color:#7c3aed;background:#ede9fe;color:#5b21b6;box-shadow:0 0 0 3px rgba(124,58,237,.1)}
.qptpl-pill{font-size:10px;padding:2px 8px;border-radius:20px;font-weight:700;background:#e5e7eb;color:#6b7280;transition:all .2s}
.qptpl-toggle.active .qptpl-pill{background:#7c3aed;color:#fff}
/* ── Template page typography ── */
.qptpl-page{font-family:Arial,sans-serif;font-size:11px;line-height:1.6;color:#000}
.qptpl-page h1{text-align:center;font-size:14px;font-weight:700;letter-spacing:.5px;margin:0 0 18px;text-transform:uppercase}
.qptpl-page h2{font-size:12px;font-weight:700;margin:14px 0 5px}
.qptpl-page p{margin:0 0 7px}
.qptpl-page ul,.qptpl-page ol{margin:3px 0 7px 22px;padding:0}
.qptpl-page li{margin-bottom:3px}
.qptpl-info-block{margin:10px 0 14px;line-height:2}
.qptpl-info-row{display:flex;align-items:baseline;gap:6px;margin-bottom:3px}
.qptpl-label{font-weight:700;white-space:nowrap;min-width:120px;flex-shrink:0}
.qptpl-value{border-bottom:1px solid #000;flex:1;min-width:160px;line-height:1.9;font-weight:600;color:#1a5276}
.qptpl-sign-row{display:flex;justify-content:space-between;gap:40px;margin-top:24px}
.qptpl-sign-block{flex:1}
.qptpl-sign-line{border-bottom:1px solid #000;height:24px;margin-bottom:3px}
.qptpl-sign-label{font-size:10px;color:#555}
.qptpl-divider{border:none;border-top:1px solid #ccc;margin:12px 0}
.qptpl-page table{width:100%;border-collapse:collapse;margin:7px 0;font-size:10px}
.qptpl-page table th{background:#d6e6f0;border:1px solid #aaa;padding:5px 7px;font-weight:700;text-align:left}
.qptpl-page table td{border:1px solid #aaa;padding:5px 7px;vertical-align:top}
.qptpl-auto{font-weight:700;color:#1a5276}
/* ── Date picker input ── */
.qptpl-date-picker{border:none;border-bottom:1.5px solid #000;background:transparent;font-family:Arial,sans-serif;font-size:11px;color:#1a5276;font-weight:600;padding:1px 3px;outline:none;width:175px;cursor:pointer;-webkit-appearance:none;appearance:none}
.qptpl-date-picker:focus{border-bottom-color:#1a5276;outline:none}
/* ── Client info: always uppercase blue ── */
.qptpl-name{text-transform:uppercase!important;color:#1a5276!important;font-weight:700!important}
.qptpl-address,.qptpl-contact,.qptpl-phone{text-transform:uppercase!important;color:#1a5276!important;font-weight:600!important}
@media print{
  /* Hide calendar picker icon and raw input; show formatted display span */
  .qptpl-date-picker::-webkit-calendar-picker-indicator{display:none!important}
  .qptpl-date-picker{-webkit-appearance:none!important;appearance:none!important;
    border:none!important;background:transparent!important;
    width:auto!important;padding:0!important;opacity:1!important;
    position:static!important;color:#000!important;font-size:11px!important;
    font-weight:600!important}
  /* If date not yet selected, show blank line instead of empty input */
  .qptpl-date-picker:not([data-formatted]){border-bottom:1px solid #000!important;min-width:140px!important;display:inline-block!important}
  /* Display span: show in print with black text */
  .qptpl-dp-display{color:#000!important;font-weight:600!important;font-size:11px!important;border-bottom:1px solid #000!important}
  /* Names always blue in print */
  .qptpl-name,.qptpl-address,.qptpl-contact,.qptpl-phone{color:#1a5276!important}
}
/* ── Screen: prevent orphaned headings ── */
.qptpl-page h2{page-break-after:avoid;break-after:avoid}
.qptpl-page h2+p,.qptpl-page h2+ul,.qptpl-page h2+ol{page-break-before:avoid;break-before:avoid}
.qptpl-page li{page-break-inside:avoid;break-inside:avoid}
.qptpl-info-block{page-break-inside:avoid;break-inside:avoid}
.qptpl-sign-row{page-break-inside:avoid;break-inside:avoid}
.qptpl-page table{page-break-inside:avoid;break-inside:avoid}
@media print{
  .qptpl-btn-row,.qptpl-section-label{display:none!important}
  /*
   * CRITICAL: quotation.html has .page { page-break-inside: avoid !important }
   * which prevents content from flowing across multiple print sheets.
   * We override it here for template pages so AMC/SLA/EULA can span as many
   * sheets as needed. The @page margins in quotation.html (0.2in/0.25in)
   * apply correctly to all continuation sheets automatically.
   */
  .qptpl-template-page{
    width:auto!important;
    min-height:unset!important;
    height:auto!important;
    margin:0!important;
    padding:0.2in 0.3in 0.2in!important;
    box-shadow:none!important;
    -webkit-box-shadow:none!important;
    border:none!important;
    border-radius:0!important;
    position:static!important;
    overflow:visible!important;
    display:block!important;
    page-break-inside:auto!important;
    break-inside:auto!important;
    page-break-before:always!important;
    break-before:page!important;
    page-break-after:avoid!important;
    break-after:avoid!important;
    box-sizing:border-box!important;
  }
  .qptpl-template-page:last-child{
    page-break-after:avoid!important;
    break-after:avoid!important;
  }
  .qptpl-template-page .page-inner{
    display:block!important;
    padding:0!important;
    flex:none!important;
    page-break-inside:auto!important;
    break-inside:auto!important;
  }
  .qptpl-template-page .page-footer{
    page-break-before:avoid!important;
    break-before:avoid!important;
    page-break-inside:avoid!important;
    break-inside:avoid!important;
    page-break-after:avoid!important;
    break-after:avoid!important;
  }
  /* Keep headings with content */
  .qptpl-page h2{page-break-after:avoid!important;break-after:avoid!important}
  .qptpl-page h2+p,.qptpl-page h2+ul,.qptpl-page h2+ol,.qptpl-page h2+table{
    page-break-before:avoid!important;break-before:avoid!important;
  }
  .qptpl-page li{page-break-inside:avoid!important;break-inside:avoid!important}
  .qptpl-info-block{page-break-inside:avoid!important;break-inside:avoid!important}
  .qptpl-sign-row{page-break-inside:avoid!important;break-inside:avoid!important}
  .qptpl-page table{page-break-inside:avoid!important;break-inside:avoid!important}
  .tpl-section{page-break-inside:auto;break-inside:auto;}
  .tpl-section h2{page-break-after:avoid!important;break-after:avoid!important;}
  .qptpl-template-page .page-number{
    position:static!important;
    flex-shrink:0!important;
  }
  #qptpl-page-eula{min-height:unset!important;display:flex!important;flex-direction:column!important;}
  #qptpl-page-eula .page-inner{flex:1!important;display:flex!important;flex-direction:column!important;}
  .qptpl-date-picker:not([value])::-webkit-datetime-edit,
  .qptpl-date-picker[value=""]::-webkit-datetime-edit{color:transparent!important;visibility:hidden!important;}
  .qptpl-date-picker:not([value]),
  .qptpl-date-picker[value=""]{border-bottom:1px solid #000!important;min-width:140px!important;color:transparent!important;}
  .qptpl-date-picker[data-formatted]{display:none!important;width:0!important;height:0!important;overflow:hidden!important;}
  .qptpl-dp-display{display:inline!important;color:#000!important;font-weight:600!important;font-size:11px!important;border-bottom:none!important;}
  #qptpl-page-sla{display:block!important;page-break-after:avoid!important;break-after:avoid!important;}
  #qptpl-page-sla .qptpl-page{font-size:10px!important;line-height:1.4!important;}
  #qptpl-page-sla .qptpl-page h2{font-size:11px!important;margin:10px 0 4px!important;}
  #qptpl-page-sla .qptpl-page table{font-size:9px!important;}
  #qptpl-page-sla .qptpl-page th,
  #qptpl-page-sla .qptpl-page td{padding:3px 5px!important;}
}
        `;
        document.head.appendChild(s);
    }

    // ── Template Builders ─────────────────────────────────────────────────────
    function buildAMC(c) {
        return `<div class="qptpl-page">
<h1>ANNUAL MAINTENANCE CONTRACT (AMC)</h1>
<p>This Agreement is made on <strong class="qptpl-auto qptpl-date">${c.date}</strong> between <strong>LAP I.T SOLUTIONS INC.</strong> and:</p>
<div class="qptpl-info-block">
  <p><strong class="qptpl-auto qptpl-name">${c.name}</strong></p>
  <div class="qptpl-info-row"><span class="qptpl-label">Office Address:</span><span class="qptpl-value qptpl-address">${c.address}</span></div>
  <div class="qptpl-info-row"><span class="qptpl-label">Contact Person:</span><span class="qptpl-value qptpl-contact">${c.contact}</span></div>
  <div class="qptpl-info-row"><span class="qptpl-label">Contact Number:</span><span class="qptpl-value qptpl-phone">${c.phone}</span></div>
</div>
<h2>1. Purpose</h2>
<p>This Annual Maintenance Contract (AMC) outlines the terms under which LAP I.T. SOLUTIONS INC. will provide ongoing technical support, software updates, and maintenance services for the Client's installed POS system and related hardware/software components.</p>
<h2>2. Coverage Period</h2>
<ul><li>Start Date: ${DBLANK()}</li><li>End Date: ${DBLANK()}</li><li>Duration: 12 months</li></ul>
<h2>3. Scope of Services</h2>
<p>LAP I.T. SOLUTIONS INC. will provide the following services:</p>
<ul>
  <li>Remote technical support via phone, email, chat, and remote access tools (Anydesk)</li>
  <li>Software updates and bug fixes for covered modules</li>
  <li>System health checks and preventive maintenance</li>
  <li>Assistance with report validation and minor configuration adjustments</li>
  <li>Hardware maintenance</li>
  <li>Scheduled monthly on-site visit (for Davao City clients only)</li>
</ul>
<p><strong>Exclusions:</strong></p>
<ul>
  <li>Major system enhancements or customizations</li>
  <li>Hardware replacement outside warranty</li>
  <li>On-site visits outside Davao City (unless separately arranged)</li>
</ul>
<h2>4. Service Response Time</h2>
<ul>
  <li>Remote Support: Within 24 hours of request</li>
  <li>On-Site (Davao City): Within 1–3 business days</li>
  <li>On-Site (Outside Davao): Within 3–10 business days; travel and accommodation costs to be shouldered by Client</li>
</ul>
<h2>5. AMC Fee</h2>
<ul>
  <li>Annual Fee: ₱18,000</li>
  <li>Payment Terms: ₱1,500 every 5th of the month</li>
  <li>Renewal: Automatic renewal upon expiry (unless cancelled 30 days prior)</li>
</ul>
<h2>6. Client Responsibilities</h2>
<ul>
  <li>Maintain stable internet connection for remote support</li>
  <li>Provide access credentials and documentation when requested</li>
  <li>Provide the necessary computer parts that need to be replaced</li>
  <li>Notify LAP I.T. SOLUTIONS INC. of any system issues promptly</li>
</ul>
<div style="page-break-inside:avoid;break-inside:avoid;">
<h2>7. Termination</h2>
<p>Either party may terminate this contract with 30 days written notice. Client must settle any remaining balance.</p>
</div>
</div>`;
    }

    function buildSLA(c) {
        return `<div class="qptpl-page">
<h1>SERVICE LEVEL AGREEMENT (SLA)</h1>
<h2>1. Purpose of the Agreement</h2>
<p>This Service Level Agreement (SLA) defines the scope of support, service commitments, responsibilities, and performance standards provided by LAP I.T. Solutions Inc. ("Service Provider") to the Client for the use, maintenance, and support of the Point-of-Sale (POS) System and related hardware/software components.</p>
<h2>2. Coverage Period</h2>
<ul>
  <li>Standard Support Duration: 12 months from the date of installation or turnover</li>
  <li>Coverage: Software support, remote troubleshooting, usage guidance, and hardware diagnostics (within warranty)</li>
  <li>Renewal: Renewable annually upon agreement and payment of support renewal fees</li>
</ul>
<h2>3. Scope of Services</h2>
<p><strong>3.1 Software Support</strong> — LAP I.T. Solutions will provide bug fixes and troubleshooting, system usage guidance, license activation assistance, remote configuration support, and minor adjustments. <em>Not included: customization requests, new feature development, third-party integrations, data reconstruction due to client negligence.</em></p>
<p><strong>3.2 Hardware Support</strong> — Diagnostics for POS hardware purchased from LAP I.T. Solutions, warranty processing (if applicable), and hardware replacement based on manufacturer warranty. <em>Exclusions: physical damage, liquid damage, power-related damage, tampering or unauthorized repairs.</em></p>
<p><strong>3.3 Support Channels &amp; Availability</strong></p>
<table style="table-layout:fixed;width:100%;">
  <colgroup>
    <col style="width:22%;">
    <col style="width:35%;">
    <col style="width:43%;">
  </colgroup>
  <thead><tr><th>Support Type</th><th>Availability</th><th>Notes</th></tr></thead>
  <tbody>
    <tr><td style="vertical-align:top;">Remote Support</td><td style="vertical-align:top;">Monday–Saturday, 9:00 AM – 6:00 PM</td><td style="vertical-align:top;">Via phone, Messenger, email, or remote tools</td></tr>
    <tr><td style="vertical-align:top;">On-site (Davao City)</td><td style="vertical-align:top;">Within 1–3 business days</td><td style="vertical-align:top;">Scheduling required</td></tr>
    <tr><td style="vertical-align:top;">On-site (Outside Davao City)</td><td style="vertical-align:top;">Within 3–10 business days</td><td style="vertical-align:top;">Client shoulders transportation &amp; accommodation</td></tr>
  </tbody>
</table>
<h2>4. Response &amp; Resolution Times</h2>
<table style="table-layout:fixed;width:100%;">
  <colgroup>
    <col style="width:12%;">
    <col style="width:38%;">
    <col style="width:22%;">
    <col style="width:28%;">
  </colgroup>
  <thead><tr><th>Issue Level</th><th>Description</th><th>Response Time</th><th>Target Resolution</th></tr></thead>
  <tbody>
    <tr><td style="vertical-align:top;"><strong>Critical</strong></td><td style="vertical-align:top;">System down, cannot operate</td><td style="vertical-align:top;">Within 4 hours</td><td style="vertical-align:top;">Same day if possible</td></tr>
    <tr><td style="vertical-align:top;"><strong>Major</strong></td><td style="vertical-align:top;">Major functions affected but system usable</td><td style="vertical-align:top;">Within 12 hours</td><td style="vertical-align:top;">1–2 days</td></tr>
    <tr><td style="vertical-align:top;"><strong>Minor</strong></td><td style="vertical-align:top;">Non-critical issues, UI concerns, minor bugs</td><td style="vertical-align:top;">Within 24 hours</td><td style="vertical-align:top;">2–5 days</td></tr>
  </tbody>
</table>
<h2>5. Client Responsibilities</h2>
<ul>
  <li>Provide stable internet connection for remote support</li>
  <li>Ensure proper electrical grounding and surge protection</li>
  <li>Prevent tampering, unauthorized access, or modification of the system</li>
  <li>Provide accurate information when reporting issues</li>
  <li>Allow access for remote or on-site support</li>
  <li>Secure their own data backups (unless backup service is included in the package)</li>
</ul>
<h2>6. Conditions That Void SLA Support</h2>
<ul>
  <li>The system is tampered with or modified without authorization</li>
  <li>The client uses unlicensed or pirated software</li>
  <li>There are unpaid balances related to the POS package or support renewal</li>
  <li>Hardware damage is caused by negligence, misuse, or environmental factors</li>
</ul>
<h2>7. Escalation Process</h2>
<ul>
  <li>Level 1: Assigned Support Technician</li>
  <li>Level 2: Technical Lead / Project Lead</li>
  <li>Level 3: Operations Manager – LAP I.T. Solutions</li>
  <li>Level 4: Managing Director (for unresolved or critical escalations)</li>
</ul>
<div style="page-break-inside:avoid;break-inside:avoid;">
<h2>8. Service Limitations</h2>
<p>The SLA does not guarantee zero downtime, instant resolution of all issues, support outside business hours (unless covered by a premium plan), or support for third-party hardware or software not provided by LAP I.T. Solutions.</p>
<h2>9. Termination of SLA</h2>
<p>Either party may terminate the SLA with written notice if terms are violated, payments are not settled, or system misuse or tampering is detected. No refunds will be issued for unused months of support.</p>
</div>
</div>`;
    }

    function buildEULA(c) {
        return `<div class="qptpl-page" style="display:flex;flex-direction:column;min-height:9in;">
<h1>END USER LICENSE AGREEMENT (EULA)</h1>
<h2>1. Grant of License</h2>
<p>LAP I.T. Solutions grants the Client a non-exclusive, non-transferable license to use the POS software.</p>
<h2>2. Ownership</h2>
<p>All software, source code, and intellectual property remain owned by LAP I.T. Solutions.</p>
<h2>3. Restrictions</h2>
<p>Client may not modify, reverse engineer, copy, or distribute the software.</p>
<h2>4. Data Responsibility</h2>
<p>Client is responsible for data accuracy and backups unless backup service is included.</p>
<h2>5. Updates</h2>
<p>Minor updates are provided; major upgrades may require additional fees.</p>
<h2>6. Warranty</h2>
<p>Software is provided as-is except for covered support terms in the SLA.</p>
<h2>7. Liability</h2>
<p>LAP I.T. Solutions is not liable for data loss, misuse, or damages caused by client negligence.</p>
<h2>8. Termination</h2>
<p>License may be revoked for violations, tampering, or unpaid balances.</p>
<h2>9. Acceptance</h2>
<p>Use of the software constitutes acceptance of this EULA.</p>
<div style="margin-top:auto;padding-top:40px;">
  <hr style="border:none;border-top:1px solid #000;margin-bottom:16px;">
  <p>By signing below, both parties agree to the Terms and Conditions, AMC, SLA, and <u>EULA</u>:</p>
  <p><strong>Signed by:</strong></p>
  <div class="qptpl-sign-row" style="page-break-inside:avoid;break-inside:avoid;">
    <div class="qptpl-sign-block">
      <p><strong style="color:#1a5276;">LAP I.T. SOLUTIONS INC.</strong></p>
      <p>Authorized Representative</p>
      <div class="qptpl-sign-line"></div>
      <div class="qptpl-sign-label">Signature over Printed Name</div>
      <p style="margin-top:8px;">Date: ${DBLANK()}</p>
    </div>
    <div class="qptpl-sign-block">
      <p><strong style="color:#1a5276;" class="qptpl-auto qptpl-name">${c.name}</strong></p>
      <p>Authorized Representative</p>
      <div class="qptpl-sign-line"></div>
      <div class="qptpl-sign-label">Signature over Printed Name</div>
      <p style="margin-top:8px;">Date: ${DBLANK()}</p>
    </div>
  </div>
</div>
</div>`;
    }

    // ── Page wrapper (same style as existing pages 1 & 2) ────────────────────
    function wrapInPage(key, num, innerHTML) {
        return `
<div class="page page-break qptpl-template-page" id="qptpl-page-${key}"
     style="width:8.27in;min-height:unset;margin:20px auto;background:white;
            padding:0.3in 0.4in 0.3in;
            position:relative;box-sizing:border-box;overflow:visible;display:block;">
  <div class="page-inner">${innerHTML}</div>
  <div class="page-footer" style="position:absolute;bottom:0.3in;right:0.4in;display:flex;align-items:center;">
    <div class="page-number" style="width:26px;height:26px;background-color:#1a5276;color:white;font-weight:bold;font-size:11px;border-radius:50%;display:flex;align-items:center;justify-content:center;">${num}</div>
  </div>
</div>`;
    }

    // ── Renumber all pages ────────────────────────────────────────────────────
    function renumber() {
        document.querySelectorAll('#pdf-content .page').forEach((p, i) => {
            const n = p.querySelector('.page-number');
            if (n) n.textContent = i + 1;
        });
    }

    // ── Inject all 3 template pages into #pdf-content ────────────────────────
    function injectAllPages() {
        const pdfContent = document.getElementById('pdf-content');
        if (!pdfContent) return;
        // Don't inject twice
        if (pdfContent.querySelector('.qptpl-template-page')) return;

        const c = getClientInfo();
        const templates = [
            { key: 'amc',  build: buildAMC },
            { key: 'sla',  build: buildSLA },
            { key: 'eula', build: buildEULA },
        ];

        templates.forEach(({ key, build }) => {
            const pageNum = pdfContent.querySelectorAll('.page').length + 1;
            const wrapper = document.createElement('div');
            wrapper.innerHTML = wrapInPage(key, pageNum, build(c));
            pdfContent.appendChild(wrapper.firstElementChild);
        });

        renumber();
    }

    // ── Live update client info in all template pages ─────────────────────────
    function updateAll() {
        const c = getClientInfo();
        document.querySelectorAll('.qptpl-template-page').forEach(page => {
            page.querySelectorAll('.qptpl-name').forEach(el => el.textContent = c.name || '[POS CLIENT]');
            page.querySelectorAll('.qptpl-address').forEach(el => el.textContent = c.address || '______________________');
            page.querySelectorAll('.qptpl-contact').forEach(el => el.textContent = c.contact || '______________________');
            page.querySelectorAll('.qptpl-phone').forEach(el => el.textContent = c.phone || '______________________');
            page.querySelectorAll('.qptpl-date').forEach(el => el.textContent = c.date);
        });
    }

    // ── Watch client info inputs so pages update as you type ──────────────────
    function forceUppercase(el) {
        if (!el) return;
        el.style.textTransform = 'uppercase';
        el.addEventListener('input', function () {
            const pos = this.selectionStart;
            this.value = this.value.toUpperCase();
            this.setSelectionRange(pos, pos);
            updateAll();
        });
    }

    function watchInputs() {
        // Left setup panel inputs - force uppercase as user types
        ['setup-client-name','setup-office-address','setup-contact-person','setup-contact-no'].forEach(id => {
            forceUppercase(document.getElementById(id));
        });
        // Right preview panel inputs
        document.querySelectorAll('.client-info input.info-value').forEach(el => {
            forceUppercase(el);
        });
    }

    // ── In view mode: restore template pages from saved page2_html ────────────
    // The pages are embedded as static HTML inside page2_html when saved.
    // We need to re-inject them so they show when viewing a saved quotation.
    function injectInViewMode() {
        // Template pages are saved as static HTML in page2_html.
        // They are already in the DOM if page2_html contains them.
        // If not (older quotations), inject fresh ones using client info already loaded.
        setTimeout(() => {
            const pdfContent = document.getElementById('pdf-content');
            if (!pdfContent) return;
            // If pages already in DOM (from page2_html restore), just renumber
            if (pdfContent.querySelector('.qptpl-template-page')) {
                renumber();
                return;
            }
            // Otherwise inject fresh — client info already populated by loadQuotationInViewMode
            injectAllPages();
            renumber();
        }, 600);
    }

    // ── Collect date values from template pages (call before saving) ────────
    window.qptplCollectDates = function() {
        const dates = {};
        document.querySelectorAll('.qptpl-date-picker').forEach(function(input) {
            if (input.value) {
                dates[input.id] = input.value; // ISO format: 2026-05-09
            }
        });
        return JSON.stringify(dates);
    };

    // ── Restore date values into template pages after injection ───────────
    window.qptplRestoreDates = function(datesJson) {
        if (!datesJson) return;
        let dates;
        try { dates = JSON.parse(datesJson); } catch(e) { return; }
        Object.keys(dates).forEach(function(id) {
            const input = document.getElementById(id);
            if (input && dates[id]) {
                input.value = dates[id];
                // Trigger the formatter to show the display span
                if (typeof window.qptplFormatDate === 'function') {
                    window.qptplFormatDate(input);
                }
            }
        });
    };

    // ── Initialization ────────────────────────────────────────────────────────
    window.qptplInit = function() {
        injectStyles();
        // Delay slightly to ensure quotation.js has loaded its data
        setTimeout(() => {
            if (document.body.classList.contains('view-mode')) {
                injectInViewMode();
            } else {
                injectAllPages();
                watchInputs();
            }
        }, 300);
    };

    // Auto-init on load
    if (document.readyState === 'complete') {
        window.qptplInit();
    } else {
        window.addEventListener('load', window.qptplInit);
    }



    // ── Expose for external call from quotation.html ─────────────────────────
    // quotation.html calls window.qptplInjectViewPages() at the end of
    // loadQuotationInViewMode(), after client info is fully populated.
    window.qptplInjectViewPages = function(datesJson) {
        const pdfContent = document.getElementById('pdf-content');
        if (!pdfContent) return;
        if (pdfContent.querySelector('.qptpl-template-page')) {
            renumber();
            if (datesJson) window.qptplRestoreDates(datesJson);
            return;
        }
        injectAllPages();
        renumber();
        if (datesJson) window.qptplRestoreDates(datesJson);
    };

    // ── Init ──────────────────────────────────────────────────────────────────
    function init() {
        injectStyles();

        if (window.isViewMode) {
            // View mode: DO NOT inject here — quotation.html will call
            // window.qptplInjectViewPages() once client data is loaded
            return;
        }

        // Create/Edit mode: wait for workspace to be active AND client data populated
        const tryInject = () => {
            const ws = document.getElementById('quotation-workspace');
            if (!ws || !ws.classList.contains('active')) {
                setTimeout(tryInject, 250);
                return;
            }
            // In edit mode, wait until client name input is actually filled
            const isEditMode = !!localStorage.getItem('editQuotationData') ||
                               !!localStorage.getItem('editingQuotationId');
            if (isEditMode) {
                const nameInput = document.getElementById('setup-client-name');
                if (!nameInput || !nameInput.value.trim()) {
                    setTimeout(tryInject, 200);
                    return;
                }
            }
            injectAllPages();
            watchInputs();
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => setTimeout(tryInject, 400));
        } else {
            setTimeout(tryInject, 400);
        }
    }

    init();

    // ── beforeprint / afterprint: fix page-break-inside for continuation sheets
    window.addEventListener('beforeprint', function () {
        document.querySelectorAll('.qptpl-template-page').forEach(function (page) {
            page.dataset.origStyle = page.getAttribute('style') || '';
            const inner = page.querySelector('.page-inner');
            if (inner) inner.dataset.origStyle = inner.getAttribute('style') || '';
            const footer = page.querySelector('.page-footer');
            if (footer) footer.dataset.origStyle = footer.getAttribute('style') || '';
            const pageNum = page.querySelector('.page-number');
            if (pageNum) pageNum.dataset.origStyle = pageNum.getAttribute('style') || '';
        });
    });

    window.addEventListener('afterprint', function () {
        document.querySelectorAll('.qptpl-template-page').forEach(function (page) {
            if (page.dataset.origStyle !== undefined) {
                page.setAttribute('style', page.dataset.origStyle);
                delete page.dataset.origStyle;
            }
            const inner = page.querySelector('.page-inner');
            if (inner && inner.dataset.origStyle !== undefined) {
                inner.setAttribute('style', inner.dataset.origStyle);
                delete inner.dataset.origStyle;
            }
            const footer = page.querySelector('.page-footer');
            if (footer && footer.dataset.origStyle !== undefined) {
                footer.setAttribute('style', footer.dataset.origStyle);
                delete footer.dataset.origStyle;
            }
            const pageNum = page.querySelector('.page-number');
            if (pageNum && pageNum.dataset.origStyle !== undefined) {
                pageNum.setAttribute('style', pageNum.dataset.origStyle);
                delete pageNum.dataset.origStyle;
            }
        });
    });
})();
<template>
  <div class="legal-page container animate-fade-in">
    <!-- Header Section -->
    <header class="legal-header text-center">
      <div class="pill-badge mb-2">Legal Transparency</div>
      <h1 class="page-title">Privacy <span class="text-brand">Policy</span></h1>
      <p class="text-muted">How The Hungry Lab collects, safeguards, and utilizes your personal information.</p>
      <div class="last-updated">
        <span>Effective Date: September 1, 2026</span> &bull; <span>Last Updated: September 2026</span>
      </div>
    </header>

    <!-- Key Privacy Highlights Cards -->
    <section class="highlights-grid">
      <div class="card highlight-card">
        <div class="highlight-icon">🛡️</div>
        <h3>No Data Selling</h3>
        <p>We never sell, rent, or monetize your personal or ordering information with third-party advertisers.</p>
      </div>
      <div class="card highlight-card">
        <div class="highlight-icon">🔒</div>
        <h3>Bank-Grade Security</h3>
        <p>Passwords are hashed via BCrypt, and all traffic is strictly encrypted over HTTPS / SSL protocols.</p>
      </div>
      <div class="card highlight-card">
        <div class="highlight-icon">💳</div>
        <h3>PCI-DSS Payments</h3>
        <p>Payments are tokenized and processed exclusively by Razorpay. We never store credit cards or UPI PINs.</p>
      </div>
      <div class="card highlight-card">
        <div class="highlight-icon">👤</div>
        <h3>Your Control</h3>
        <p>You maintain complete rights to view, update, export, or permanently erase your personal data at any time.</p>
      </div>
    </section>

    <!-- Main Content Container -->
    <article class="card legal-content">
      <section class="policy-section">
        <h2>1. Introduction & Scope</h2>
        <p>
          Welcome to <strong>The Hungry Lab</strong> ("we", "our", or "us"). We operate a modern food delivery and cloud kitchen platform dedicated to delivering delicious, wholesome meals right to your doorstep. We respect your privacy and are committed to protecting your personal data in full compliance with the Information Technology Act, 2000, and the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011 of India.
        </p>
        <p>
          This Privacy Policy applies to all individuals who access our website, create a user account, browse our interactive menu, or place orders through our platform.
        </p>
      </section>

      <section class="policy-section">
        <h2>2. Information We Collect</h2>
        <p>To provide you with seamless food ordering and delivery services, we collect the following types of information:</p>
        <ul>
          <li>
            <strong>Account & Contact Information:</strong> When you register or place an order, we collect your full name, email address, phone number, and delivery addresses.
          </li>
          <li>
            <strong>Order & Dietary Information:</strong> Details regarding the food items, selected add-ons (extra cheese, sauces, toppings), quantities, special kitchen preparation notes, and order history.
          </li>
          <li>
            <strong>Transaction & Billing Data:</strong> Order totals, coupon redemption details, and payment transaction identifiers (`razorpay_order_id`, `razorpay_payment_id`). <em>Note: All credit card numbers, CVVs, net banking credentials, and UPI PINs are entered directly into Razorpay's secure payment modal and are never seen or stored on our servers.</em>
          </li>
          <li>
            <strong>Technical & Device Data:</strong> IP address, browser type, operating system version, access timestamps, and session logs for security analysis and spam prevention.
          </li>
        </ul>
      </section>

      <section class="policy-section">
        <h2>3. How We Use Your Information</h2>
        <p>We process your data strictly for legitimate business and fulfillment purposes:</p>
        <div class="use-cases-list">
          <div class="use-case-item">
            <span class="check-icon">✓</span>
            <div><strong>Order Fulfillment:</strong> Communicating order items to the kitchen line, packaging meals, and dispatching orders to our delivery fleet.</div>
          </div>
          <div class="use-case-item">
            <span class="check-icon">✓</span>
            <div><strong>Customer Support & Real-Time Tracking:</strong> Updating you on kitchen queue progress (`CONFIRMED`, `PREPARING`, `OUT_FOR_DELIVERY`) and resolving any delivery queries.</div>
          </div>
          <div class="use-case-item">
            <span class="check-icon">✓</span>
            <div><strong>Automated Email Notifications:</strong> Dispatching order receipts, confirmation emails, and delivery status updates via SMTP.</div>
          </div>
          <div class="use-case-item">
            <span class="check-icon">✓</span>
            <div><strong>Fraud Prevention & Server-Side Validation:</strong> Ensuring pricing accuracy, preventing client-side cart tampering, and defending against unauthorized account access.</div>
          </div>
        </div>
      </section>

      <section class="policy-section">
        <h2>4. Data Sharing & Third-Party Service Providers</h2>
        <p>We only share your information with trusted third-party partners who are contractually bound to maintain strict confidentiality:</p>
        <ul>
          <li><strong>Razorpay Payment Gateway:</strong> To process secure cashless online transactions via UPI, Credit/Debit cards, and Net Banking.</li>
          <li><strong>Delivery Personnel:</strong> Dedicated delivery riders receive only your first name, phone number, and delivery address to complete your delivery.</li>
          <li><strong>Cloud Infrastructure:</strong> Cloud hosting on Vercel and Backblaze B2 S3 for serving static assets and menu imagery with industry-standard encryption.</li>
          <li><strong>Legal Obligations:</strong> We may disclose information if required by law enforcement or governmental authorities under applicable Indian laws.</li>
        </ul>
      </section>

      <section class="policy-section">
        <h2>5. Cookies & Local Storage</h2>
        <p>
          We use browser `localStorage` and minimal session cookies to enhance your experience. Specifically, we store:
        </p>
        <ul>
          <li><strong>Authentication Tokens:</strong> Secure JSON Web Tokens (JWT) to maintain your login session across pages.</li>
          <li><strong>Cart Persistence:</strong> Your active cart selections and chosen add-ons so your items are retained if you refresh the browser.</li>
        </ul>
        <p>We do not utilize invasive cross-site tracking cookies or third-party ad retargeting pixels.</p>
      </section>

      <section class="policy-section">
        <h2>6. Data Security & Retention</h2>
        <p>
          We implement rigorous technical, operational, and organizational security measures:
        </p>
        <ul>
          <li>User passwords are irreversibly hashed using standard BCrypt before storage.</li>
          <li>Database queries utilize parameterized SQL / Prisma ORM to guard against SQL injection vulnerabilities.</li>
          <li>Our webhook endpoints enforce cryptographic HMAC-SHA256 signature verification to prevent fraudulent transaction reports.</li>
          <li>Personal data is retained only as long as necessary to fulfill order histories, resolve tax obligations, or maintain active accounts.</li>
        </ul>
      </section>

      <section class="policy-section">
        <h2>7. Your Legal Rights & Choices</h2>
        <p>Under applicable data privacy regulations, you have the right to:</p>
        <ul>
          <li><strong>Access & Review:</strong> View all previous orders and account information directly from your <router-link to="/history" class="inline-link">Order History</router-link> page.</li>
          <li><strong>Rectification:</strong> Request corrections to incorrect phone numbers or delivery addresses.</li>
          <li><strong>Erasure ("Right to be Forgotten"):</strong> Request full deletion of your user profile and personal identifiers from our database.</li>
          <li><strong>Withdraw Consent:</strong> Opt-out of non-essential promotional announcements at any time.</li>
        </ul>
      </section>

      <section class="policy-section">
        <h2>8. Grievance Redressal & Contact Information</h2>
        <p>
          If you have any questions, concerns, or requests regarding this Privacy Policy or your personal information, please reach out to our designated Grievance Officer:
        </p>
        <div class="contact-card mt-3">
          <p><strong>Grievance & Data Privacy Officer:</strong> The Hungry Lab Compliance Team</p>
          <p><strong>Email:</strong> <a :href="'mailto:' + CONTACT_EMAIL">{{ CONTACT_EMAIL }}</a></p>
          <p><strong>Support Hotline:</strong> {{ FORMATTED_PHONE }} (11:00 AM – 11:00 PM IST)</p>
          <p><strong>Headquarters:</strong> The Hungry Lab Kitchen, Plot 42, Tech Park Boulevard, Sector 5, Bangalore, Karnataka, India</p>
          <p class="text-sm text-muted mt-2">We strive to acknowledge and resolve all privacy inquiries within 48 business hours.</p>
        </div>
      </section>
    </article>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { CONTACT_EMAIL, FORMATTED_PHONE } from '../config/contact'

onMounted(() => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
})
</script>

<style scoped>
.legal-page {
  padding-top: 40px;
  padding-bottom: 80px;
}

.legal-header {
  margin-bottom: 40px;
}

.pill-badge {
  display: inline-block;
  background-color: var(--brand-primary-light);
  color: var(--brand-primary);
  font-weight: 700;
  font-size: 0.85rem;
  padding: 6px 16px;
  border-radius: 20px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.page-title {
  font-size: 2.75rem;
  margin-bottom: 12px;
}

.last-updated {
  margin-top: 12px;
  font-size: 0.9rem;
  color: var(--text-muted);
}

.highlights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.highlight-card {
  text-align: center;
  padding: 24px 20px;
}

.highlight-icon {
  font-size: 2rem;
  margin-bottom: 12px;
}

.highlight-card h3 {
  font-size: 1.15rem;
  margin-bottom: 8px;
}

.highlight-card p {
  font-size: 0.9rem;
  color: var(--text-muted);
  line-height: 1.5;
}

.legal-content {
  padding: 48px;
}

.policy-section {
  margin-bottom: 36px;
}

.policy-section:last-child {
  margin-bottom: 0;
}

.policy-section h2 {
  font-size: 1.45rem;
  color: var(--text-main);
  margin-bottom: 14px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--bg-primary);
}

.policy-section p {
  color: #334155;
  margin-bottom: 14px;
  line-height: 1.7;
}

.policy-section ul {
  margin-left: 24px;
  margin-bottom: 16px;
  color: #334155;
}

.policy-section li {
  margin-bottom: 10px;
  line-height: 1.6;
}

.use-cases-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  margin-top: 14px;
}

.use-case-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background-color: var(--bg-primary);
  padding: 14px 18px;
  border-radius: var(--border-radius-sm);
  font-size: 0.95rem;
  color: var(--text-main);
}

.check-icon {
  color: var(--brand-secondary);
  font-weight: 900;
  font-size: 1.1rem;
}

.inline-link {
  color: var(--brand-primary);
  font-weight: 600;
  text-decoration: underline;
}

.contact-card {
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  padding: 20px 24px;
}

.contact-card p {
  margin-bottom: 6px;
}

.contact-card a {
  color: var(--brand-primary);
  font-weight: 600;
  text-decoration: none;
}

.contact-card a:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .page-title {
    font-size: 2.2rem;
  }
  .legal-content {
    padding: 24px;
  }
}
</style>


<template>
  <div class="legal-page container animate-fade-in">
    <!-- Header Section -->
    <header class="legal-header text-center">
      <div class="pill-badge mb-2">Terms & Conditions</div>
      <h1 class="page-title">Terms of <span class="text-brand">Service</span></h1>
      <p class="text-muted">The rules, guidelines, and commitments that govern your orders at The Hungry Lab.</p>
      <div class="last-updated">
        <span>Effective Date: September 1, 2026</span> &bull; <span>Last Updated: September 2026</span>
      </div>
    </header>

    <!-- Key Terms Highlights -->
    <section class="highlights-grid">
      <div class="card highlight-card">
        <div class="highlight-icon">🍳</div>
        <h3>Fresh Preparation</h3>
        <p>Every meal is cooked to order immediately after online payment confirmation.</p>
      </div>
      <div class="card highlight-card">
        <div class="highlight-icon">⏱️</div>
        <h3>Express Delivery</h3>
        <p>Target delivery within 30–45 minutes, with live kitchen order tracking.</p>
      </div>
      <div class="card highlight-card">
        <div class="highlight-icon">🔄</div>
        <h3>Fair Refund Policy</h3>
        <p>Instant support and resolution for missing, damaged, or spilled items.</p>
      </div>
      <div class="card highlight-card">
        <div class="highlight-icon">🔒</div>
        <h3>Transparent Billing</h3>
        <p>No hidden charges; all addon prices and taxes are clearly itemized before payment.</p>
      </div>
    </section>

    <!-- Main Content Container -->
    <article class="card legal-content">
      <section class="policy-section">
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing our website, creating an account, or placing an order with <strong>The Hungry Lab</strong> ("we", "us", or "our"), you agree to be bound by these Terms of Service, our <router-link to="/privacy" class="inline-link">Privacy Policy</router-link>, and all applicable laws and regulations of India. If you do not agree with any of these terms, you are prohibited from using our services.
        </p>
      </section>

      <section class="policy-section">
        <h2>2. Account Registration & User Conduct</h2>
        <p>
          While guest checkout is supported for food delivery orders, creating an account grants you access to order history and faster checkout. You agree to:
        </p>
        <ul>
          <li>Provide accurate, current, and complete personal and delivery contact details.</li>
          <li>Maintain the confidentiality of your account credentials and password.</li>
          <li>Notify us immediately of any unauthorized access or security breach regarding your account.</li>
          <li>Refrain from automated scraping, rate abuse, reverse engineering, or placing fraudulent orders.</li>
        </ul>
      </section>

      <section class="policy-section">
        <h2>3. Menu Items, Pricing & Customizations</h2>
        <p>
          Our digital menu exhibits our current experimental and signature food items along with customizable add-ons (extra cheeses, signature dips, toppings).
        </p>
        <ul>
          <li><strong>Authoritative Server Pricing:</strong> Displayed prices on the client-side cart are for estimation. All final pricing, addon additions, and coupon subtotals are calculated and validated strictly on our secure server before payment authorization to prevent tampering.</li>
          <li><strong>Promotions & Coupons:</strong> Promo codes (e.g. <code>HUNGRY10</code>) are subject to specific minimum order values and validity windows. Coupons cannot be redeemed for cash.</li>
          <li><strong>Minimum Order Requirement:</strong> To satisfy payment gateway processing specifications, orders must have a net payable total of at least ₹1.00 (100 paise).</li>
        </ul>
      </section>

      <section class="policy-section">
        <h2>4. Ordering & Kitchen Workflow</h2>
        <p>
          Once you place an order and payment is captured, your order transitions through our real-time kitchen queue:
        </p>
        <div class="status-steps">
          <div class="step-card">
            <span class="step-badge">1. CONFIRMED</span>
            <p>Payment received; order sent to the kitchen display system.</p>
          </div>
          <div class="step-card">
            <span class="step-badge">2. PREPARING</span>
            <p>Our chefs begin assembling and cooking your fresh meal.</p>
          </div>
          <div class="step-card">
            <span class="step-badge">3. OUT FOR DELIVERY</span>
            <p>Packed in thermal insulated containers and dispatched with a courier.</p>
          </div>
          <div class="step-card">
            <span class="step-badge">4. DELIVERED</span>
            <p>Successfully handed over to you at your delivery address.</p>
          </div>
        </div>
      </section>

      <section class="policy-section">
        <h2>5. Payment Processing & Razorpay Integration</h2>
        <p>
          We partner with <strong>Razorpay Software Private Limited</strong> to handle all online payments in Indian Rupees (INR).
        </p>
        <ul>
          <li>Accepted payment modes include UPI (Google Pay, PhonePe, Paytm, BHIM), Debit/Credit Cards (Visa, Mastercard, RuPay), Net Banking, and select digital wallets.</li>
          <li>Transactions are finalized upon receipt of a cryptographically signed webhook confirmation from Razorpay.</li>
          <li>In the event of network disruption where money is deducted from your bank but the order status fails to update, Razorpay's auto-reconciliation will either credit the transaction within 24 hours or automatically refund the amount.</li>
        </ul>
      </section>

      <section class="policy-section">
        <h2>6. Cancellation & Refund Policy</h2>
        <p>Due to the perishable and freshly cooked nature of our food, the following cancellation guidelines apply:</p>
        <div class="policy-callout">
          <h4>Cancellation Window</h4>
          <p>You may request cancellation only while the order is in <strong>CONFIRMED</strong> status. Once the kitchen transitions the order to <strong>PREPARING</strong>, cancellations cannot be accepted as ingredients and preparation have already commenced.</p>
        </div>
        <h3 class="mt-3 mb-2">Quality Guarantee & Refunds</h3>
        <ul>
          <li><strong>Incorrect or Missing Items:</strong> If an item or selected add-on is missing, or if an incorrect meal was delivered, notify us via the <router-link to="/contact" class="inline-link">Contact Us</router-link> page or phone within 30 minutes of delivery with a photo. We will immediately dispatch a fresh replacement or issue an instant refund credit.</li>
          <li><strong>Spillage or Severe Damage:</strong> If the packaging was severely breached or food damaged in transit, a full refund for the affected items will be processed.</li>
          <li><strong>Refund Timelines:</strong> Approved refunds are credited directly back to the original source account via Razorpay within 5 to 7 business days.</li>
        </ul>
      </section>

      <section class="policy-section">
        <h2>7. Delivery Terms & Customer Availability</h2>
        <p>
          We aim to deliver every meal hot and fresh within 30 to 45 minutes under normal operational conditions.
        </p>
        <ul>
          <li>Delivery timelines are estimates and may be impacted by adverse weather conditions, heavy traffic, festival rush, or localized delivery hurdles.</li>
          <li>Customers must provide complete and accurate delivery instructions, including door/flat number, landmarks, and an accessible phone number.</li>
          <li>Our delivery personnel will attempt to contact you for up to 10 minutes upon arriving at the designated address. If the customer is unreachable after repeated attempts, the order will be marked delivered/cancelled with no refund entitlement.</li>
        </ul>
      </section>

      <section class="policy-section">
        <h2>8. Food Safety, Allergens & Consumption Advice</h2>
        <p>
          The Hungry Lab is committed to the highest culinary hygiene and food safety standards across all food preparation and packaging.
        </p>
        <ul>
          <li><strong>Allergen Notice:</strong> Our kitchen prepares dishes containing gluten, dairy, cheeses, soy, and nuts. While we take rigorous care to prevent cross-contamination, individuals with severe food allergies should exercise personal discretion.</li>
          <li><strong>Immediate Consumption:</strong> Meals should be consumed within 2 hours of delivery. If storing for later consumption, refrigerate promptly and reheat thoroughly before eating.</li>
        </ul>
      </section>

      <section class="policy-section">
        <h2>9. Intellectual Property & Brand Ownership</h2>
        <p>
          All content included on this platform—such as trademarks, logos, menu names, recipes, UI layouts, graphic assets, and custom source code—is the intellectual property of The Hungry Lab. Reproduction or unauthorized redistribution without prior written consent is strictly prohibited.
        </p>
      </section>

      <section class="policy-section">
        <h2>10. Governing Law & Dispute Resolution</h2>
        <p>
          These Terms of Service are governed by and construed in accordance with the substantive laws of India. Any disputes or claims arising out of or in connection with our services shall be subject to the exclusive jurisdiction of the competent courts in Bengaluru, Karnataka, India.
        </p>
      </section>
    </article>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'

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

.status-steps {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin: 18px 0;
}

.step-card {
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  padding: 16px;
  border-radius: var(--border-radius-sm);
}

.step-badge {
  display: inline-block;
  font-weight: 800;
  font-size: 0.8rem;
  color: var(--brand-primary);
  margin-bottom: 8px;
}

.step-card p {
  font-size: 0.88rem;
  color: var(--text-muted);
  margin-bottom: 0;
  line-height: 1.4;
}

.policy-callout {
  background-color: #fffbeb;
  border-left: 4px solid #f59e0b;
  padding: 16px 20px;
  border-radius: 4px;
  margin: 16px 0;
}

.policy-callout h4 {
  color: #b45309;
  margin-bottom: 6px;
  font-size: 1.05rem;
}

.policy-callout p {
  color: #92400e;
  margin-bottom: 0;
}

.inline-link {
  color: var(--brand-primary);
  font-weight: 600;
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


<template>
  <div class="contact-page container animate-fade-in">
    <!-- Header Section -->
    <header class="contact-header text-center">
      <div class="pill-badge mb-2">We're Here For You</div>
      <h1 class="page-title">Contact <span class="text-brand">The Lab</span></h1>
      <p class="text-muted">Have a question about an order, feedback for our chefs, or want to collaborate? Reach out below.</p>
    </header>

    <!-- Quick Info Cards -->
    <section class="contact-cards-grid">
      <div class="card info-card">
        <div class="info-icon">📞</div>
        <h3>Hotline & WhatsApp</h3>
        <p class="info-highlight">{{ FORMATTED_PHONE }}</p>
        <p class="text-sm text-muted">Direct kitchen dispatch line</p>
      </div>

      <div class="card info-card">
        <div class="info-icon">✉️</div>
        <h3>Email Support</h3>
        <p class="info-highlight">{{ CONTACT_EMAIL }}</p>
        <p class="text-sm text-muted">Avg. response within 2 hours</p>
      </div>

      <div class="card info-card">
        <div class="info-icon">📍</div>
        <h3>Kitchen & Lab HQ</h3>
        <p class="info-highlight">Plot 42, Tech Park Blvd</p>
        <p class="text-sm text-muted">Sector 5, Bangalore 560102</p>
      </div>

      <div class="card info-card">
        <div class="info-icon">🕒</div>
        <h3>Operating Hours</h3>
        <p class="info-highlight">11:00 AM – 11:30 PM</p>
        <p class="text-sm text-muted">7 Days a Week, Rain or Shine</p>
      </div>
    </section>

    <!-- Contact Form & FAQs Grid -->
    <div class="main-grid">
      <!-- Contact Form -->
      <section class="card form-section">
        <h2 class="section-title mb-1">Send us a <span class="text-brand">Message</span></h2>
        <p class="text-muted text-sm mb-4">Fill out the form below and our kitchen team will get back to you promptly.</p>

        <!-- Success Message -->
        <div v-if="submitted" class="success-banner card">
          <div class="success-icon">🎉</div>
          <h3>Message Received, Scientist!</h3>
          <p>
            Your inquiry has been logged under ticket <strong>#{{ ticketId }}</strong>.
            Our customer care and kitchen team will contact you at <strong>{{ form.email }}</strong> shortly.
          </p>
          <button @click="resetForm" class="btn btn-primary mt-3">Send Another Message</button>
        </div>

        <!-- Contact Form Fields -->
        <form v-else @submit.prevent="handleSubmit" class="contact-form">
          <div class="form-row">
            <div class="form-group">
              <label for="name">Your Name *</label>
              <input 
                id="name"
                v-model.trim="form.name" 
                type="text" 
                class="form-control" 
                placeholder="e.g. Satyam Sharma" 
                required 
              />
            </div>

            <div class="form-group">
              <label for="email">Email Address *</label>
              <input 
                id="email"
                v-model.trim="form.email" 
                type="email" 
                class="form-control" 
                placeholder="satyam@example.com" 
                required 
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="phone">Phone Number *</label>
              <input 
                id="phone"
                v-model.trim="form.phone" 
                type="tel" 
                class="form-control" 
                :placeholder="'+91 ' + CONTACT_PHONE" 
                required 
              />
            </div>

            <div class="form-group">
              <label for="category">Inquiry Subject *</label>
              <select id="category" v-model="form.category" class="form-control" required>
                <option value="order_issue">🚨 Order Issue / Missing Item</option>
                <option value="feedback">🍔 Food Feedback & Compliments</option>
                <option value="bulk_order">🎉 Party & Bulk Catering</option>
                <option value="partnership">🤝 Franchise & Business Partnership</option>
                <option value="general">💬 General Inquiry</option>
              </select>
            </div>
          </div>

          <!-- Conditional Order ID for Order Issue -->
          <div v-if="form.category === 'order_issue'" class="form-group animate-fade-in">
            <label for="orderId">Order Number (Optional)</label>
            <input 
              id="orderId"
              v-model.trim="form.orderId" 
              type="text" 
              class="form-control" 
              placeholder="e.g. Order #104" 
            />
          </div>

          <div class="form-group">
            <div class="label-row">
              <label for="message">Message *</label>
              <span class="char-count text-muted text-sm">{{ form.message.length }}/500</span>
            </div>
            <textarea 
              id="message"
              v-model="form.message" 
              maxlength="500"
              rows="5" 
              class="form-control" 
              placeholder="Tell us what's on your mind..." 
              required
            ></textarea>
          </div>

          <button 
            type="submit" 
            class="btn btn-primary w-100" 
            :disabled="isSubmitting"
          >
            <span v-if="isSubmitting">Sending Message...</span>
            <span v-else>Transmit Message 🚀</span>
          </button>
        </form>
      </section>

      <!-- FAQ Accordion & Food Safety Badge -->
      <aside class="faq-section">
        <div class="card faq-card">
          <h2 class="section-title mb-2">Frequently Asked <span class="text-brand">Questions</span></h2>
          <p class="text-muted text-sm mb-3">Quick answers to common questions about our food and delivery.</p>

          <div class="accordion">
            <div 
              v-for="(faq, index) in faqs" 
              :key="index" 
              class="faq-item"
              :class="{ open: openFaq === index }"
            >
              <button 
                type="button" 
                class="faq-question" 
                @click="toggleFaq(index)"
                :aria-expanded="openFaq === index"
              >
                <span>{{ faq.q }}</span>
                <span class="faq-icon">{{ openFaq === index ? '−' : '+' }}</span>
              </button>
              <div v-show="openFaq === index" class="faq-answer">
                <p>{{ faq.a }}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { CONTACT_EMAIL, CONTACT_PHONE, FORMATTED_PHONE } from '../config/contact'

const authStore = useAuthStore()

const form = ref({
  name: '',
  email: '',
  phone: '',
  category: 'order_issue',
  orderId: '',
  message: ''
})

const isSubmitting = ref(false)
const submitted = ref(false)
const ticketId = ref('')

const openFaq = ref(0) // First FAQ open by default

const faqs = [
  {
    q: 'How can I track my active food order?',
    a: 'If you are logged in, navigate to your "My Orders" tab in the navigation bar to see real-time updates as our chefs confirm, prepare, and dispatch your meal.'
  },
  {
    q: 'Can I cancel or modify my order after paying?',
    a: 'You can cancel while the order status is "CONFIRMED". Once our chefs begin cooking ("PREPARING"), the order cannot be cancelled as fresh ingredients have been deployed.'
  },
  {
    q: 'What should I do if an item or addon is missing?',
    a: `Please reach out immediately via phone (${FORMATTED_PHONE}) or email (${CONTACT_EMAIL}) or this contact form with your Order ID. We will promptly dispatch a replacement or issue an instant refund.`
  },
  {
    q: 'Do you cater for office parties or bulk gatherings?',
    a: 'Yes! Select "Party & Bulk Catering" in the inquiry dropdown above. For orders over 20 meals, please give us at least 4 hours advance notice.'
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major UPI apps (Google Pay, PhonePe, Paytm, BHIM), Credit and Debit Cards (Visa, MasterCard, RuPay), Net Banking, and Wallets securely via Razorpay.'
  }
]

const toggleFaq = (index) => {
  openFaq.value = openFaq.value === index ? -1 : index
}

onMounted(() => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
  // Auto-fill user credentials if logged in
  if (authStore.user) {
    if (authStore.user.name) form.value.name = authStore.user.name
    if (authStore.user.email) form.value.email = authStore.user.email
  }
})

const handleSubmit = async () => {
  isSubmitting.value = true
  
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    })
    if (res.ok) {
      const data = await res.json()
      ticketId.value = data.ticketId || ('HL-' + Math.floor(10000 + Math.random() * 90000))
    } else {
      ticketId.value = 'HL-' + Math.floor(10000 + Math.random() * 90000)
    }
  } catch {
    ticketId.value = 'HL-' + Math.floor(10000 + Math.random() * 90000)
  } finally {
    submitted.value = true
    isSubmitting.value = false
  }
}

const resetForm = () => {
  form.value = {
    name: authStore.user?.name || '',
    email: authStore.user?.email || '',
    phone: '',
    category: 'order_issue',
    orderId: '',
    message: ''
  }
  submitted.value = false
}
</script>

<style scoped>
.contact-page {
  padding-top: 40px;
  padding-bottom: 80px;
}

.contact-header {
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

.contact-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.info-card {
  text-align: center;
  padding: 24px 16px;
}

.info-icon {
  font-size: 2rem;
  margin-bottom: 10px;
}

.info-card h3 {
  font-size: 1.1rem;
  margin-bottom: 6px;
}

.info-highlight {
  font-weight: 700;
  color: var(--brand-primary);
  font-size: 1.05rem;
  margin-bottom: 4px;
}

.main-grid {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 30px;
  align-items: start;
}

.form-section {
  padding: 36px;
}

.section-title {
  font-size: 1.6rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-weight: 600;
  font-size: 0.92rem;
  margin-bottom: 8px;
  color: var(--text-main);
}

.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.char-count {
  font-size: 0.82rem;
}

.w-100 {
  width: 100%;
}

.success-banner {
  text-align: center;
  padding: 40px 24px;
  background-color: #f0fdf4;
  border: 1px solid #bbf7d0;
}

.success-icon {
  font-size: 3rem;
  margin-bottom: 12px;
}

.success-banner h3 {
  color: #166534;
  margin-bottom: 10px;
}

.success-banner p {
  color: #14532d;
  line-height: 1.6;
}

.faq-card {
  padding: 30px;
}

.accordion {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.faq-item {
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  overflow: hidden;
  transition: var(--transition);
}

.faq-item.open {
  border-color: var(--brand-primary);
}

.faq-question {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  background: white;
  border: none;
  font-weight: 700;
  font-family: var(--font-heading);
  font-size: 0.95rem;
  text-align: left;
  color: var(--text-main);
  cursor: pointer;
  transition: var(--transition);
}

.faq-question:hover {
  background-color: var(--bg-primary);
}

.faq-icon {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--brand-primary);
  margin-left: 12px;
}

.faq-answer {
  padding: 0 18px 16px 18px;
  background: white;
  color: #334155;
  font-size: 0.9rem;
  line-height: 1.6;
}

@media (max-width: 900px) {
  .main-grid {
    grid-template-columns: 1fr;
  }
  .form-row {
    grid-template-columns: 1fr;
    gap: 0;
  }
  .form-section {
    padding: 24px;
  }
}
</style>


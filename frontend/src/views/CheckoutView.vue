<template>
  <div class="checkout-view container">
    <div class="menu-header">
      <div class="fastfood-badge">🛒 SECURE CHECKOUT</div>
      <h1 class="page-title">Your Food <span class="text-brand">Bag</span></h1>
    </div>

    <!-- Empty Cart -->
    <div v-if="cartStore.items.length === 0" class="text-center empty-state card">
      <div class="empty-icon">🍟</div>
      <h3>Your bag is looking empty!</h3>
      <p class="text-muted mt-2">Looks like you haven't added any delicious food yet.</p>
      <router-link to="/menu" class="btn btn-primary mt-4">Explore Menu Now</router-link>
    </div>

    <div v-else class="checkout-grid">
      <!-- Cart Items List -->
      <div class="cart-items-section">
        <div class="section-title-row">
          <h2>Order Items ({{ cartStore.cartCount }})</h2>
          <button @click="cartStore.clearCart" class="clear-btn">Clear All</button>
        </div>

        <div v-for="item in cartStore.items" :key="item.cartItemId" class="card cart-item">
          <!-- Item Details -->
          <div class="item-details">
            <div class="item-header">
              <div class="veg-indicator" :class="item.menuItem.veg ? 'veg' : 'non-veg'">
                <span class="dot"></span>
              </div>
              <h3>{{ item.menuItem.name }}</h3>
            </div>
            
            <div class="item-meta">
              <span class="item-base-price">₹{{ item.menuItem.price }} each</span>
              <div v-if="item.selectedAddOns && item.selectedAddOns.length" class="item-addons text-muted">
                + {{ item.selectedAddOns.map(a => a.name).join(', ') }} 
                (₹{{ item.selectedAddOns.reduce((sum, a) => sum + a.price, 0) }})
              </div>
            </div>
          </div>

          <!-- Quantity Controls & Row Total -->
          <div class="item-actions-row">
            <div class="quantity-controls">
              <button @click="cartStore.updateQuantity(item.cartItemId, item.quantity - 1)" class="qty-btn" aria-label="Decrease quantity">-</button>
              <span class="qty-display">{{ item.quantity }}</span>
              <button @click="cartStore.updateQuantity(item.cartItemId, item.quantity + 1)" class="qty-btn" aria-label="Increase quantity">+</button>
            </div>
            
            <div class="item-total">
              ₹{{ ((item.menuItem.price + (item.selectedAddOns ? item.selectedAddOns.reduce((sum, a) => sum + a.price, 0) : 0)) * item.quantity).toFixed(2) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Order Summary & Checkout -->
      <div class="order-summary-section">
        <div class="card summary-card">
          <!-- Coupon Box -->
          <div class="coupon-section mb-4">
            <div class="coupon-header">
              <h3>Apply Promo Code</h3>
              <span class="deal-pill-mini">Save Extra</span>
            </div>
            
            <div v-if="authStore.isAuthenticated">
              <div class="coupon-input-group">
                <input 
                  type="text" 
                  v-model="couponCodeInput" 
                  placeholder="Enter promo code (e.g. HUNGRY10)" 
                  class="form-input coupon-input" 
                  :disabled="appliedCoupon != null"
                />
                <button 
                  v-if="!appliedCoupon" 
                  @click="applyCoupon" 
                  class="btn btn-secondary btn-coupon" 
                  :disabled="isApplyingCoupon || !couponCodeInput.trim()"
                >
                  {{ isApplyingCoupon ? '...' : 'Apply' }}
                </button>
                <button 
                  v-else 
                  @click="removeCoupon" 
                  class="btn btn-remove-coupon"
                >
                  Remove
                </button>
              </div>
              <p v-if="couponMessage" :class="['coupon-msg', appliedCoupon ? 'success' : 'error']">
                {{ couponMessage }}
              </p>
            </div>
            
            <div v-else class="login-prompt card">
              <p>Have an offer code? <a href="#" @click.prevent="openLoginModal" class="text-brand font-weight-bold">Sign In</a> to activate discounts!</p>
            </div>
          </div>

          <!-- Customer & Delivery Form -->
          <h3 class="pt-3 border-top">Delivery Details</h3>

          <div class="customer-details">
            <div class="form-group">
              <label for="customerName">Full Name *</label>
              <input type="text" id="customerName" v-model="formData.customerName" placeholder="e.g. Satyam Sharma" class="form-input" required />
            </div>
            <div class="form-group mt-2">
              <label for="customerEmail">Email Address *</label>
              <input type="email" id="customerEmail" v-model="formData.customerEmail" placeholder="For live order confirmation" class="form-input" required />
            </div>
            <div class="form-group mt-2">
              <label for="customerPhone">Phone Number *</label>
              <input type="tel" id="customerPhone" v-model="formData.customerPhone" placeholder="10-digit mobile number" class="form-input" required />
            </div>
            <div class="form-group mt-2">
              <label for="deliveryAddress">Delivery Address *</label>
              <textarea id="deliveryAddress" v-model="formData.deliveryAddress" placeholder="Flat / House No., Landmark, Area, City" class="form-input" rows="2" required></textarea>
            </div>
          </div>

          <!-- Bill Summary -->
          <h3 class="mt-4 pt-3 border-top">Bill Summary</h3>
          <div class="summary-row">
            <span>Item Subtotal</span>
            <span>₹{{ cartStore.cartTotal.toFixed(2) }}</span>
          </div>
          <div class="summary-row">
            <span>Delivery Fee</span>
            <span class="text-green">FREE</span>
          </div>
          <div v-if="appliedCoupon && isCartTotalValidForCoupon" class="summary-row text-green">
            <span>Coupon Discount ({{ appliedCoupon.code }})</span>
            <span>-₹{{ discountAmount.toFixed(2) }}</span>
          </div> 
          
          <div v-if="appliedCoupon && !isCartTotalValidForCoupon" class="summary-row min-order-warning">
            <span>Add ₹{{ (appliedCoupon.minOrderValue - cartStore.cartTotal).toFixed(2) }} more to unlock {{ appliedCoupon.code }} discount.</span>
          </div>

          <div class="summary-row total-row">
            <span>To Pay</span>
            <span class="text-brand final-price">₹{{ finalCalculatedTotal.toFixed(2) }}</span>
          </div>

          <button 
            @click="placeOrder" 
            class="btn btn-primary w-100 btn-pay mt-4" 
            :disabled="isSubmitting || !isFormValid"
          >
            <span v-if="isSubmitting">Processing Order...</span>
            <span v-else>Pay ₹{{ finalCalculatedTotal.toFixed(2) }} via Razorpay ➔</span>
          </button>
          
          <p v-if="orderStatus" class="status-msg mt-3" :class="orderStatus.type">
            {{ orderStatus.text }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCartStore } from '../stores/cart'
import { useAuthStore } from '../stores/auth'

const cartStore = useCartStore()
const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const isSubmitting = ref(false)
const orderStatus = ref(null)

const formData = ref({
  customerName: authStore.user?.name || '',
  customerEmail: authStore.user?.email || '',
  customerPhone: authStore.user?.phone || '',
  deliveryAddress: ''
})

// Keep form updated if user logs in
watch(() => authStore.user, (newVal) => {
  if (newVal) {
    if (!formData.value.customerName) formData.value.customerName = newVal.name || ''
    if (!formData.value.customerEmail) formData.value.customerEmail = newVal.email || ''
    if (!formData.value.customerPhone) formData.value.customerPhone = newVal.phone || ''
  }
})

const couponCodeInput = ref('')
const isApplyingCoupon = ref(false)
const appliedCoupon = ref(null)
const couponMessage = ref('')

const openLoginModal = () => {
  router.push({ query: { login: 'true' }}) 
}

const applyCoupon = async () => {
  if (!couponCodeInput.value.trim()) return
  
  try {
    isApplyingCoupon.value = true
    couponMessage.value = ''
    
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/orders/applycoupon`, {
      method: 'POST',
      headers: authStore.getAuthHeaders(),
      body: JSON.stringify({ couponCode: couponCodeInput.value })
    })
    
    if (response.status === 403) {
      openLoginModal()
      throw new Error("Please log in to use coupons.")
    }
    
    const data = await response.json()
    
    if (data.valid) {
      appliedCoupon.value = { 
        code: couponCodeInput.value.trim().toUpperCase(), 
        type: data.discountType, 
        value: data.discountValue, 
        minOrderValue: data.minOrderValue 
      }
      couponMessage.value = "Coupon applied! Discount calculated below."
    } else {
      couponMessage.value = data.message || "Invalid coupon code."
      appliedCoupon.value = null
    }
  } catch (error) {
    couponMessage.value = error.message
    appliedCoupon.value = null
  } finally {
    isApplyingCoupon.value = false
  }
}

const removeCoupon = () => {
  appliedCoupon.value = null
  couponCodeInput.value = ''
  couponMessage.value = ''
}

const isCartTotalValidForCoupon = computed(() => {
  if (!appliedCoupon.value) return false
  return cartStore.cartTotal >= appliedCoupon.value.minOrderValue
})

const discountAmount = computed(() => {
  if (!appliedCoupon.value || !isCartTotalValidForCoupon.value) return 0
  if (appliedCoupon.value.type === 'FLAT') return appliedCoupon.value.value
  if (appliedCoupon.value.type === 'PERCENTAGE') return cartStore.cartTotal * (appliedCoupon.value.value / 100.0)
  return 0
})

const finalCalculatedTotal = computed(() => {
  const total = cartStore.cartTotal - discountAmount.value
  return total > 1.0 ? total : 1.0
})

const isFormValid = computed(() => {
  return formData.value.customerName.trim() && 
         formData.value.customerEmail.trim() && 
         formData.value.customerPhone.trim() && 
         formData.value.deliveryAddress.trim()
})

const loadRazorpay = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true)
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

const placeOrder = async () => {
  if (!isFormValid.value) return;
  
  try {
    isSubmitting.value = true
    orderStatus.value = null
    
    const envKey = (import.meta.env.VITE_RAZORPAY_KEY_ID || '').trim()
    let publicKeyId = (envKey.startsWith('rzp_test_') || envKey.startsWith('rzp_live_')) ? envKey : null

    if (!publicKeyId) {
      const configResp = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/orders/config`)
      if (configResp.ok) {
        const configData = await configResp.json()
        if (configData.keyId && (configData.keyId.startsWith('rzp_test_') || configData.keyId.startsWith('rzp_live_'))) {
          publicKeyId = configData.keyId
        }
      }
    }
    
    if (!publicKeyId) {
      publicKeyId = 'rzp_test_TTZO8LwtSgqMxf'
    }

    const payload = {
      userId: authStore.user?.id || null, 
      customerName: formData.value.customerName,
      customerEmail: formData.value.customerEmail,
      customerPhone: formData.value.customerPhone,
      deliveryAddress: formData.value.deliveryAddress,
      couponCode: (appliedCoupon.value && isCartTotalValidForCoupon.value) ? appliedCoupon.value.code : null,
      items: cartStore.getBackendPayload()
    }
    
    // Create the Order on the backend
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/orders/`, {
      method: 'POST',
      headers: authStore.getAuthHeaders(), 
      body: JSON.stringify(payload)
    })
    
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || 'Failed to place order')
    }
    
    const orderData = await response.json()
    
    // Load Razorpay Script
    const isLoaded = await loadRazorpay()
    if (!isLoaded) throw new Error('Razorpay SDK failed to load.')

    // Launch UI
    const options = {
      key: publicKeyId,
      amount: Math.round(finalCalculatedTotal.value * 100), 
      currency: "INR",
      name: "The Hungry Lab",
      description: "Fast Food Kitchen Order",
      image: "/assets/Logo.png",
      order_id: orderData.razorpayOrderId, 
      
      handler: async function (response) {
        try {
          isSubmitting.value = true
          orderStatus.value = {
            type: 'info',
            text: 'Verifying payment with kitchen...'
          }

          const verifyResp = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/payment/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: orderData.orderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            })
          })

          if (!verifyResp.ok) {
            const errJson = await verifyResp.json().catch(() => ({}))
            throw new Error(errJson.error || 'Payment signature verification failed.')
          }

          cartStore.clearCart()
          orderStatus.value = {
            type: 'success',
            text: `Payment Successful! Your Order #${orderData.orderId} is confirmed and grilling.`
          }

          setTimeout(() => {
            if (authStore.isAuthenticated) {
              router.push('/history')
            }
          }, 2000)
        } catch (vErr) {
          console.error("Verification error:", vErr)
          orderStatus.value = {
            type: 'error',
            text: `Verification notice: ${vErr.message}. If payment was deducted, kitchen webhook will confirm shortly.`
          }
        } finally {
          isSubmitting.value = false
        }
      },
      prefill: {
        name: formData.value.customerName,
        email: formData.value.customerEmail,
        contact: formData.value.customerPhone
      },
      theme: { color: "#ff3b00" },
      modal: {
        ondismiss: function () {
          orderStatus.value = {
            type: 'error',
            text: 'Payment window closed. You can complete your order anytime.'
          }
          isSubmitting.value = false
        }
      }
    }

    const rzp1 = new window.Razorpay(options)
    rzp1.on('payment.failed', function (response){
      orderStatus.value = { type: 'error', text: 'Payment failed: ' + response.error.description }
    })
    rzp1.open()
    
  } catch (error) {
    console.error("Order error:", error)
    orderStatus.value = { type: 'error', text: '' + error.message }
  } finally {
    isSubmitting.value = false
  }
}

// STRICT REQUIREMENT 10: AUTO-APPLY PENDING COUPONS FROM HOMEPAGE OFFERS
onMounted(() => {
  const pendingCoupon = route.query.coupon || sessionStorage.getItem('pendingCoupon')
  if (pendingCoupon) {
    couponCodeInput.value = String(pendingCoupon).trim().toUpperCase()
    sessionStorage.removeItem('pendingCoupon')
    if (authStore.isAuthenticated) {
      applyCoupon()
    } else {
      couponMessage.value = `Promo code ${couponCodeInput.value} detected! Sign in above to apply your discount.`
    }
  }
})
</script>

<style scoped>
.menu-header { text-align: center; margin-bottom: 32px; padding-top: 16px; }
.fastfood-badge {
  display: inline-block;
  background: var(--brand-primary-light);
  color: var(--brand-primary);
  border: 1px solid rgba(255, 59, 0, 0.2);
  font-weight: 900;
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  padding: 4px 14px;
  border-radius: 20px;
  margin-bottom: 8px;
}
.page-title { font-size: clamp(2rem, 4vw, 2.8rem); font-weight: 900; }

.checkout-grid { 
  display: grid; 
  grid-template-columns: 1.4fr 1fr; 
  gap: 32px; 
  align-items: start; 
  margin-bottom: 60px;
}

.section-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.section-title-row h2 { font-size: 1.3rem; font-weight: 800; }
.clear-btn {
  background: none;
  border: none;
  color: var(--brand-alert);
  font-weight: 700;
  cursor: pointer;
  font-size: 0.88rem;
}
.clear-btn:hover { text-decoration: underline; }

.cart-item { 
  display: flex; 
  align-items: center; 
  justify-content: space-between; 
  gap: 16px; 
  margin-bottom: 16px; 
  padding: 18px 20px; 
  border: 1.5px solid var(--border-color);
  border-radius: var(--border-radius);
  background: white;
}
.item-details { flex: 1; }
.item-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.item-header h3 { margin: 0; font-size: 1.1rem; font-weight: 800; }
.item-meta { display: flex; flex-direction: column; gap: 4px; font-size: 0.88rem; }
.item-base-price { font-weight: 600; color: var(--text-muted); }

.item-actions-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.quantity-controls { 
  display: flex; 
  align-items: center; 
  gap: 10px; 
  background-color: var(--bg-primary); 
  border-radius: 25px; 
  padding: 4px 10px; 
  border: 1px solid var(--border-color);
}
.qty-btn { 
  background: white; 
  border: 1px solid var(--border-color); 
  font-size: 1.1rem; 
  font-weight: 900; 
  cursor: pointer; 
  color: var(--brand-primary); 
  width: 28px; 
  height: 28px; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  border-radius: 50%; 
  transition: all 0.2s;
}
.qty-btn:hover { 
  background-color: var(--brand-primary); 
  color: white; 
  border-color: var(--brand-primary);
}
.qty-display { font-weight: 800; min-width: 22px; text-align: center; font-size: 0.95rem; }
.item-total { font-weight: 900; font-size: 1.2rem; min-width: 80px; text-align: right; color: var(--text-main); font-family: var(--font-heading); }

/* Summary Card */
.summary-card {
  border: 2px solid var(--border-color);
  background: white;
}
.coupon-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.coupon-header h3 { margin: 0; font-size: 1.1rem; font-weight: 800; }
.deal-pill-mini {
  background: var(--brand-yellow-light);
  color: #b45309;
  font-size: 0.75rem;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 12px;
}
.coupon-input-group { display: flex; gap: 8px; margin-bottom: 6px; }
.coupon-input { text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em; }
.btn-coupon { padding: 8px 18px; font-size: 0.9rem; white-space: nowrap; }
.btn-remove-coupon { background: white; border: 1.5px solid var(--brand-alert); color: var(--brand-alert); padding: 8px 14px; border-radius: 20px; font-weight: 800; cursor: pointer; }
.btn-remove-coupon:hover { background: #fee2e2; }

.coupon-msg { font-size: 0.85rem; padding-top: 4px; font-weight: 600; }
.coupon-msg.success { color: var(--brand-secondary); }
.coupon-msg.error { color: var(--brand-alert); }

.login-prompt {
  background: var(--bg-primary);
  padding: 12px;
  border: 1px dashed var(--border-color);
  font-size: 0.88rem;
  text-align: center;
}

.border-top { border-top: 1.5px solid var(--border-color); }
.pt-3 { padding-top: 14px; }
.summary-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 0.96rem; font-weight: 600; }
.total-row { 
  font-size: 1.35rem; 
  font-weight: 900; 
  margin-top: 16px; 
  padding-top: 16px; 
  border-top: 2px dashed var(--border-color); 
}
.final-price { font-size: 1.5rem; letter-spacing: -0.02em; }

.min-order-warning {
  color: var(--brand-alert);
  font-size: 0.82rem;
  background: #fff5f5;
  padding: 6px 10px;
  border-radius: 6px;
}

.btn-pay {
  padding: 16px;
  font-size: 1.1rem;
}

.empty-state {
  padding: 60px 20px;
  text-align: center;
}
.empty-icon { font-size: 3.5rem; margin-bottom: 12px; }

/* Status Notifications */
.status-msg { padding: 12px; border-radius: 8px; text-align: center; font-weight: 600; font-size: 0.92rem; }
.status-msg.success { background-color: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; }
.status-msg.error { background-color: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
.status-msg.info { background-color: #e0f2fe; color: #075985; border: 1px solid #bae6fd; }

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .checkout-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }
}

@media (max-width: 540px) {
  .cart-item {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    padding: 14px;
  }
  .item-actions-row {
    justify-content: space-between;
    border-top: 1px solid var(--border-color);
    padding-top: 10px;
  }
}
</style>

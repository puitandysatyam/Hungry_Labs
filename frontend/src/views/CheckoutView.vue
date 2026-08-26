<template>
  <div class="checkout-view container">
    <div class="menu-header">
      <h1 class="page-title">Your <span class="text-brand">Cart</span></h1>
    </div>

    <!-- Empty Cart -->
    <div v-if="cartStore.items.length === 0" class="text-center empty-state">
      <p>Your cart is looking a little empty.</p>
      <router-link to="/menu" class="btn btn-primary mt-4">Browse Menu</router-link>
    </div>

    <div v-else class="checkout-grid">
      <!-- Cart Items List -->
      <div class="cart-items-section">
        <div v-for="item in cartStore.items" :key="item.cartItemId" class="card cart-item">
          <!-- Item Details -->
          <div class="item-details">
            <div class="item-header">
              <div class="veg-indicator" :class="item.menuItem.isVeg ? 'veg' : 'non-veg'">
                <span class="dot"></span>
              </div>
              <h3>{{ item.menuItem.name }}</h3>
            </div>
            
            <div class="item-meta">
              <span class="item-base-price">₹{{ item.menuItem.price }}</span>
              <div v-if="item.selectedAddOns && item.selectedAddOns.length" class="item-addons text-muted">
                + {{ item.selectedAddOns.map(a => a.name).join(', ') }} 
                (₹{{ item.selectedAddOns.reduce((sum, a) => sum + a.price, 0) }})
              </div>
            </div>
          </div>

          <!-- Quantity Controls -->
          <div class="quantity-controls">
            <button @click="cartStore.updateQuantity(item.cartItemId, item.quantity - 1)" class="qty-btn">-</button>
            <span class="qty-display">{{ item.quantity }}</span>
            <button @click="cartStore.updateQuantity(item.cartItemId, item.quantity + 1)" class="qty-btn">+</button>
          </div>
          
          <div class="item-total">
            ₹{{ ((item.menuItem.price + (item.selectedAddOns ? item.selectedAddOns.reduce((sum, a) => sum + a.price, 0) : 0)) * item.quantity).toFixed(2) }}
          </div>
        </div>
      </div>

      <!-- Order Summary & Checkout -->
      <div class="order-summary-section">
        <div class="card summary-card">
          
          <!-- Coupon Box -->
          <div class="coupon-section mb-4">
            <h3 class="mb-2">Apply Coupon</h3>
            
            <div v-if="authStore.isAuthenticated">
              <div class="coupon-input-group">
                <input 
                  type="text" 
                  v-model="couponCodeInput" 
                  placeholder="Enter promo code" 
                  class="form-input" 
                  :disabled="appliedCoupon != null"
                />
                <button 
                  v-if="!appliedCoupon" 
                  @click="applyCoupon" 
                  class="btn btn-secondary" 
                  :disabled="isApplyingCoupon || !couponCodeInput.trim()"
                >
                  {{ isApplyingCoupon ? '...' : 'Apply' }}
                </button>
                <button 
                  v-else 
                  @click="removeCoupon" 
                  class="btn btn-secondary" style="color: #d13d18; border-color: #d13d18;"
                >
                  Remove
                </button>
              </div>
              <p v-if="couponMessage" :class="['coupon-msg', appliedCoupon ? 'success' : 'error']">
                {{ couponMessage }}
              </p>
            </div>
            
            <div v-else class="text-muted" style="font-size: 0.9rem;">
              <p>Please <a href="#" @click.prevent="openLoginModal" class="text-brand">login</a> to use coupons and special offers!</p>
            </div>
          </div>

          <h3 class="mt-4 pt-4 border-top">Delivery Details</h3>

          <div class="customer-details">
            <div class="form-group">
              <label for="customerName">Full Name</label>
              <input type="text" id="customerName" v-model="formData.customerName" placeholder="Enter your name" class="form-input" />
            </div>
            <div class="form-group mt-3">
              <label for="customerEmail">Email Address</label>
              <input type="email" id="customerEmail" v-model="formData.customerEmail" placeholder="For order confirmation" class="form-input" />
            </div>
            <div class="form-group mt-3">
              <label for="customerPhone">Phone Number</label>
              <input type="tel" id="customerPhone" v-model="formData.customerPhone" placeholder="10-digit mobile number" class="form-input" />
            </div>
            <div class="form-group mt-3">
              <label for="deliveryAddress">Delivery Address</label>
              <textarea id="deliveryAddress" v-model="formData.deliveryAddress" placeholder="Full address" class="form-input" rows="2"></textarea>
            </div>
          </div>

          <h3 class="mt-4 pt-4 border-top">Order Summary</h3>

          <div class="summary-row">
            <span>Subtotal ({{ cartStore.cartCount }} items)</span>
            <span>₹{{ cartStore.cartTotal.toFixed(2) }}</span>
          </div>

          <div v-if="appliedCoupon && isCartTotalValidForCoupon" class="summary-row text-green">
            <span>Discount ({{ appliedCoupon.code }})</span>
            <span>-₹{{ discountAmount.toFixed(2) }}</span>
          </div> 
          
          <div v-if="appliedCoupon && !isCartTotalValidForCoupon" class="summary-row" style="color: #d13d18; font-size: 0.85rem;">
            <span>Add ₹{{ (appliedCoupon.minOrderValue - cartStore.cartTotal).toFixed(2) }} more to use this coupon.</span>
          </div>

          <div class="summary-row total-row">
            <span>Estimated Total</span>
            <span class="text-brand">₹{{ finalCalculatedTotal.toFixed(2) }}</span>
          </div>

          <button 
            @click="placeOrder" 
            class="btn btn-primary w-100 mt-4" 
            :disabled="isSubmitting || !isFormValid"
          >
            {{ isSubmitting ? 'Processing...' : 'Proceed to Pay' }}
          </button>
          
          <p v-if="orderStatus" class="status-msg mt-4" :class="orderStatus.type">
            {{ orderStatus.text }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../stores/cart'
import { useAuthStore } from '../stores/auth'

const cartStore = useCartStore()
const authStore = useAuthStore()
const router = useRouter()

const isSubmitting = ref(false)
const orderStatus = ref(null)

const formData = ref({
  customerName: authStore.user?.name || '',
  customerEmail: authStore.user?.email || '', 
  customerPhone: '', 
  deliveryAddress: ''
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
    
    const response = await fetch('http://localhost:3000/api/orders/applycoupon', {
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
      appliedCoupon.value = { code: couponCodeInput.value, type: data.discountType, value: data.discountValue, minOrderValue: data.minOrderValue }
      couponMessage.value = "Coupon applied!"
    } else {
      couponMessage.value = data.message
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
  appliedCoupon.value = null; couponCodeInput.value = ''; couponMessage.value = ''
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
  return total > 0 ? total : 0
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
    
    // First: Fetch Razorpay Public Key from backend dynamically!
    // This stops you from having to hardcode it natively here in Vue every time you rotate keys.
    const configResp = await fetch('http://localhost:3000/api/orders/config')
    const configData = await configResp.json()
    const publicKeyId = configData.keyId
    
    if (!publicKeyId) throw new Error("Could not fetch Razorpay configuration.")

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
    const response = await fetch('http://localhost:3000/api/orders/', {
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
      key: publicKeyId, // Dynamically sourced from application.properties now!
      amount: finalCalculatedTotal.value * 100, 
      currency: "INR",
      name: "The Hungry Lab",
      description: "Food Delivery Order",
      image: "/assets/Logo.png",
      order_id: orderData.razorpayOrderId, 
      
      handler: function (response) {
        orderStatus.value = {
          type: 'success',
          text: `Payment Successful! Your Order #${orderData.orderId} is being prepared.`
        }
        cartStore.clearCart()
      },
      prefill: {
        name: formData.value.customerName,
        email: formData.value.customerEmail,
        contact: formData.value.customerPhone
      },
      theme: { color: "#e84a20" }
    }

    const rzp1 = new window.Razorpay(options)
    rzp1.on('payment.failed', function (response){
      orderStatus.value = { type: 'error', text: 'Payment failed! Reason: ' + response.error.description }
    })
    rzp1.open()
    
  } catch (error) {
    console.error("Order error:", error)
    orderStatus.value = { type: 'error', text: '' + error.message }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
/* Scoped styling remains identical and minimal to save tokens */
.menu-header { text-align: center; margin-bottom: 40px; }
.page-title { font-size: 2.5rem; }
.checkout-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 32px; align-items: start; }
@media (max-width: 768px) { .checkout-grid { grid-template-columns: 1fr; } }
.mb-2 { margin-bottom: 8px; }
.mb-4 { margin-bottom: 24px; }
.coupon-input-group { display: flex; gap: 8px; margin-bottom: 8px; }
.coupon-msg { font-size: 0.85rem; padding-top: 4px; }
.coupon-msg.success { color: var(--brand-secondary); }
.coupon-msg.error { color: #d13d18; }
.cart-item { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; padding: 16px 24px; }
.item-details { flex: 1; }
.item-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.item-header h3 { margin: 0; font-size: 1.1rem; }
.item-meta { display: flex; flex-direction: column; gap: 4px; font-size: 0.9rem; }
.item-base-price { font-weight: 500; }
.quantity-controls { display: flex; align-items: center; gap: 12px; background-color: var(--bg-primary); border-radius: 20px; padding: 4px 8px; }
.qty-btn { background: none; border: none; font-size: 1.2rem; font-weight: bold; cursor: pointer; color: var(--brand-primary); width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 50%; }
.qty-btn:hover { background-color: rgba(232, 74, 32, 0.1); }
.qty-display { font-weight: bold; min-width: 20px; text-align: center; }
.item-total { font-weight: bold; font-size: 1.1rem; min-width: 80px; text-align: right; }
.summary-card h3 { margin-bottom: 16px; font-size: 1.2rem; margin-top: 0;}
.border-top { border-top: 1px solid rgba(0,0,0,0.1); }
.summary-row { display: flex; justify-content: space-between; margin-bottom: 12px; }
.total-row { font-size: 1.2rem; font-weight: bold; margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(0,0,0,0.1); }
.form-group { display: flex; flex-direction: column; }
.form-group label { font-weight: 600; font-size: 0.9rem; margin-bottom: 4px; }
.form-input { width: 100%; padding: 10px 12px; border: 1px solid rgba(0,0,0,0.2); border-radius: 8px; font-family: var(--font-body); font-size: 1rem; }
.form-input:focus { outline: none; border-color: var(--brand-primary); }
.status-msg { padding: 12px; border-radius: 8px; text-align: center; font-weight: 500; }
.status-msg.success { background-color: #d4edda; color: #155724; }
.status-msg.error { background-color: #f8d7da; color: #721c24; }
.veg-indicator { width: 16px; height: 16px; border: 2px solid; border-radius: 4px; display: flex; align-items: center; justify-content: center; }
.veg-indicator .dot { width: 8px; height: 8px; border-radius: 50%; }
.veg-indicator.veg { border-color: var(--brand-secondary); }
.veg-indicator.veg .dot { background-color: var(--brand-secondary); }
.veg-indicator.non-veg { border-color: #d13d18; }
.veg-indicator.non-veg .dot { background-color: #d13d18; }
.empty-state { padding: 60px 0; color: var(--text-muted); font-size: 1.2rem; }
.w-100 { width: 100%; }
.mt-3 { margin-top: 12px; }
.mt-4 { margin-top: 16px; }
.pt-4 { padding-top: 16px; }
.text-center { text-align: center; }
.text-green { color: var(--brand-secondary); font-weight: bold; }
</style>

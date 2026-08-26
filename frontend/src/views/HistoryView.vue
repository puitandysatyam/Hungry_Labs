<template>
  <div class="container animate-fade-in">
    <div class="header-section">
      <h1 class="page-title">Order <span class="text-brand">History</span></h1>
      <p class="text-muted">Tracking all your delicious deliveries.</p>
    </div>

    <div v-if="isLoading" class="text-center" style="padding: 40px;">
      <p>Loading your past orders...</p>
    </div>

    <div v-else-if="error" class="error-state text-center card">
      <p style="color: #d13d18; font-weight: bold;">{{ error }}</p>
      <button @click="fetchOrders" class="btn btn-secondary mt-3">Try Again</button>
    </div>

    <div v-else-if="orders.length === 0" class="empty-state text-center">
      <p>You haven't placed any orders yet!</p>
      <router-link to="/menu" class="btn btn-primary mt-4">Browse Menu</router-link>
    </div>

    <div v-else class="orders-grid">
      <div v-for="order in orders" :key="order.id" class="card order-card">
        <div class="order-header border-bottom">
          <div>
            <span class="order-id">Order #{{ order.id }}</span>
            <span class="order-date text-muted"> • {{ formatDate(order.createdAt) }}</span>
          </div>
          <span :class="['status-badge', getStatusClass(order.status)]">{{ getFriendlyStatus(order.status) }}</span>
        </div>

        <div class="order-body">
          <ul class="item-list">
            <li v-for="item in order.orderItemList" :key="item.id">
              <span class="qty">{{ item.quantity }}x</span>
              <span class="name">{{ item.menuItem.name }}</span>
              <div v-if="item.addonList && item.addonList.length" class="addons text-muted">
                + {{ item.addonList.map(a => a.name).join(', ') }}
              </div>
            </li>
          </ul>
        </div>
        
        <div class="order-footer border-top">
          <div class="delivery-info">
            <small class="text-muted d-block">Delivered to:</small>
            <span>{{ order.deliveryAddress }}</span>
          </div>
          <div class="total-info">
            <small class="text-muted d-block">Total</small>
            <span class="amount text-brand">₹{{ order.totalAmount.toFixed(2) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const orders = ref([])
const isLoading = ref(true)
const error = ref(null)

const fetchOrders = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/orders/user/${authStore.user.id}`, {
      headers: authStore.getAuthHeaders()
    })
    
    if (!res.ok) throw new Error("Failed to load orders. Please try again.")
    
    orders.value = await res.json()
    // Optional: Sort so newest orders show up first
    orders.value.sort((a, b) => b.id - a.id) 
    
  } catch (err) {
    error.value = err.message
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchOrders()
})

const getFriendlyStatus = (status) => {
  switch (status) {
    case 'CONFIRMED': return 'Payment Successful - Preparing'
    case 'DELIVERED': return 'Order Completed'
    case 'PAYMENT_FAILED': return 'Payment Failed'
    case 'CANCEL_PENDING': return 'Refund Processing'
    case 'CANCELLED': return 'Order Canceled - Refunded'
    case 'MANUAL_REVIEW_REQUIRED': return 'Refund Failed - Contact Support'
    case 'ON_HOLD': return 'Payment Disputed - On Hold'
    case 'PAYMENT PENDING': return 'Awaiting Payment'
    default: return status
  }
}

const getStatusClass = (status) => {
  switch (status) {
    case 'CONFIRMED': 
    case 'DELIVERED': 
      return 'status-green'
    case 'PAYMENT PENDING': 
    case 'CANCEL_PENDING': 
    case 'ON_HOLD':
      return 'status-yellow'
    case 'CANCELLED': 
    case 'PAYMENT_FAILED': 
    case 'MANUAL_REVIEW_REQUIRED':
      return 'status-red'
    default: 
      return 'status-gray'
  }
}

// Very basic fallback date formatter (if backend doesn't send time, just show ID as reference)
const formatDate = (dateStr) => {
  if (!dateStr) return "Recent"
  return new Date(dateStr).toLocaleDateString()
}
</script>

<style scoped>
.header-section { margin-bottom: 32px; text-align: center; }
.orders-grid { display: flex; flex-direction: column; gap: 24px; max-width: 800px; margin: 0 auto; }
.order-card { padding: 0; overflow: hidden; transition: transform 0.2s ease, box-shadow 0.2s ease; }
.order-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }

.order-header { padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.02); }
.order-id { font-weight: bold; font-size: 1.1rem; }

.status-badge { padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: bold; }
.status-green { background: #d4edda; color: #155724; }
.status-yellow { background: #fff3cd; color: #856404; }
.status-red { background: #f8d7da; color: #721c24; }
.status-gray { background: #e2e3e5; color: #383d41; }

.order-body { padding: 24px; }
.item-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px;}
.item-list li { display: flex; flex-direction: column; }
.qty { font-weight: bold; color: var(--brand-primary); margin-right: 8px; }
.name { font-weight: 500; font-size: 1.05rem; }
.addons { font-size: 0.85rem; padding-left: 26px; }

.order-footer { padding: 16px 24px; display: flex; justify-content: space-between; align-items: flex-end; background: rgba(0,0,0,0.01); }
.delivery-info { font-size: 0.9rem; max-width: 70%; line-height: 1.4; }
.total-info { text-align: right; }
.amount { font-size: 1.3rem; font-weight: bold; }

.border-bottom { border-bottom: 1px solid rgba(0,0,0,0.05); }
.border-top { border-top: 1px solid rgba(0,0,0,0.05); }
.d-block { display: block; }
.mt-3 { margin-top: 12px; }
.mt-4 { margin-top: 16px; }

.animate-fade-in { animation: fadeIn 0.4s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>

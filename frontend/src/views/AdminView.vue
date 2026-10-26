<template>
  <div class="container animate-fade-in admin-container">
    <div class="header-section text-center">
      <h1 class="page-title">Lab <span class="text-brand">Command Center</span></h1>
      <p class="text-muted">Real-time Operations, Nutrition & Menu Management</p>
    </div>

    <div class="admin-tabs">
      <button :class="['tab-btn', { active: activeTab === 'orders' }]" @click="activeTab = 'orders'">Live Queue <span v-if="activeOrders.length" class="badge">{{activeOrders.length}}</span></button>
      <button :class="['tab-btn', { active: activeTab === 'history' }]" @click="activeTab = 'history'">Order History</button>
      <button :class="['tab-btn', { active: activeTab === 'menu' }]" @click="activeTab = 'menu'">Menu Items</button>
      <button :class="['tab-btn', { active: activeTab === 'addons' }]" @click="activeTab = 'addons'">Addons</button>
      <button :class="['tab-btn', { active: activeTab === 'coupons' }]" @click="activeTab = 'coupons'">Coupons</button>
      <button :class="['tab-btn', { active: activeTab === 'refunds' }]" @click="activeTab = 'refunds'">Refunds</button>
      <button :class="['tab-btn', { active: activeTab === 'carousel' }]" @click="activeTab = 'carousel'">Carousel/Offers</button>
    </div>

    <!-- ================= LIVE QUEUE TAB ================= -->
    <div v-if="activeTab === 'orders'" class="tab-content">
      <div class="section-header">
        <h3>Live Kitchen Queue</h3>
        <span class="text-muted text-sm">Auto-updates every 5s</span>
      </div>
      
      <div v-if="activeOrders.length === 0" class="empty-state card text-center">
        <p>No active orders in the queue right now.</p>
      </div>

      <div class="orders-grid">
        <div v-for="order in activeOrders" :key="order.id" class="card order-card">
          <div class="order-header">
            <h4>Order #{{ order.id }}</h4>
            <span :class="['status-badge', getStatusClass(order.status)]">{{ order.status }}</span>
          </div>
          <div class="order-body">
            <p><strong>Customer:</strong> {{ order.customerName }} ({{ order.customerPhone }})</p>
            <ul class="item-list mt-2">
              <li v-for="item in order.orderItemList" :key="item.id">
                <span class="qty">{{ item.quantity }}x</span> {{ item.menuItem.name }}
                <div v-if="item.addonList && item.addonList.length" class="text-muted text-sm pl-4">
                  + {{ item.addonList.map(a => a.name).join(', ') }}
                </div>
              </li>
            </ul>
          </div>
          <div class="order-actions mt-3">
            <button v-if="order.status === 'CONFIRMED'" @click="updateOrderStatus(order.id, 'PREPARING')" class="btn btn-secondary w-100 mb-2">Start Preparing</button>
            <button v-if="order.status === 'PREPARING'" @click="updateOrderStatus(order.id, 'OUT_FOR_DELIVERY')" class="btn btn-primary w-100 mb-2">Send for Delivery</button>
            <button v-if="order.status === 'OUT_FOR_DELIVERY'" @click="updateOrderStatus(order.id, 'DELIVERED')" class="btn btn-secondary w-100" style="background-color: #28a745; color: white;">Mark Delivered</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ================= ORDER HISTORY TAB ================= -->
    <div v-if="activeTab === 'history'" class="tab-content card">
      <div class="section-header">
        <h3>Order History</h3>
        <input type="text" v-model="orderSearch" placeholder="Search by ID or Status..." class="form-input search-input" />
      </div>

      <div class="table-responsive mt-3">
        <table class="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in filteredHistory" :key="order.id">
              <td>#{{ order.id }}</td>
              <td>{{ order.customerName }}</td>
              <td>₹{{ order.totalAmount.toFixed(2) }}</td>
              <td><span :class="['status-badge', getStatusClass(order.status)]">{{ order.status }}</span></td>
              <td>{{ new Date(order.createdAt).toLocaleDateString() }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ================= MENU ITEMS TAB ================= -->
    <div v-if="activeTab === 'menu'" class="tab-content card">
      <div class="section-header">
        <div>
          <h3 class="mb-0">Menu Management</h3>
          <small class="text-muted">Set pricing, veg/non-veg status, calories, and protein values</small>
        </div>
        <div class="actions-row">
          <input type="text" v-model="menuSearch" placeholder="Search menu..." class="form-input search-input" />
          <button @click="openMenuModal()" class="btn btn-primary">+ Add New Item</button>
        </div>
      </div>

      <div class="table-responsive mt-3">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Nutrition</th>
              <th>Diet</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredMenu" :key="item.id">
              <td><img :src="item.imageUrl" alt="img" class="table-img" v-if="item.imageUrl" /></td>
              <td>
                <strong>{{ item.name }}</strong>
                <div v-if="item.desc" class="text-muted text-xs truncate-desc">{{ item.desc }}</div>
              </td>
              <td><span class="cat-pill">{{ item.category }}</span></td>
              <td><strong>₹{{ item.price }}</strong></td>
              <td>
                <div class="nutri-pills">
                  <span class="badge-nutri cal-badge">🔥 {{ item.calories || 0 }} kcal</span>
                  <span class="badge-nutri pro-badge">💪 {{ item.protein || 0 }}g</span>
                </div>
              </td>
              <td>
                <span :class="['diet-tag', item.veg ? 'diet-veg' : 'diet-nonveg']">
                  {{ item.veg ? '🌱 Veg' : '🍗 Non-Veg' }}
                </span>
              </td>
              <td>
                <div class="table-btn-group">
                  <button @click="openMenuModal(item)" class="btn btn-secondary btn-sm">Edit</button>
                  <button @click="deleteMenu(item.id)" class="btn btn-danger btn-sm">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ================= ADDONS TAB ================= -->
    <div v-if="activeTab === 'addons'" class="tab-content card">
      <div class="section-header">
        <div>
          <h3 class="mb-0">Addons Management</h3>
          <small class="text-muted">Manage extra toppings, sauces, and their nutritional breakdown</small>
        </div>
        <button @click="openAddonModal()" class="btn btn-primary">+ Add New Addon</button>
      </div>

      <div class="table-responsive mt-3">
        <table class="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Extra Price</th>
              <th>Nutrition Breakdown</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="addon in allAddons" :key="addon.id">
              <td>#{{ addon.id }}</td>
              <td><strong>{{ addon.name }}</strong></td>
              <td><strong>₹{{ addon.price }}</strong></td>
              <td>
                <div class="nutri-pills">
                  <span class="badge-nutri cal-badge">🔥 {{ addon.calories || 0 }} kcal</span>
                  <span class="badge-nutri pro-badge">💪 {{ addon.protein || 0 }}g</span>
                </div>
              </td>
              <td>
                <div class="table-btn-group">
                  <button @click="openAddonModal(addon)" class="btn btn-secondary btn-sm">Edit</button>
                  <button @click="deleteAddon(addon.id)" class="btn btn-danger btn-sm">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ================= CAROUSEL TAB ================= -->
    <div v-if="activeTab === 'carousel'" class="tab-content card">
      <div class="section-header">
        <h3>Home Page Carousel Management</h3>
        <button @click="openCarouselModal()" class="btn btn-primary">Add New Slide</button>
      </div>
      <div class="table-responsive mt-3">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Status</th>
              <th>Order</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="slide in carouselImages" :key="slide.id">
              <td><img :src="slide.imageUrl" class="table-img" style="width: 80px; height: auto;" /></td>
              <td>{{ slide.active ? 'Active' : 'Hidden' }}</td>
              <td>{{ slide.order }}</td>
              <td>
                <button @click="openCarouselModal(slide)" class="btn btn-secondary btn-sm" style="margin-right:8px;">Edit</button>
                <button v-if="slide.id > 0" @click="deleteCarousel(slide.id)" class="btn btn-primary btn-sm" style="background:#d13d18;">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- Carousel Modal -->
    <div v-if="showCarouselModal" class="modal-overlay" @click.self="showCarouselModal = false">
      <div class="modal-content card" style="max-width: 500px;">
        <h3 class="mb-3">{{ carouselForm.id ? 'Edit Slide' : 'Add Slide' }}</h3>
        <form @submit.prevent="handleCarouselSubmit" class="admin-form">
          <div class="form-group image-upload-group">
            <label>Banner Image</label>
            <div class="upload-area" :class="{ 'has-file': selectedFile }">
              <input type="file" @change="handleFileChange" accept="image/*" class="file-input" />
              <span v-if="!selectedFile">Click to select new image...</span>
              <span v-else class="text-brand font-weight-bold">{{ selectedFile.name }} (Ready to upload)</span>
            </div>
            <small v-if="carouselForm.imageUrl && !selectedFile" class="text-muted mt-1 d-block">Current image exists. Uploading a new one will replace it.</small>
            <small class="text-muted mt-1 d-block">Or use local asset path like '/assets/Menu 1.png' (Leave file blank)</small>
            <input type="text" v-model="carouselForm.imageUrl" placeholder="/assets/hero.png" class="form-input mt-2" v-if="!selectedFile" />
          </div>
          
          <div class="form-row mt-2">
            <div class="form-group flex-1">
              <label>Order (Sequence)</label>
              <input type="number" v-model="carouselForm.order" required class="form-input" />
            </div>
            <div class="form-group flex-1">
              <label>Status</label>
              <div class="checkbox-group" style="margin-top: 10px;">
                <input type="checkbox" v-model="carouselForm.active" />
                <span>Is Active</span>
              </div>
            </div>
          </div>
          <div class="modal-actions mt-4">
            <button type="button" class="btn btn-secondary" @click="showCarouselModal = false">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="isUploading">{{ isUploading ? 'Saving...' : 'Save Slide' }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- ================= COUPONS TAB ================= -->
    <div v-if="activeTab === 'coupons'" class="tab-content card">
      <h3>Create Coupon Campaign</h3>
      <form @submit.prevent="handleCouponSubmit" class="admin-form mt-3">
        <div class="form-group">
          <label>Coupon Code</label>
          <input type="text" v-model="couponForm.code" required class="form-input" style="text-transform: uppercase;" />
        </div>
        <div class="form-row">
          <div class="form-group flex-1">
            <label>Discount Type</label>
            <select v-model="couponForm.discountType" class="form-input">
              <option value="PERCENTAGE">Percentage (%)</option>
              <option value="FLAT">Flat Amount (₹)</option>
            </select>
          </div>
          <div class="form-group flex-1">
            <label>Discount Value</label>
            <input type="number" v-model="couponForm.discountValue" required class="form-input" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group flex-1">
            <label>Minimum Order Value (₹)</label>
            <input type="number" v-model="couponForm.minOrderValue" required class="form-input" />
          </div>
          <div class="form-group checkbox-group flex-1">
            <input type="checkbox" id="isActive" v-model="couponForm.active" />
            <label for="isActive">Campaign Active</label>
          </div>
        </div>
        <button type="submit" class="btn btn-primary">Save Coupon</button>
        <p v-if="couponStatus" class="status-msg mt-3">{{ couponStatus }}</p>
      </form>
    </div>

    <!-- ================= REFUNDS TAB ================= -->
    <div v-if="activeTab === 'refunds'" class="tab-content card">
      <div class="section-header">
        <div>
          <h3 class="mb-0">Refund Management</h3>
          <small class="text-muted">Issue refunds for paid orders. Full or partial refunds supported.</small>
        </div>
        <button @click="fetchRefundableOrders" class="btn btn-secondary btn-sm">Refresh</button>
      </div>

      <div v-if="refundLoading" class="text-center" style="padding: 20px;">
        <p>Loading refundable orders...</p>
      </div>

      <div v-else-if="refundableOrders.length === 0" class="empty-state text-center card">
        <p>No refundable orders found.</p>
        <p class="text-sm text-muted">Orders must be CONFIRMED or DELIVERED, paid, and not already refunded.</p>
      </div>

      <div v-else class="table-responsive mt-3">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Refundable Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in refundableOrders" :key="order.id">
              <td>#{{ order.id }}</td>
              <td>
                <strong>{{ order.customerName }}</strong>
                <div class="text-muted text-sm">{{ order.customerEmail }}</div>
              </td>
              <td><strong>₹{{ order.totalAmount.toFixed(2) }}</strong></td>
              <td>
                <span :class="['status-badge', getStatusClass(order.status)]">{{ order.status }}</span>
              </td>
              <td><strong>₹{{ order.totalAmount.toFixed(2) }}</strong></td>
              <td>
                <div class="table-btn-group">
                  <button @click="openRefundModal(order)" class="btn btn-secondary btn-sm">Refund</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Refund Modal -->
    <div v-if="showRefundModal" class="modal-overlay" @click.self="showRefundModal = false">
      <div class="modal-content card" style="max-width: 480px;">
        <h3 class="mb-3">{{ refundForm.id ? 'Issue Refund' : 'Issue Refund' }}</h3>
        <form @submit.prevent="handleRefundSubmit" class="admin-form">
          <div class="form-group">
            <label>Order ID</label>
            <input type="text" :value="refundForm.orderId" readonly class="form-input" />
          </div>
          <div class="form-group">
            <label>Customer</label>
            <input type="text" :value="refundForm.customerName" readonly class="form-input" />
          </div>
          <div class="form-group">
            <label>Order Amount (₹)</label>
            <input type="text" :value="refundForm.orderAmount" readonly class="form-input" />
          </div>
          <div class="form-group">
            <label>Refund Amount (₹)</label>
            <input type="number" v-model.number="refundForm.amount" required min="0" :max="refundForm.orderAmount" class="form-input" />
          </div>
          <div class="form-group">
            <label>Reason</label>
            <textarea v-model="refundForm.reason" rows="2" placeholder="e.g. Customer cancelled, wrong item delivered" class="form-input"></textarea>
          </div>
          <div class="modal-actions mt-4">
            <button type="button" class="btn btn-secondary" @click="showRefundModal = false">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="isRefunding">{{ isRefunding ? 'Processing...' : 'Issue Refund' }}</button>
          </div>
          <p v-if="refundStatus" class="status-msg mt-3" :class="refundStatus.type">{{ refundStatus.text }}</p>
        </form>
      </div>
    </div>

    <!-- ================= MODALS ================= -->
    <!-- Menu Modal -->
    <div v-if="showMenuModal" class="modal-overlay" @click.self="showMenuModal = false">
      <div class="modal-content card">
        <h3 class="mb-3">{{ menuForm.id ? 'Edit Menu Item' : 'Add Menu Item' }}</h3>
        <form @submit.prevent="handleMenuSubmit" class="admin-form">
          <div class="form-group image-upload-group">
            <label>Food Image</label>
            <div class="upload-area" :class="{ 'has-file': selectedFile }">
              <input type="file" @change="handleFileChange" accept="image/*" class="file-input" />
              <span v-if="!selectedFile">Click to select new image...</span>
              <span v-else class="text-brand font-weight-bold">{{ selectedFile.name }} (Ready to upload)</span>
            </div>
            <small v-if="menuForm.imageUrl && !selectedFile" class="text-muted mt-1 d-block">Current image exists. Uploading a new one will replace it.</small>
          </div>

          <div class="form-row">
            <div class="form-group flex-1">
              <label>Name</label>
              <input type="text" v-model="menuForm.name" required placeholder="e.g. Smash Double Burger" class="form-input" />
            </div>
            <div class="form-group flex-1">
              <label>Category</label>
              <input type="text" v-model="menuForm.category" required placeholder="e.g. Burgers, Wraps, Drinks" class="form-input" />
            </div>
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea v-model="menuForm.desc" rows="2" placeholder="Ingredients, savory sauce notes, etc." class="form-input"></textarea>
          </div>
          <div class="form-row">
            <div class="form-group flex-1">
              <label>Price (₹)</label>
              <input type="number" v-model.number="menuForm.price" required min="0" class="form-input" />
            </div>
            <div class="form-group checkbox-group flex-1" style="margin-top: 28px;">
              <input type="checkbox" id="isVeg" v-model="menuForm.isVeg" />
              <label for="isVeg" style="cursor: pointer;">Is Pure Vegetarian?</label>
            </div>
          </div>

          <!-- Nutritional Data (Calories & Protein) -->
          <div class="nutri-form-box">
            <div class="nutri-box-title">
              <span>Nutritional Facts</span>
              <small class="text-muted">(Displayed prominently on food cards)</small>
            </div>
            <div class="form-row mt-2">
              <div class="form-group flex-1">
                <label>🔥 Calories (kcal)</label>
                <input type="number" v-model.number="menuForm.calories" min="0" placeholder="e.g. 520" class="form-input" />
              </div>
              <div class="form-group flex-1">
                <label>💪 Protein (grams)</label>
                <input type="number" step="0.1" v-model.number="menuForm.protein" min="0" placeholder="e.g. 24.5" class="form-input" />
              </div>
            </div>
          </div>
          
          <div class="form-group mt-2">
            <label>Available Addons</label>
            <div class="addon-selection-box border rounded p-3" style="max-height: 150px; overflow-y: auto;">
              <div v-for="addon in allAddons" :key="addon.id" class="checkbox-group mb-1">
                <input type="checkbox" :id="'addon_'+addon.id" :value="addon" v-model="menuForm.addonList" />
                <label :for="'addon_'+addon.id">
                  {{ addon.name }} (+₹{{ addon.price }})
                  <span v-if="addon.calories || addon.protein" class="text-muted text-xs">
                    • {{ addon.calories || 0 }} cal, {{ addon.protein || 0 }}g pro
                  </span>
                </label>
              </div>
              <p v-if="!allAddons.length" class="text-muted text-sm">No addons available. Create them in the Addons tab.</p>
            </div>
          </div>

          <div class="modal-actions mt-4">
            <button type="button" class="btn btn-secondary" @click="showMenuModal = false">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="isUploading">
              {{ isUploading ? 'Saving...' : 'Save Item' }}
            </button>
          </div>
          <p v-if="menuStatus" class="status-msg mt-3">{{ menuStatus }}</p>
        </form>
      </div>
    </div>

    <!-- Addon Modal -->
    <div v-if="showAddonModal" class="modal-overlay" @click.self="showAddonModal = false">
      <div class="modal-content card" style="max-width: 480px;">
        <h3 class="mb-3">{{ addonForm.id ? 'Edit Addon' : 'Add Addon' }}</h3>
        <form @submit.prevent="handleAddonSubmit" class="admin-form">
          <div class="form-group">
            <label>Addon Name</label>
            <input type="text" v-model="addonForm.name" required placeholder="e.g. Extra Cheese Slice, Chipotle Dip" class="form-input" />
          </div>
          <div class="form-group mt-2">
            <label>Extra Price (₹)</label>
            <input type="number" v-model.number="addonForm.price" required min="0" placeholder="e.g. 30" class="form-input" />
          </div>

          <!-- Addon Nutritional Data (Calories & Protein) -->
          <div class="nutri-form-box mt-3">
            <div class="nutri-box-title">
              <span>Nutritional Facts</span>
              <small class="text-muted">(Contribution per addon)</small>
            </div>
            <div class="form-row mt-2">
              <div class="form-group flex-1">
                <label>🔥 Calories (kcal)</label>
                <input type="number" v-model.number="addonForm.calories" min="0" placeholder="e.g. 80" class="form-input" />
              </div>
              <div class="form-group flex-1">
                <label>💪 Protein (grams)</label>
                <input type="number" step="0.1" v-model.number="addonForm.protein" min="0" placeholder="e.g. 4.0" class="form-input" />
              </div>
            </div>
          </div>

          <div class="modal-actions mt-4">
            <button type="button" class="btn btn-secondary" @click="showAddonModal = false">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Addon</button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import imageCompression from 'browser-image-compression'

const authStore = useAuthStore()
const activeTab = ref('orders')

// State
const activeOrders = ref([])
const orderHistory = ref([])
const orderSearch = ref('')
let pollingInterval = null

const allMenu = ref([])
const menuSearch = ref('')

const allAddons = ref([])

// Fetch Logic
const fetchActiveOrders = async () => {
  if (activeTab.value !== 'orders') return
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/admin/orders/active`, { headers: authStore.getAuthHeaders() })
    if (res.ok) activeOrders.value = await res.json()
  } catch (e) { console.error("Poll failed", e) }
}

const fetchOrderHistory = async () => {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/admin/orders`, { headers: authStore.getAuthHeaders() })
    if (res.ok) orderHistory.value = await res.json()
  } catch (e) { console.error(e) }
}

const fetchMenu = async () => {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/menu`)
    if (res.ok) allMenu.value = await res.json()
  } catch (e) { console.error(e) }
}

const fetchAddons = async () => {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/admin/addons`, { headers: authStore.getAuthHeaders() })
    if (res.ok) allAddons.value = await res.json()
  } catch (e) { console.error(e) }
}

const updateOrderStatus = async (id, status) => {
  try {
    await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/admin/orders/${id}/status?status=${status}`, {
      method: 'PUT',
      headers: authStore.getAuthHeaders()
    })
    fetchActiveOrders()
  } catch (e) { console.error(e) }
}

// Polling and Lifecycle
onMounted(() => {
  fetchActiveOrders()
  fetchMenu()
  fetchAddons()
  pollingInterval = setInterval(fetchActiveOrders, 5000) // 5s short polling
})
onUnmounted(() => {
  if (pollingInterval) clearInterval(pollingInterval)
})

// Tab Watcher
watch(activeTab, (newTab) => {
  if (newTab === 'history') fetchOrderHistory()
  if (newTab === 'menu') fetchMenu()
  if (newTab === 'addons') fetchAddons()
  if (newTab === 'refunds') fetchRefundableOrders()
})

// Computed Filters
const filteredHistory = computed(() => {
  if (!orderSearch.value) return orderHistory.value
  const s = orderSearch.value.toLowerCase()
  return orderHistory.value.filter(o => 
    o.id.toString().includes(s) || o.status.toLowerCase().includes(s)
  )
})
const filteredMenu = computed(() => {
  if (!menuSearch.value) return allMenu.value
  const s = menuSearch.value.toLowerCase()
  return allMenu.value.filter(m => m.name.toLowerCase().includes(s) || m.category.toLowerCase().includes(s))
})

// Menu Modal & Form
const showMenuModal = ref(false)
const isUploading = ref(false)
const menuStatus = ref('')
const selectedFile = ref(null)
const menuForm = ref({
  id: null,
  name: '',
  category: '',
  desc: '',
  price: 0,
  calories: 0,
  protein: 0,
  isVeg: true,
  imageUrl: '',
  addonList: []
})

const openMenuModal = (item = null) => {
  menuStatus.value = ''
  selectedFile.value = null
  if (item) {
    menuForm.value = {
      ...item,
      calories: item.calories !== undefined && item.calories !== null ? item.calories : 0,
      protein: item.protein !== undefined && item.protein !== null ? item.protein : 0,
      isVeg: item.veg !== undefined ? Boolean(item.veg) : true,
      addonList: item.addons || item.addonList || []
    }
  } else {
    menuForm.value = {
      id: null,
      name: '',
      category: '',
      desc: '',
      price: 0,
      calories: 0,
      protein: 0,
      isVeg: true,
      imageUrl: '',
      addonList: []
    }
  }
  showMenuModal.value = true
}

const handleFileChange = (e) => { if (e.target.files.length > 0) selectedFile.value = e.target.files[0] }

// Unified High-Speed Image Upload (Cloudinary with B2 fallback)
const uploadSelectedFile = async (file, folder = 'hungry-lab/menu') => {
  const options = { maxSizeMB: 0.8, maxWidthOrHeight: 1200, useWebWorker: true, fileType: 'image/webp' };
  const compressedFile = await imageCompression(file, options);
  const filename = file.name.replace(/\.[^/.]+$/, "") + ".webp";

  const presignRes = await fetch(
    `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/admin/upload-url?filename=${encodeURIComponent(filename)}&folder=${encodeURIComponent(folder)}&contentType=image/webp`,
    { headers: authStore.getAuthHeaders() }
  );

  if (!presignRes.ok) throw new Error("Upload authorization failed.");
  const presignData = await presignRes.json();

  // 1. High-speed Cloudinary direct upload
  if (presignData.provider === 'cloudinary') {
    const formData = new FormData();
    formData.append('file', compressedFile);
    formData.append('api_key', presignData.apiKey);
    formData.append('timestamp', presignData.timestamp);
    formData.append('signature', presignData.signature);
    formData.append('folder', presignData.folder);

    const cldRes = await fetch(presignData.uploadUrl, {
      method: 'POST',
      body: formData
    });

    if (!cldRes.ok) {
      const errText = await cldRes.text();
      throw new Error("Cloudinary upload failed: " + errText);
    }

    const cldJson = await cldRes.json();
    return cldJson.secure_url.replace('/image/upload/', '/image/upload/f_auto,q_auto/');
  }

  // 2. Legacy B2 S3 storage fallback
  const uploadUrl = presignData.uploadUrl;
  const targetUrl = uploadUrl.includes("backblazeb2.com") && import.meta.env.DEV
    ? uploadUrl.replace("https://s3.us-east-005.backblazeb2.com", "/b2api")
    : uploadUrl;

  const uploadRes = await fetch(targetUrl, {
    method: 'PUT',
    body: compressedFile,
    headers: { 'Content-Type': 'image/webp' }
  });

  if (!uploadRes.ok) throw new Error("Cloud upload failed.");
  return presignData.finalUrl;
};

const handleMenuSubmit = async () => {
  isUploading.value = true
  menuStatus.value = ''
  try {
    let finalImageUrl = menuForm.value.imageUrl;
    if (selectedFile.value) {
      finalImageUrl = await uploadSelectedFile(selectedFile.value, 'hungry-lab/menu');
    }
    
    const payload = {
      ...menuForm.value,
      calories: Number(menuForm.value.calories || 0),
      protein: Number(menuForm.value.protein || 0),
      imageUrl: finalImageUrl
    }
    const url = payload.id ? `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/admin/menu/${payload.id}` : `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/admin/menu`
    const method = payload.id ? 'PUT' : 'POST'
    
    const res = await fetch(url, { method, headers: { ...authStore.getAuthHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (!res.ok) throw new Error("Database save failed.")
    
    showMenuModal.value = false
    fetchMenu()
  } catch (err) {
    menuStatus.value = "Error: " + err.message
  } finally {
    isUploading.value = false
  }
}

// Addon Modal & Form
const showAddonModal = ref(false)
const addonForm = ref({ id: null, name: '', price: 0, calories: 0, protein: 0 })

const openAddonModal = (item = null) => {
  addonForm.value = item
    ? {
        ...item,
        calories: item.calories !== undefined && item.calories !== null ? item.calories : 0,
        protein: item.protein !== undefined && item.protein !== null ? item.protein : 0
      }
    : { id: null, name: '', price: 0, calories: 0, protein: 0 }
  showAddonModal.value = true
}

const handleAddonSubmit = async () => {
  try {
    const payload = {
      ...addonForm.value,
      calories: Number(addonForm.value.calories || 0),
      protein: Number(addonForm.value.protein || 0)
    }
    const url = payload.id ? `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/admin/addons/${payload.id}` : `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/admin/addons`
    const method = payload.id ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { ...authStore.getAuthHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (!res.ok) throw new Error("Failed to save addon.")
    showAddonModal.value = false
    fetchAddons()
  } catch (e) {
    console.error(e)
    alert("Error saving addon: " + e.message)
  }
}

// Coupons Form
const couponForm = ref({ code: '', discountType: 'PERCENTAGE', discountValue: 0, minOrderValue: 0, active: true })
const couponStatus = ref('')
const handleCouponSubmit = async () => {
  couponStatus.value = ''
  try {
    couponForm.value.code = couponForm.value.code.toUpperCase()
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/admin/coupons`, { method: 'POST', headers: { ...authStore.getAuthHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify(couponForm.value) })
    if (!res.ok) throw new Error("Failed to save.")
    couponStatus.value = "Coupon Activated!"
    couponForm.value = { code: '', discountType: 'PERCENTAGE', discountValue: 0, minOrderValue: 0, active: true }
  } catch (err) { couponStatus.value = "Error: " + err.message }
}

// Refunds State
const refundableOrders = ref([])
const refundLoading = ref(false)
const showRefundModal = ref(false)
const refundStatus = ref(null)
const isRefunding = ref(false)
const refundForm = ref({
  id: null,
  orderId: '',
  customerName: '',
  orderAmount: 0,
  amount: 0,
  reason: ''
})

const fetchRefundableOrders = async () => {
  refundLoading.value = true
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/admin/orders`, { headers: authStore.getAuthHeaders() })
    if (!res.ok) throw new Error("Failed to load orders.")
    const allOrders = await res.json()
    // Filter: CONFIRMED or DELIVERED orders that are paid and not refunded
    refundableOrders.value = allOrders.filter(o => 
      (o.status === 'CONFIRMED' || o.status === 'DELIVERED') && o.payment && o.payment.status === 'SUCCESS' && !o.payment.refunded
    )
  } catch (e) {
    console.error(e)
    alert("Failed to load refundable orders: " + e.message)
  } finally {
    refundLoading.value = false
  }
}

const openRefundModal = (order) => {
  refundForm.value = {
    id: order.id,
    orderId: '#' + order.id,
    customerName: order.customerName || 'Unknown',
    orderAmount: order.totalAmount,
    amount: order.totalAmount,
    reason: ''
  }
  refundStatus.value = null
  showRefundModal.value = true
}

const handleRefundSubmit = async () => {
  if (!refundForm.value.amount || refundForm.value.amount <= 0) {
    refundStatus.value = { type: 'error', text: "Please enter a valid refund amount." }
    return
  }
  if (refundForm.value.amount > refundForm.value.orderAmount) {
    refundStatus.value = { type: 'error', text: "Refund amount cannot exceed order amount." }
    return
  }

  isRefunding.value = true
  refundStatus.value = null
  try {
    // Convert ₹ to paise for backend
    const amountInPaise = Math.round(refundForm.value.amount * 100)
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/admin/payment/refund/${refundForm.value.id}`, {
      method: 'POST',
      headers: { ...authStore.getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: amountInPaise,
        reason: refundForm.value.reason || 'Admin-initiated refund'
      })
    })

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}))
      throw new Error(errJson.error || "Refund failed.")
    }

    const result = await res.json()
    refundStatus.value = { type: 'success', text: `Refund of ₹${refundForm.value.amount.toFixed(2)} issued successfully! Refund ID: ${result.refundId}` }
    
    // Remove from list and refresh
    refundableOrders.value = refundableOrders.value.filter(o => o.id !== refundForm.value.id)
    
    // Auto-close after 2 seconds
    setTimeout(() => {
      showRefundModal.value = false
    }, 2000)
  } catch (err) {
    refundStatus.value = { type: 'error', text: "Refund failed: " + err.message }
  } finally {
    isRefunding.value = false
  }
}

// Helpers
const getStatusClass = (s) => {
  if (['CONFIRMED', 'DELIVERED', 'SUCCESS'].includes(s)) return 'status-green'
  if (['PREPARING', 'OUT_FOR_DELIVERY', 'PENDING'].includes(s)) return 'status-yellow'
  if (['CANCELLED', 'FAILED', 'REFUNDED'].includes(s)) return 'status-red'
  return 'status-gray'
}

// ==== CAROUSEL LOGIC ====
const carouselImages = ref([])
const showCarouselModal = ref(false)
const carouselForm = ref({ id: null, imageUrl: '', order: 0, active: true })

const fetchCarouselImages = async () => {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/admin/carousel`, { headers: authStore.getAuthHeaders() })
    if (res.ok) carouselImages.value = await res.json()
  } catch (e) {}
}

const openCarouselModal = (item = null) => {
  selectedFile.value = null
  carouselForm.value = item && item.id ? { ...item } : { id: null, imageUrl: '', order: carouselImages.value.length, active: true }
  showCarouselModal.value = true
}

const handleCarouselSubmit = async () => {
  isUploading.value = true
  try {
    let finalImageUrl = carouselForm.value.imageUrl;
    if (selectedFile.value) {
      finalImageUrl = await uploadSelectedFile(selectedFile.value, 'hungry-lab/carousel');
    }
    
    const payload = { ...carouselForm.value, imageUrl: finalImageUrl }
    const url = payload.id > 0 ? `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/admin/carousel/${payload.id}` : `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/admin/carousel`
    const method = payload.id > 0 ? 'PUT' : 'POST'
    
    const res = await fetch(url, { method, headers: { ...authStore.getAuthHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (!res.ok) throw new Error("Database save failed.")
    
    showCarouselModal.value = false
    fetchCarouselImages()
  } catch (err) {
    alert("Error: " + err.message)
  } finally {
    isUploading.value = false
  }
}

const deleteCarousel = async (id) => {
  if(!confirm('Are you sure you want to delete this slide?')) return;
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/admin/carousel/${id}`, { method: 'DELETE', headers: authStore.getAuthHeaders() })
    if(res.ok) fetchCarouselImages()
  } catch (e) {}
}

const deleteMenu = async (id) => {
  if(!confirm('Are you sure you want to delete this menu item?')) return;
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/admin/menu/${id}`, { method: 'DELETE', headers: authStore.getAuthHeaders() })
    if(!res.ok) { let e = await res.json(); alert(e.error || 'Cannot delete item'); return; }
    fetchMenu()
  } catch(e) {}
}

const deleteAddon = async (id) => {
  if(!confirm('Are you sure you want to delete this addon?')) return;
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/admin/addons/${id}`, { method: 'DELETE', headers: authStore.getAuthHeaders() })
    if(!res.ok) { let e = await res.json(); alert(e.error || 'Cannot delete addon'); return; }
    fetchAddons()
  } catch(e) {}
}

fetchCarouselImages()
// ==== END CAROUSEL LOGIC ====

</script>


<style scoped>
.admin-container { padding-bottom: 60px; max-width: 1100px; margin: 0 auto; }
.header-section { margin-bottom: 28px; }
.admin-tabs { display: flex; justify-content: center; gap: 10px; margin-bottom: 24px; flex-wrap: wrap; }
.tab-btn {
  background: white;
  border: 1.5px solid rgba(0,0,0,0.08);
  padding: 10px 18px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  color: var(--text-muted);
  border-radius: 999px;
  position: relative;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
}
.tab-btn:hover {
  border-color: rgba(232, 74, 32, 0.3);
  color: var(--brand-primary);
  transform: translateY(-1px);
}
.tab-btn.active {
  color: white;
  background: var(--brand-primary);
  border-color: var(--brand-primary);
  box-shadow: 0 4px 12px rgba(232, 74, 32, 0.25);
}
.badge {
  background: #fff;
  color: var(--brand-primary);
  font-weight: 800;
  border-radius: 50%;
  padding: 1px 7px;
  font-size: 0.75rem;
  position: absolute;
  top: -6px;
  right: -6px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.15);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1.5px solid rgba(0,0,0,0.06);
  padding-bottom: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}
.actions-row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.search-input { min-width: 240px; }

/* Orders Grid */
.orders-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
.order-card { padding: 18px; display: flex; flex-direction: column; border-radius: 14px; }
.order-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 12px;}
.order-header h4 { margin: 0; font-size: 1.1rem; }
.item-list { list-style: none; padding: 0; margin: 0; }
.item-list li { margin-bottom: 6px; }
.qty { font-weight: bold; color: var(--brand-primary); }
.order-actions { margin-top: auto; }

/* Tables */
.table-responsive { overflow-x: auto; -webkit-overflow-scrolling: touch; }
.admin-table { width: 100%; border-collapse: collapse; min-width: 600px; }
.admin-table th, .admin-table td { padding: 14px 12px; text-align: left; border-bottom: 1px solid rgba(0,0,0,0.06); vertical-align: middle; }
.admin-table th { font-weight: 700; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); background: rgba(0,0,0,0.02); }
.table-img { width: 44px; height: 44px; border-radius: 10px; object-fit: cover; border: 1.5px solid rgba(0,0,0,0.06); }
.table-btn-group { display: flex; gap: 8px; }

/* Nutritional Badges */
.nutri-pills { display: flex; flex-direction: column; gap: 4px; }
.badge-nutri {
  display: inline-flex;
  align-items: center;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 6px;
  white-space: nowrap;
}
.cal-badge {
  background: rgba(232, 74, 32, 0.1);
  color: #c93b12;
  border: 1px solid rgba(232, 74, 32, 0.2);
}
.pro-badge {
  background: rgba(59, 130, 246, 0.1);
  color: #2563eb;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

/* Category & Diet Tags */
.cat-pill {
  font-size: 0.8rem;
  font-weight: 600;
  background: #f1f3f5;
  color: #495057;
  padding: 3px 9px;
  border-radius: 999px;
}
.diet-tag {
  display: inline-block;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 6px;
}
.diet-veg { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
.diet-nonveg { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }

.truncate-desc {
  max-width: 220px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.btn-danger {
  background: #dc2626;
  color: white;
  border: none;
}
.btn-danger:hover {
  background: #b91c1c;
}

/* Status Badges */
.status-badge { padding: 4px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: bold; }
.status-green { background: #d4edda; color: #155724; }
.status-yellow { background: #fff3cd; color: #856404; }
.status-red { background: #f8d7da; color: #721c24; }
.status-gray { background: #e2e3e5; color: #383d41; }

/* Modals */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px; }
.modal-content { width: 100%; max-width: 620px; max-height: 92vh; overflow-y: auto; padding: 26px; border-radius: 16px; box-shadow: 0 16px 40px rgba(0,0,0,0.2); }
.modal-actions { display: flex; justify-content: flex-end; gap: 12px; }

/* Nutritional Form Box inside Modals */
.nutri-form-box {
  background: #fafafa;
  border: 1.5px dashed #e2e8f0;
  border-radius: 12px;
  padding: 14px 16px;
  margin-top: 8px;
}
.nutri-box-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 700;
  font-size: 0.88rem;
  color: #334155;
  margin-bottom: 4px;
}

/* Forms */
.admin-form { display: flex; flex-direction: column; gap: 16px; }
.form-row { display: flex; gap: 14px; flex-wrap: wrap; }
.flex-1 { flex: 1; min-width: 140px; }
.form-group { display: flex; flex-direction: column; }
.form-group label { font-size: 0.88rem; font-weight: 700; margin-bottom: 6px; color: #2d3748; }
.form-input { padding: 10px 14px; border: 1.5px solid rgba(0,0,0,0.12); border-radius: 10px; font-family: inherit; font-size: 0.92rem; transition: border-color 0.2s; }
.form-input:focus { outline: none; border-color: var(--brand-primary); box-shadow: 0 0 0 3px rgba(232, 74, 32, 0.1); }
.checkbox-group { display: flex; align-items: center; gap: 8px; }
.checkbox-group input[type="checkbox"] { width: 18px; height: 18px; accent-color: var(--brand-primary); cursor: pointer; }
.upload-area { border: 2px dashed rgba(0,0,0,0.2); padding: 20px; border-radius: 10px; text-align: center; cursor: pointer; position: relative; background: rgba(0,0,0,0.02);}
.upload-area:hover, .upload-area.has-file { border-color: var(--brand-primary); }
.file-input { position: absolute; top:0; left:0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }

.d-block { display: block; }
.w-100 { width: 100%; }
.mb-0 { margin-bottom: 0; }
.mb-1 { margin-bottom: 4px; }
.mb-2 { margin-bottom: 8px; }
.mb-3 { margin-bottom: 16px; }
.mt-1 { margin-top: 4px; }
.mt-2 { margin-top: 8px; }
.mt-3 { margin-top: 12px; }
.mt-4 { margin-top: 16px; }
.p-3 { padding: 12px; }
.pl-4 { padding-left: 16px; }
.text-sm { font-size: 0.85rem; }
.text-xs { font-size: 0.75rem; }
.border { border: 1px solid rgba(0,0,0,0.12); }
.rounded { border-radius: 10px; }
.animate-fade-in { animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

@media (max-width: 640px) {
  .section-header { flex-direction: column; align-items: flex-start; }
  .actions-row { width: 100%; }
  .search-input { width: 100%; }
  .form-row { flex-direction: column; }
  .tab-btn { padding: 8px 14px; font-size: 0.85rem; }
}

.btn-sm { padding: 6px 12px; font-size: 0.85rem; }
</style>

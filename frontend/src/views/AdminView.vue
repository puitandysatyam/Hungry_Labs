<template>
  <div class="container animate-fade-in admin-container">
    <div class="header-section text-center">
      <h1 class="page-title">Lab <span class="text-brand">Command Center</span></h1>
      <p class="text-muted">Real-time Operations & Menu Management</p>
    </div>

    <div class="admin-tabs">
      <button :class="['tab-btn', { active: activeTab === 'orders' }]" @click="activeTab = 'orders'">Live Queue <span v-if="activeOrders.length" class="badge">{{activeOrders.length}}</span></button>
      <button :class="['tab-btn', { active: activeTab === 'history' }]" @click="activeTab = 'history'">Order History</button>
      <button :class="['tab-btn', { active: activeTab === 'menu' }]" @click="activeTab = 'menu'">Menu Items</button>
      <button :class="['tab-btn', { active: activeTab === 'addons' }]" @click="activeTab = 'addons'">Addons</button>
      <button :class="['tab-btn', { active: activeTab === 'coupons' }]" @click="activeTab = 'coupons'">Coupons</button>
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
        <h3>Menu Management</h3>
        <div class="actions-row">
          <input type="text" v-model="menuSearch" placeholder="Search menu..." class="form-input search-input" />
          <button @click="openMenuModal()" class="btn btn-primary">Add New Item</button>
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
              <th>Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredMenu" :key="item.id">
              <td><img :src="item.imageUrl" alt="img" class="table-img" v-if="item.imageUrl" /></td>
              <td>{{ item.name }}</td>
              <td>{{ item.category }}</td>
              <td>₹{{ item.price }}</td>
              <td>{{ item.veg ? 'Veg' : 'Non-Veg' }}</td>
              <td>
                  <button @click="openMenuModal(item)" class="btn btn-secondary btn-sm" style="margin-right:8px;">Edit</button>
                  <button @click="deleteMenu(item.id)" class="btn btn-primary btn-sm" style="background:#d13d18;">Delete</button>
                </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ================= ADDONS TAB ================= -->
    <div v-if="activeTab === 'addons'" class="tab-content card">
      <div class="section-header">
        <h3>Addons Management</h3>
        <button @click="openAddonModal()" class="btn btn-primary">Add New Addon</button>
      </div>

      <div class="table-responsive mt-3">
        <table class="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Price</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="addon in allAddons" :key="addon.id">
              <td>{{ addon.id }}</td>
              <td>{{ addon.name }}</td>
              <td>₹{{ addon.price }}</td>
              <td>
                  <button @click="openAddonModal(addon)" class="btn btn-secondary btn-sm" style="margin-right:8px;">Edit</button>
                  <button @click="deleteAddon(addon.id)" class="btn btn-primary btn-sm" style="background:#d13d18;">Delete</button>
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
              <input type="text" v-model="menuForm.name" required class="form-input" />
            </div>
            <div class="form-group flex-1">
              <label>Category</label>
              <input type="text" v-model="menuForm.category" required class="form-input" />
            </div>
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea v-model="menuForm.desc" rows="2" class="form-input"></textarea>
          </div>
          <div class="form-row">
            <div class="form-group flex-1">
              <label>Price (₹)</label>
              <input type="number" v-model="menuForm.price" required class="form-input" />
            </div>
            <div class="form-group checkbox-group flex-1">
              <input type="checkbox" id="isVeg" v-model="menuForm.isVeg" />
              <label for="isVeg">Is Vegetarian?</label>
            </div>
          </div>
          
          <div class="form-group mt-2">
            <label>Available Addons</label>
            <div class="addon-selection-box border rounded p-3" style="max-height: 150px; overflow-y: auto;">
              <div v-for="addon in allAddons" :key="addon.id" class="checkbox-group mb-1">
                <input type="checkbox" :id="'addon_'+addon.id" :value="addon" v-model="menuForm.addonList" />
                <label :for="'addon_'+addon.id">{{ addon.name }} (+₹{{ addon.price }})</label>
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
      <div class="modal-content card" style="max-width: 400px;">
        <h3 class="mb-3">{{ addonForm.id ? 'Edit Addon' : 'Add Addon' }}</h3>
        <form @submit.prevent="handleAddonSubmit" class="admin-form">
          <div class="form-group">
            <label>Name</label>
            <input type="text" v-model="addonForm.name" required class="form-input" />
          </div>
          <div class="form-group mt-3">
            <label>Price (₹)</label>
            <input type="number" v-model="addonForm.price" required class="form-input" />
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
const menuForm = ref({ id: null, name: '', category: '', desc: '', price: 0, isVeg: true, imageUrl: '', addonList: [] })

const openMenuModal = (item = null) => {
  menuStatus.value = ''
  selectedFile.value = null
  if (item) {
    // Clone correctly based on DTO schema vs Backend Entity
    menuForm.value = { ...item, isVeg: item.veg, addonList: item.addons || item.addonList || [] }
  } else {
    menuForm.value = { id: null, name: '', category: '', desc: '', price: 0, isVeg: true, imageUrl: '', addonList: [] }
  }
  showMenuModal.value = true
}

const handleFileChange = (e) => { if (e.target.files.length > 0) selectedFile.value = e.target.files[0] }

const handleMenuSubmit = async () => {
  isUploading.value = true; menuStatus.value = ''
  try {
    let finalImageUrl = menuForm.value.imageUrl;
    if (selectedFile.value) {
      const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1200, useWebWorker: true, fileType: 'image/webp' };
      const compressedFile = await imageCompression(selectedFile.value, options);
      const filename = selectedFile.value.name.replace(/\.[^/.]+$/, "") + ".webp";

      const presignRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/admin/upload-url?filename=${encodeURIComponent(filename)}&contentType=image/webp`, { headers: authStore.getAuthHeaders() })
      if (!presignRes.ok) throw new Error("Upload auth failed.")
      const presignData = await presignRes.json()
      
      const proxiedUploadUrl = presignData.uploadUrl.replace("https://s3.us-east-005.backblazeb2.com", "/b2api")
      const uploadRes = await fetch(proxiedUploadUrl, { method: 'PUT', body: compressedFile, headers: { 'Content-Type': 'image/webp' } })
      if (!uploadRes.ok) throw new Error("Cloud upload failed.")
      finalImageUrl = presignData.finalUrl
    }
    
    const payload = { ...menuForm.value, imageUrl: finalImageUrl }
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
const addonForm = ref({ id: null, name: '', price: 0 })

const openAddonModal = (item = null) => {
  addonForm.value = item ? { ...item } : { id: null, name: '', price: 0 }
  showAddonModal.value = true
}

const handleAddonSubmit = async () => {
  try {
    const url = addonForm.value.id ? `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/admin/addons/${addonForm.value.id}` : `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/admin/addons`
    const method = addonForm.value.id ? 'PUT' : 'POST'
    await fetch(url, { method, headers: { ...authStore.getAuthHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify(addonForm.value) })
    showAddonModal.value = false
    fetchAddons()
  } catch (e) { console.error(e) }
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

// Helpers
const getStatusClass = (s) => {
  if (['CONFIRMED', 'DELIVERED', 'SUCCESS'].includes(s)) return 'status-green'
  if (['PREPARING', 'OUT_FOR_DELIVERY', 'PENDING'].includes(s)) return 'status-yellow'
  if (['CANCELLED', 'FAILED'].includes(s)) return 'status-red'
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
    // Handle cloud upload if user selected a file
    if (selectedFile.value) {
      const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1200, useWebWorker: true, fileType: 'image/webp' };
      const compressedFile = await imageCompression(selectedFile.value, options);
      const filename = selectedFile.value.name.replace(/\.[^/.]+$/, "") + ".webp";

      const presignRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/admin/upload-url?filename=${encodeURIComponent(filename)}&contentType=image/webp`, { headers: authStore.getAuthHeaders() })
      if (!presignRes.ok) throw new Error("Upload auth failed.")
      const presignData = await presignRes.json()
      
      const proxiedUploadUrl = presignData.uploadUrl.replace("https://s3.us-east-005.backblazeb2.com", "/b2api")
      const uploadRes = await fetch(proxiedUploadUrl, { method: 'PUT', body: compressedFile, headers: { 'Content-Type': 'image/webp' } })
      if (!uploadRes.ok) throw new Error("Cloud upload failed.")
      finalImageUrl = presignData.finalUrl
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
.admin-container { padding-bottom: 60px; max-width: 1000px;}
.header-section { margin-bottom: 30px; }
.admin-tabs { display: flex; justify-content: center; gap: 12px; margin-bottom: 24px; flex-wrap: wrap;}
.tab-btn { background: none; border: 2px solid transparent; padding: 8px 16px; font-size: 1rem; font-weight: 600; cursor: pointer; color: var(--text-muted); border-radius: 20px; position: relative;}
.tab-btn.active { color: var(--brand-primary); background: rgba(232, 74, 32, 0.1); }
.badge { background: #d13d18; color: white; border-radius: 50%; padding: 2px 6px; font-size: 0.75rem; position: absolute; top: -5px; right: -5px; }

.section-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(0,0,0,0.1); padding-bottom: 12px; margin-bottom: 16px; }
.actions-row { display: flex; gap: 12px; }
.search-input { min-width: 250px; }

/* Orders Grid */
.orders-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
.order-card { padding: 16px; display: flex; flex-direction: column; }
.order-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 12px;}
.order-header h4 { margin: 0; }
.item-list { list-style: none; padding: 0; margin: 0; }
.item-list li { margin-bottom: 6px; }
.qty { font-weight: bold; color: var(--brand-primary); }
.order-actions { margin-top: auto; }

/* Tables */
.table-responsive { overflow-x: auto; }
.admin-table { width: 100%; border-collapse: collapse; }
.admin-table th, .admin-table td { padding: 12px; text-align: left; border-bottom: 1px solid rgba(0,0,0,0.05); }
.admin-table th { font-weight: bold; color: var(--text-muted); background: rgba(0,0,0,0.02); }
.table-img { width: 40px; height: 40px; border-radius: 8px; object-fit: cover; }

/* Status Badges */
.status-badge { padding: 4px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: bold; }
.status-green { background: #d4edda; color: #155724; }
.status-yellow { background: #fff3cd; color: #856404; }
.status-red { background: #f8d7da; color: #721c24; }
.status-gray { background: #e2e3e5; color: #383d41; }

/* Modals */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-content { width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto; padding: 24px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 12px; }

/* Forms */
.admin-form { display: flex; flex-direction: column; gap: 16px; }
.form-row { display: flex; gap: 16px; }
.flex-1 { flex: 1; }
.form-group { display: flex; flex-direction: column; }
.form-group label { font-size: 0.9rem; font-weight: 600; margin-bottom: 6px; }
.form-input { padding: 10px; border: 1px solid rgba(0,0,0,0.15); border-radius: 8px; font-family: inherit; }
.form-input:focus { outline: none; border-color: var(--brand-primary); }
.checkbox-group { display: flex; align-items: center; gap: 8px; }
.checkbox-group input[type="checkbox"] { width: 18px; height: 18px; accent-color: var(--brand-primary); cursor: pointer; }
.upload-area { border: 2px dashed rgba(0,0,0,0.2); padding: 20px; border-radius: 8px; text-align: center; cursor: pointer; position: relative; background: rgba(0,0,0,0.02);}
.upload-area:hover, .upload-area.has-file { border-color: var(--brand-primary); }
.file-input { position: absolute; top:0; left:0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }

.d-block { display: block; }
.w-100 { width: 100%; }
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
.border { border: 1px solid rgba(0,0,0,0.15); }
.rounded { border-radius: 8px; }
.animate-fade-in { animation: fadeIn 0.4s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>
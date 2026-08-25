<template>
  <div class="container animate-fade-in">
    <div class="header-section text-center">
      <h1 class="page-title">Lab <span class="text-brand">Command Center</span></h1>
      <p class="text-muted">Manage Menu Items, Addons, and Coupons.</p>
    </div>

    <div class="admin-tabs">
      <button :class="['tab-btn', { active: activeTab === 'menu' }]" @click="activeTab = 'menu'">Menu Items</button>
      <button :class="['tab-btn', { active: activeTab === 'coupons' }]" @click="activeTab = 'coupons'">Coupons</button>
    </div>

    <!-- Menu Items Tab -->
    <div v-if="activeTab === 'menu'" class="tab-content card">
      <h3>Add New Menu Item</h3>
      
      <form @submit.prevent="handleMenuSubmit" class="admin-form">
        <!-- Image Upload to Backblaze -->
        <div class="form-group image-upload-group">
          <label>Food Image</label>
          <div class="upload-area" :class="{ 'has-file': selectedFile }">
            <input type="file" @change="handleFileChange" accept="image/*" class="file-input" />
            <span v-if="!selectedFile">Click to select an image...</span>
            <span v-else class="text-brand font-weight-bold">{{ selectedFile.name }} (Ready to upload)</span>
          </div>
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

        <button type="submit" class="btn btn-primary" :disabled="isUploading">
          {{ isUploading ? 'Uploading to Cloud & Saving...' : 'Save Menu Item' }}
        </button>
        <p v-if="menuStatus" class="status-msg mt-3">{{ menuStatus }}</p>
      </form>
    </div>

    <!-- Coupons Tab -->
    <div v-if="activeTab === 'coupons'" class="tab-content card">
      <h3>Create Coupon Campaign</h3>
      
      <form @submit.prevent="handleCouponSubmit" class="admin-form">
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
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const activeTab = ref('menu')

// --- Menu Upload Logic (Presigned URL Architecture) --- //
const selectedFile = ref(null)
const isUploading = ref(false)
const menuStatus = ref('')

const menuForm = ref({
  name: '',
  category: '',
  desc: '',
  price: 0,
  isVeg: true,
  imageUrl: '' 
})

const handleFileChange = (event) => {
  if (event.target.files.length > 0) {
    selectedFile.value = event.target.files[0]
  }
}

const handleMenuSubmit = async () => {
  isUploading.value = true
  menuStatus.value = ''
  
  try {
    if (selectedFile.value) {
      const authHeaders = authStore.getAuthHeaders()
      
      const presignRes = await fetch(
        `http://localhost:8080/api/admin/upload-url?filename=${encodeURIComponent(selectedFile.value.name)}&contentType=${encodeURIComponent(selectedFile.value.type)}`,
        { headers: authHeaders }
      )
      
      if (!presignRes.ok) throw new Error("Failed to get upload authorization.")
      const presignData = await presignRes.json()
      
      // Vite Proxy Hack logic: 
      // Replace the real domain with our local Vite proxy to completely bypass CORS in the browser!
      const proxiedUploadUrl = presignData.uploadUrl.replace("https://s3.us-east-005.backblazeb2.com", "/b2api")

      const uploadRes = await fetch(proxiedUploadUrl, {
        method: 'PUT',
        body: selectedFile.value,
        headers: {
          'Content-Type': selectedFile.value.type
        }
      })
      
      if (!uploadRes.ok) throw new Error("Cloud upload failed.")
      menuForm.value.imageUrl = presignData.finalUrl
    }
    
    // Save metadata to PG
    const res = await fetch('http://localhost:8080/api/admin/menu', {
      method: 'POST',
      headers: authStore.getAuthHeaders(),
      body: JSON.stringify(menuForm.value)
    })
    
    if (!res.ok) throw new Error("Database save failed.")
    
    menuStatus.value = "Menu Item Published Successfully!"
    selectedFile.value = null
    menuForm.value = { name: '', category: '', desc: '', price: 0, isVeg: true, imageUrl: '' }
    
  } catch (err) {
    menuStatus.value = "Error: " + err.message
  } finally {
    isUploading.value = false
  }
}

// --- Coupon Logic --- //
const couponForm = ref({
  code: '',
  discountType: 'PERCENTAGE',
  discountValue: 0,
  minOrderValue: 0,
  active: true
})
const couponStatus = ref('')

const handleCouponSubmit = async () => {
  couponStatus.value = ''
  try {
    couponForm.value.code = couponForm.value.code.toUpperCase()
    
    const res = await fetch('http://localhost:8080/api/admin/coupons', {
      method: 'POST',
      headers: authStore.getAuthHeaders(),
      body: JSON.stringify(couponForm.value)
    })
    
    if (!res.ok) throw new Error("Failed to save coupon.")
    
    couponStatus.value = "Coupon Campaign Activated!"
    couponForm.value = { code: '', discountType: 'PERCENTAGE', discountValue: 0, minOrderValue: 0, active: true }
  } catch (err) {
    couponStatus.value = "Error: " + err.message
  }
}
</script>

<style scoped>
.header-section { margin-bottom: 40px; }
.admin-tabs { display: flex; justify-content: center; gap: 16px; margin-bottom: 24px; }
.tab-btn { background: none; border: 2px solid transparent; padding: 8px 24px; font-size: 1.1rem; font-weight: 600; cursor: pointer; color: var(--text-muted); transition: var(--transition); border-radius: 30px; }
.tab-btn.active { color: var(--brand-primary); background: rgba(232, 74, 32, 0.1); }
.tab-btn:hover:not(.active) { color: var(--text-main); }
.tab-content { max-width: 700px; margin: 0 auto; padding: 32px; }
.tab-content h3 { margin-top: 0; margin-bottom: 24px; padding-bottom: 12px; border-bottom: 1px solid rgba(0,0,0,0.1); }
.admin-form { display: flex; flex-direction: column; gap: 20px; }
.form-row { display: flex; gap: 20px; }
.flex-1 { flex: 1; }
.form-group { display: flex; flex-direction: column; }
.form-group label { font-size: 0.9rem; font-weight: 600; margin-bottom: 6px; }
.form-input { padding: 12px; border: 1px solid rgba(0,0,0,0.15); border-radius: 8px; font-family: inherit; font-size: 1rem; transition: border 0.2s; }
.form-input:focus { outline: none; border-color: var(--brand-primary); }
.checkbox-group { flex-direction: row; align-items: center; gap: 12px; padding-top: 28px; }
.checkbox-group input { width: 18px; height: 18px; accent-color: var(--brand-primary); }
.checkbox-group label { margin: 0; cursor: pointer; }
.image-upload-group { position: relative; }
.upload-area { border: 2px dashed rgba(0,0,0,0.2); padding: 24px; border-radius: 8px; text-align: center; cursor: pointer; transition: all 0.2s; background: rgba(0,0,0,0.02); }
.upload-area:hover, .upload-area.has-file { border-color: var(--brand-primary); background: rgba(232, 74, 32, 0.05); }
.file-input { position: absolute; top:0; left:0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
.status-msg { font-weight: bold; color: var(--brand-secondary); }
.animate-fade-in { animation: fadeIn 0.4s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>
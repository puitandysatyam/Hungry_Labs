const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/views/AdminView.vue');
let code = fs.readFileSync(filePath, 'utf-8');

// 1. Add Carousel Button
code = code.replace(
  `<button :class="['tab-btn', { active: activeTab === 'coupons' }]" @click="activeTab = 'coupons'">Coupons</button>`,
  `<button :class="['tab-btn', { active: activeTab === 'coupons' }]" @click="activeTab = 'coupons'">Coupons</button>\n        <button :class="['tab-btn', { active: activeTab === 'carousel' }]" @click="activeTab = 'carousel'">Carousel/Offers</button>`
);

// 2. Add Delete Buttons
code = code.replace(
  `<td><button @click="openMenuModal(item)" class="btn btn-secondary btn-sm">Edit</button></td>`,
  `<td>
                  <button @click="openMenuModal(item)" class="btn btn-secondary btn-sm" style="margin-right:8px;">Edit</button>
                  <button @click="deleteMenu(item.id)" class="btn btn-primary btn-sm" style="background:#d13d18;">Delete</button>
                </td>`
);

code = code.replace(
  `<td><button @click="openAddonModal(addon)" class="btn btn-secondary btn-sm">Edit</button></td>`,
  `<td>
                  <button @click="openAddonModal(addon)" class="btn btn-secondary btn-sm" style="margin-right:8px;">Edit</button>
                  <button @click="deleteAddon(addon.id)" class="btn btn-primary btn-sm" style="background:#d13d18;">Delete</button>
                </td>`
);

// 3. Add Carousel Tab template
const carouselTabHtml = Object.freeze(`
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
`);

code = code.replace(`<!-- ================= COUPONS TAB ================= -->`, carouselTabHtml + `\n\n      <!-- ================= COUPONS TAB ================= -->`);

// 4. Inject Logic inside script setup

const customLogic = `
const carouselImages = ref([])
const showCarouselModal = ref(false)
const carouselForm = ref({ id: null, imageUrl: '', order: 0, active: true })

const fetchCarouselImages = async () => {
  try {
    const res = await fetch('http://localhost:3000/api/admin/carousel', { headers: authStore.getAuthHeaders() })
    if (res.ok) carouselImages.value = await res.json()
  } catch (e) {}
}

const openCarouselModal = (item = null) => {
  selectedFile.value = null
  carouselForm.value = item ? { ...item } : { id: null, imageUrl: '', order: carouselImages.value.length, active: true }
  showCarouselModal.value = true
}

const handleCarouselSubmit = async () => {
  isUploading.value = true
  try {
    let finalImageUrl = carouselForm.value.imageUrl;
    // Handle cloud upload if user selected a file
    if (selectedFile.value) {
      const presignRes = await fetch(\`http://localhost:3000/api/admin/upload-url?filename=\${encodeURIComponent(selectedFile.value.name)}&contentType=\${encodeURIComponent(selectedFile.value.type)}\`, { headers: authStore.getAuthHeaders() })
      if (!presignRes.ok) throw new Error("Upload auth failed.")
      const presignData = await presignRes.json()
      
      const proxiedUploadUrl = presignData.uploadUrl.replace("https://s3.us-east-005.backblazeb2.com", "/b2api")
      const uploadRes = await fetch(proxiedUploadUrl, { method: 'PUT', body: selectedFile.value, headers: { 'Content-Type': selectedFile.value.type } })
      if (!uploadRes.ok) throw new Error("Cloud upload failed.")
      finalImageUrl = presignData.finalUrl
    }
    
    const payload = { ...carouselForm.value, imageUrl: finalImageUrl }
    const url = payload.id > 0 ? \`http://localhost:3000/api/admin/carousel/\${payload.id}\` : \`http://localhost:3000/api/admin/carousel\`
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
    const res = await fetch(\`http://localhost:3000/api/admin/carousel/\${id}\`, { method: 'DELETE', headers: authStore.getAuthHeaders() })
    if(res.ok) fetchCarouselImages()
  } catch (e) {}
}

const deleteMenu = async (id) => {
  if(!confirm('Are you sure you want to delete this menu item?')) return;
  try {
    const res = await fetch(\`http://localhost:3000/api/admin/menu/\${id}\`, { method: 'DELETE', headers: authStore.getAuthHeaders() })
    if(!res.ok) { let e = await res.json(); alert(e.error || 'Cannot delete item'); return; }
    fetchMenu()
  } catch(e) {}
}

const deleteAddon = async (id) => {
  if(!confirm('Are you sure you want to delete this addon?')) return;
  try {
    const res = await fetch(\`http://localhost:3000/api/admin/addons/\${id}\`, { method: 'DELETE', headers: authStore.getAuthHeaders() })
    if(!res.ok) { let e = await res.json(); alert(e.error || 'Cannot delete addon'); return; }
    fetchAddons()
  } catch(e) {}
}
`

code = code.replace(
  `onMounted(() => {
  fetchOrders()
  fetchMenu()
  fetchAddons()
  
  pollingInterval = setInterval(fetchOrders, 5000)
})`,
  `onMounted(() => {
  fetchOrders()
  fetchMenu()
  fetchAddons()
  fetchCarouselImages()
  
  pollingInterval = setInterval(fetchOrders, 5000)
})
` + customLogic
);

fs.writeFileSync(filePath, code);
console.log('PATCH SUCCESS');

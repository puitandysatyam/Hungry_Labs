const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/views/AdminView.vue');
let code = fs.readFileSync(filePath, 'utf-8');

const customLogic = `
// ==== CAROUSEL LOGIC ====
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
  carouselForm.value = item && item.id ? { ...item } : { id: null, imageUrl: '', order: carouselImages.value.length, active: true }
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

fetchCarouselImages()
// ==== END CAROUSEL LOGIC ====

</script>
`

code = code.replace(`</script>`, customLogic);

fs.writeFileSync(filePath, code);
console.log('PATCH3 SUCCESS');
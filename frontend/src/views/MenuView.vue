<template>
  <div class="menu-view container">
    <div class="menu-header">
      <h1 class="page-title">Explore Our <span class="text-brand">Menu</span></h1>
      <p class="subtitle mt-3">From chef's specials to everyday cravings.</p>
    </div>

    <!-- Toast Notification -->
    <div class="toast-container" :class="{ 'show': showToast }">
      <div class="toast-content">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="icon-cart-check"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
        <div class="toast-text">
          <span class="toast-title">Added to Cart!</span>
          <span class="toast-message">{{ toastMessage }}</span>
        </div>
      </div>
    </div>

    <!-- Category Filters -->
    <div class="category-filters">
      <button 
        class="filter-btn" 
        :class="{ active: selectedCategory === 'All' }"
        @click="selectedCategory = 'All'"
      >All</button>
      <button 
        v-for="cat in uniqueCategories" 
        :key="cat"
        class="filter-btn"
        :class="{ active: selectedCategory === cat }"
        @click="selectedCategory = cat"
      >{{ cat }}</button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p class="mt-3 text-muted" style="font-weight: 500;">Warming up the ovens...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <div class="error-box">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-brand mb-3"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        <h3>Whoops!</h3>
        <p class="text-muted">{{ error }}</p>
        <button @click="fetchMenu" class="btn btn-primary mt-4">Try Again</button>
      </div>
    </div>

    <!-- Menu Grid -->
    <div v-else class="menu-grid">
      <div v-for="item in filteredMenu" :key="item.id" class="menu-card card">
        
        <div class="menu-image-container" v-if="item.imageUrl">
          <img :src="item.imageUrl" :alt="item.name" class="menu-image" />
          <div class="price-tag">₹{{ item.price }}</div>
        </div>
        
        <div class="menu-card-content">
          <div class="menu-card-header">
            <div class="veg-indicator" :class="item.veg ? 'veg' : 'non-veg'" :title="item.veg ? 'Vegetarian' : 'Non-Vegetarian'">
              <span class="dot"></span>
            </div>
            <h3 class="menu-item-title">{{ item.name }}</h3>
          </div>
          
          <p class="menu-item-desc">{{ item.desc }}</p>
          
          
          <div v-if="item.addonList && item.addonList.length > 0" class="addons-container">
            <p class="addons-title">Customize:</p>
            <div v-for="addon in item.addonList" :key="addon.id" class="addon-check">
              <input type="checkbox" :id="'addon-'+item.id+'-'+addon.id" :value="addon" v-model="item.selectedAddOnsLocal" />
              <label :for="'addon-'+item.id+'-'+addon.id" style="cursor: pointer;">{{ addon.name }} (+₹{{ addon.price }})</label>
            </div>
          </div>
          
          <div class="menu-card-footer">
            <span class="menu-item-price" v-if="!item.imageUrl">₹{{ item.price }}</span>
            <div v-else></div> <!-- spacer if price is on image -->
            <button @click="addToCart(item)" class="btn btn-add">
              Add <span class="plus-icon">+</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCartStore } from '../stores/cart'

const cartStore = useCartStore()

const menuItems = ref([])
const isLoading = ref(true)
const error = ref(null)
const selectedCategory = ref('All')

// Toast state
const showToast = ref(false)
const toastMessage = ref('')
let toastTimeout = null

const uniqueCategories = computed(() => {
  const categories = new Set(menuItems.value.map(item => item.category))
  return Array.from(categories)
})

const filteredMenu = computed(() => {
  if (selectedCategory.value === 'All') return menuItems.value
  return menuItems.value.filter(item => item.category === selectedCategory.value)
})

const fetchMenu = async () => {
  try {
    isLoading.value = true
    error.value = null
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/menu/`)
    if (!response.ok) throw new Error('Failed to load menu')
    const data = await response.json()
    menuItems.value = data.map(item => ({ ...item, selectedAddOnsLocal: [] }))
  } catch (err) {
    console.error(err)
    error.value = "Couldn't load the menu! Our chefs might be taking a break."
  } finally {
    isLoading.value = false
  }
}

const addToCart = (item) => {
  // Pass the item to the cart store
  cartStore.addToCart(item, [], 1)
  
  // Show a beautiful custom toast instead of system alert
  toastMessage.value = `${item.name}`
  showToast.value = true
  
  if (toastTimeout) clearTimeout(toastTimeout)
  toastTimeout = setTimeout(() => {
    showToast.value = false
  }, 3000)
}

onMounted(() => {
  fetchMenu()
})
</script>

<style scoped>
.menu-header { text-align: center; margin-bottom: 48px; padding-top: 24px;}
.page-title { font-size: 3rem; letter-spacing: -0.03em;}
.subtitle { color: var(--text-muted); font-size: 1.15rem; font-weight: 500;}

/* Custom Toast Styling */
.toast-container {
  position: fixed;
  bottom: 32px;
  right: 32px;
  background-color: var(--text-main);
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.2);
  padding: 16px 24px;
  display: flex;
  align-items: center;
  z-index: 9999;
  transform: translateY(150%);
  opacity: 0;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.toast-container.show { transform: translateY(0); opacity: 1; }
.toast-content { display: flex; align-items: center; gap: 16px; }
.icon-cart-check {
  background-color: var(--brand-secondary);
  padding: 8px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
}
.toast-text { display: flex; flex-direction: column; }
.toast-title { font-weight: 700; font-size: 1rem; color: white; }
.toast-message { font-size: 0.9rem; color: #cbd5e1; }

/* Filter Pills */
.category-filters { display: flex; justify-content: center; gap: 12px; margin-bottom: 40px; flex-wrap: wrap; }
.filter-btn {
  padding: 10px 24px;
  border: 1px solid var(--border-color);
  background: white;
  border-radius: 30px;
  cursor: pointer;
  font-family: var(--font-heading);
  font-weight: 600;
  color: var(--text-muted);
  box-shadow: var(--shadow-sm);
  transition: var(--transition);
}
.filter-btn:hover { border-color: var(--brand-primary); color: var(--brand-primary); }
.filter-btn.active { background: var(--brand-primary); border-color: var(--brand-primary); color: white; box-shadow: 0 4px 12px rgba(255, 90, 48, 0.25); }

/* Grid Modernization */
.menu-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 32px; padding-bottom: 60px;}
.menu-card { display: flex; flex-direction: column; height: 100%; overflow: hidden; padding: 0; border: none; background: white; border-radius: 20px;}

.menu-image-container { position: relative; width: 100%; height: 220px; overflow: hidden; background-color: #f8fafc; }
.menu-image { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s ease; }
.menu-card:hover .menu-image { transform: scale(1.08); }

.price-tag {
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(4px);
  padding: 6px 14px;
  border-radius: 20px;
  font-weight: 800;
  font-size: 1.1rem;
  color: var(--text-main);
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}

.menu-card-content { padding: 24px; display: flex; flex-direction: column; flex: 1; }
.menu-card-header { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
.veg-indicator {
  width: 18px; height: 18px; border: 2px solid; border-radius: 4px; display: flex; align-items: center; justify-content: center; margin-top: 4px; flex-shrink: 0;
}
.veg-indicator .dot { width: 8px; height: 8px; border-radius: 50%; }
.veg-indicator.veg { border-color: var(--brand-secondary); }
.veg-indicator.veg .dot { background-color: var(--brand-secondary); }
.veg-indicator.non-veg { border-color: var(--brand-alert); }
.veg-indicator.non-veg .dot { background-color: var(--brand-alert); }

.menu-item-title { margin: 0; font-size: 1.3rem; line-height: 1.3; }
.menu-item-desc { color: var(--text-muted); font-size: 0.95rem; margin-bottom: 24px; flex: 1; line-height: 1.6;}
.menu-card-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 20px;}

.addons-container {
  margin-bottom: 16px;
  background: rgba(0,0,0,0.02);
  padding: 12px;
  border-radius: 12px;
}
.addons-title { font-size: 0.9rem; font-weight: bold; margin-bottom: 8px; color: var(--text-main); }
.addon-check { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; font-size: 0.9rem; color: var(--text-muted); }
.addon-check input { accent-color: var(--brand-primary); cursor: pointer;}
.menu-item-price { font-weight: 800; font-size: 1.25rem; color: var(--text-main); }

.btn-add {
  background-color: var(--brand-primary-light);
  color: var(--brand-primary);
  border: none;
  font-family: var(--font-heading);
  font-weight: 700;
  padding: 10px 20px;
  border-radius: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: var(--transition);
}
.btn-add:hover { background-color: var(--brand-primary); color: white; }
.plus-icon { font-size: 1.2rem; font-weight: 400; }

.loading-state, .error-state { text-align: center; padding: 80px 0; }
.error-box { max-width: 400px; margin: 0 auto; background: white; padding: 40px; border-radius: 24px; box-shadow: var(--shadow-sm); border: 1px solid var(--border-color);}

.spinner {
  width: 50px; height: 50px; border: 4px solid var(--border-color); border-top-color: var(--brand-primary); border-radius: 50%; animation: spin 0.8s cubic-bezier(0.5, 0.1, 0.4, 0.9) infinite; margin: 0 auto;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>

<template>
  <div class="menu-view container">
    <div class="menu-header">
      <h1 class="page-title">Our <span class="text-brand">Menu</span></h1>
      <p class="text-muted">Fresh. Filling. Full of flavor.</p>
    </div>

    <!-- Category Filter -->
    <div class="category-filters">
      <button 
        v-for="cat in categories" 
        :key="cat"
        @click="activeCategory = cat"
        :class="['btn', activeCategory === cat ? 'btn-primary' : 'btn-secondary']"
      >
        {{ cat }}
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center" style="padding: 40px;">
      <p>Loading menu...</p>
    </div>

    <!-- Menu Items Grid -->
    <div v-else-if="filteredMenu.length > 0" class="menu-grid">
      <div v-for="item in filteredMenu" :key="item.id" class="card menu-card">
        <!-- Optional Image Header -->
        <div v-if="item.imageUrl" class="menu-card-image" :style="{ backgroundImage: `url(${item.imageUrl})` }"></div>

        <div class="menu-card-header">
          <div class="veg-indicator" :class="item.isVeg ? 'veg' : 'non-veg'">
            <span class="dot"></span>
          </div>
          <h3>{{ item.name }}</h3>
          <span class="price">₹{{ item.price }}</span>
        </div>
        <p class="description">{{ item.description }}</p>
        
        <!-- Add Ons -->
        <div v-if="item.addOns && item.addOns.length" class="addons-section">
          <h4>Add-ons</h4>
          <div v-for="(addon, idx) in item.addOns" :key="idx" class="addon-item">
            <label>
              <!-- Track selected addons by assigning the actual addon object -->
              <input type="checkbox" :value="addon" v-model="item.selectedAddOns" />
              {{ addon.name }} (+₹{{ addon.price }})
            </label>
          </div>
        </div>

        <button @click="addToCart(item)" class="btn btn-primary w-100 mt-4">
          Add to Cart
        </button>
      </div>
    </div>
    
    <!-- Empty State -->
    <div v-else class="text-center" style="padding: 40px; color: var(--text-muted);">
      <p>No items found in this category.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCartStore } from '../stores/cart'

const cartStore = useCartStore()

const menu = ref([])
const categories = ref(['All'])
const activeCategory = ref('All')
const loading = ref(true)

// Fetch menu from backend
const fetchMenu = async () => {
  try {
    loading.value = true
    const response = await fetch('http://localhost:8080/api/menu/')
    if (!response.ok) throw new Error('Failed to fetch menu')
    const data = await response.json()
    
    // Inject 'selectedAddOns' array for UI state
    menu.value = data.map(item => ({...item, selectedAddOns: []}))
    
    // Extract unique categories
    const uniqueCats = [...new Set(data.map(item => item.category))]
    categories.value = ['All', ...uniqueCats]
  } catch (error) {
    console.error('Error fetching menu:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchMenu()
})

const filteredMenu = computed(() => {
  if (activeCategory.value === 'All') return menu.value
  return menu.value.filter(item => item.category === activeCategory.value)
})

const addToCart = (item) => {
  // Pass a COPY of the selected addons so modifying checkboxes later doesn't mutate what's in the cart
  const addonsCopy = [...item.selectedAddOns]
  
  cartStore.addToCart(item, addonsCopy, 1)
  
  // Optional UX: clear the checkboxes after adding to cart
  item.selectedAddOns = []
  
  // Show a mini toast/alert
  alert(`Added ${item.name} to cart!`)
}

</script>

<style scoped>
.menu-header {
  text-align: center;
  margin-bottom: 40px;
}
.page-title {
  font-size: 2.5rem;
  margin-bottom: 8px;
}
.category-filters {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 40px;
  flex-wrap: wrap;
}
.menu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 32px;
}
.menu-card {
  display: flex;
  flex-direction: column;
}
.menu-card-image {
  height: 180px;
  background-size: cover;
  background-position: center;
  border-radius: 8px;
  margin-bottom: 16px;
}
.menu-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.menu-card-header h3 {
  flex: 1;
  font-size: 1.3rem;
  margin: 0;
}
.price {
  font-weight: bold;
  color: var(--brand-primary);
  font-size: 1.3rem;
}
.veg-indicator {
  width: 16px;
  height: 16px;
  border: 2px solid;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.veg-indicator .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.veg-indicator.veg { border-color: var(--brand-secondary); }
.veg-indicator.veg .dot { background-color: var(--brand-secondary); }
.veg-indicator.non-veg { border-color: #d13d18; }
.veg-indicator.non-veg .dot { background-color: #d13d18; }
.description {
  color: var(--text-muted);
  font-size: 0.95rem;
  margin-bottom: 24px;
  flex: 1;
}
.addons-section {
  background-color: rgba(0,0,0,0.02);
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}
.addons-section h4 {
  font-size: 1rem;
  margin-bottom: 8px;
}
.addon-item {
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  margin-bottom: 6px;
}
.addon-item label {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}
.w-100 { width: 100%; }
.mt-4 { margin-top: 16px; }
.text-center { text-align: center; }
</style>
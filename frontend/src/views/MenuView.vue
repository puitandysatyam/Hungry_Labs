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

    <!-- Menu Items Grid -->
    <div class="menu-grid">
      <div v-for="item in filteredMenu" :key="item.id" class="card menu-card">
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
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// Mock Data (will be replaced with API call to /api/menu)
const mockMenu = [
  {
    id: 1,
    category: 'Burgers',
    name: 'Chicken Burger',
    description: 'Juicy, flavorful & satisfying. Made fresh for real hunger. High in protein.',
    price: 99,
    isVeg: false,
    addOns: [{ name: 'Extra Patty (Chicken)', price: 40 }, { name: 'Extra Cheese', price: 25 }, { name: 'Extra Egg', price: 15 }],
    selectedAddOns: []
  },
  {
    id: 2,
    category: 'Burgers',
    name: 'Veg Burger',
    description: 'Wholesome, cheesy & delicious. Pure veg satisfaction in every bite.',
    price: 99,
    isVeg: true,
    addOns: [{ name: 'Extra Patty (Paneer-Veg)', price: 35 }, { name: 'Extra Cheese', price: 25 }],
    selectedAddOns: []
  },
  {
    id: 3,
    category: 'Sandwiches',
    name: 'Chicken Sandwich',
    description: 'Grilled, cheesy & packed with bold flavors. Made fresh for real hunger.',
    price: 179,
    isVeg: false,
    addOns: [{ name: 'Extra Chicken', price: 40 }, { name: 'Extra Cheese', price: 25 }],
    selectedAddOns: []
  },
  {
    id: 4,
    category: 'Sandwiches',
    name: 'Veg Sandwich',
    description: 'Wholesome, cheesy & satisfying. Pure veg goodness in every bite.',
    price: 169,
    isVeg: true,
    addOns: [{ name: 'Extra Paneer', price: 35 }, { name: 'Extra Cheese', price: 25 }],
    selectedAddOns: []
  },
  {
    id: 5,
    category: 'French Fries',
    name: 'Loaded Fries (Veg)',
    description: 'Large portion of fries topped with double cheese slices, veggies & paneer.',
    price: 159,
    isVeg: true,
    addOns: [{ name: 'Extra Paneer', price: 35 }, { name: 'Extra Cheese', price: 25 }],
    selectedAddOns: []
  }
]

const menu = ref(mockMenu)
const categories = ['All', 'Burgers', 'Sandwiches', 'French Fries']
const activeCategory = ref('All')

const filteredMenu = computed(() => {
  if (activeCategory.value === 'All') return menu.value
  return menu.value.filter(item => item.category === activeCategory.value)
})

const addToCart = (item) => {
  // Simple mock cart interaction
  const totalItemPrice = item.price + item.selectedAddOns.reduce((sum, a) => sum + a.price, 0)
  alert(`Added ${item.name} to cart! Total: ₹${totalItemPrice}`)
  // In a real app, we'd dispatch to a Pinia store here
}
</script>

<style scoped>
.menu-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-title {
  font-size: 3rem;
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

.menu-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.menu-card-header h3 {
  flex: 1;
  font-size: 1.4rem;
}

.price {
  font-weight: bold;
  color: var(--brand-primary);
  font-size: 1.4rem;
  font-family: var(--font-heading);
}

.veg-indicator {
  width: 20px;
  height: 20px;
  border: 2px solid;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.veg-indicator .dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.veg-indicator.veg {
  border-color: var(--brand-secondary);
}
.veg-indicator.veg .dot {
  background-color: var(--brand-secondary);
}

.veg-indicator.non-veg {
  border-color: #d13d18;
}
.veg-indicator.non-veg .dot {
  background-color: #d13d18;
}

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
</style>

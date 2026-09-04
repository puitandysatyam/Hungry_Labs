<template>
  <div class="app-container">
    <nav class="navbar">
      <div class="container nav-content">
        <router-link to="/" class="logo-container">
          <img src="/assets/Logo.png" alt="The Hungry Lab" class="nav-logo" />
        </router-link>
        
        <div class="nav-links">
          <router-link to="/" class="nav-link">Home</router-link>
          <router-link to="/menu" class="nav-link">Menu</router-link>
          
          <router-link to="/checkout" class="nav-link cart-link">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="cart-icon"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
            Cart <span class="cart-count">{{ cartStore.cartCount }}</span>
          </router-link>
          
          <!-- Auth Controls -->
          <template v-if="authStore.isAuthenticated">
            <router-link to="/history" class="nav-link user-link">My Orders</router-link>
            <router-link v-if="authStore.isAdmin" to="/admin" class="nav-link admin-link">Admin</router-link>
            <button @click="authStore.logout()" class="btn btn-logout btn-sm">Logout</button>
          </template>
          <template v-else>
            <button @click="showAuth = true" class="btn btn-login btn-sm">Sign In</button>
          </template>
        </div>
      </div>
    </nav>

    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <footer class="footer">
      <div class="container text-center">
        <p>&copy; 2026 The Hungry Lab. Fresh. Filling. Full of flavor.</p>
        <div class="footer-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Contact Us</a>
          <router-link to="/privacy">Privacy Policy</router-link>
          <router-link to="/terms">Terms of Service</router-link>
          <router-link to="/contact">Contact Us</router-link>
        </div>
      </div>
    </footer>

    <!-- Global Auth Modal -->
    <AuthModal :show="showAuth" @close="showAuth = false" />
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useCartStore } from './stores/cart'
import { useAuthStore } from './stores/auth'
import AuthModal from './components/AuthModal.vue'

const cartStore = useCartStore()
const authStore = useAuthStore()
const route = useRoute()

const showAuth = ref(false)

// Open modal automatically if booted from a protected route
watch(() => route.query.login, (newVal) => {
  if (newVal === 'true') {
    showAuth.value = true
  }
})
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.navbar {
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(0,0,0,0.05);
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 12px 0;
  transition: all 0.3s ease;
}

.nav-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-logo {
  height: 45px; /* Softer, slightly smaller logo for modern look */
  width: auto;
  transition: var(--transition);
}
.nav-logo:hover {
  transform: scale(1.02);
}

.nav-links {
  display: flex;
  gap: 24px;
  align-items: center;
}

.nav-link {
  text-decoration: none;
  color: var(--text-muted);
  font-weight: 600;
  font-family: var(--font-heading);
  font-size: 1.05rem;
  transition: var(--transition);
  position: relative;
}
.nav-link:hover, .nav-link.router-link-active {
  color: var(--text-main);
}
.nav-link.router-link-active::after {
  content: '';
  position: absolute;
  bottom: -6px;
  left: 0;
  width: 100%;
  height: 3px;
  background-color: var(--brand-primary);
  border-radius: 2px;
}

.user-link.router-link-active::after, .admin-link.router-link-active::after {
  background-color: var(--text-main);
}

.cart-link {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: var(--text-main); /* Premium black button look */
  color: white !important;
  padding: 10px 20px;
  border-radius: 30px;
}
.cart-link::after { display: none !important; }
.cart-link:hover {
  background-color: var(--brand-primary);
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(255, 90, 48, 0.2);
}

.cart-icon {
  margin-top: -2px;
}

.cart-count {
  background-color: var(--brand-primary);
  color: white;
  font-size: 0.85rem;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 800;
  margin-left: 4px;
}
.cart-link:hover .cart-count {
  background-color: white;
  color: var(--brand-primary);
}

.btn-sm { font-size: 0.9rem; padding: 8px 20px; border-radius: 20px; }
.btn-login { background-color: transparent; border: 2px solid var(--border-color); color: var(--text-main); font-weight: 700; }
.btn-login:hover { border-color: var(--text-main); background-color: var(--text-main); color: white; }
.btn-logout { background-color: transparent; border: none; font-weight: 600; color: var(--text-muted); cursor: pointer; padding: 8px 12px; }
.btn-logout:hover { color: var(--brand-alert); background-color: transparent; box-shadow: none; transform: none;}

.main-content {
  flex: 1;
  padding: 0; /* Removing padding to allow full-width hero sections in views */
}

.footer {
  background-color: white;
  padding: 40px 0;
  border-top: 1px solid var(--border-color);
  margin-top: auto;
  color: var(--text-muted);
}
.footer-links {
  margin-top: 16px;
  display: flex;
  justify-content: center;
  gap: 24px;
}
.footer-links a { color: var(--text-muted); text-decoration: none; font-weight: 500; font-size: 0.9rem; }
.footer-links a:hover { color: var(--brand-primary); }

/* Global Transition for Router View */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.fade-enter-from { opacity: 0; transform: translateY(10px); }
.fade-leave-to { opacity: 0; transform: translateY(-10px); }
</style>
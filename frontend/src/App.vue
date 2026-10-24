<template>
  <div class="app-container">
    <nav class="navbar">
      <div class="container nav-content">
        <router-link to="/" class="logo-container" aria-label="Home">
          <img src="/assets/Logo.png" alt="The Hungry Lab" class="nav-logo" />
        </router-link>
        
        <div class="nav-links">
          <router-link to="/" class="nav-link">Home</router-link>
          <router-link to="/menu" class="nav-link">Menu</router-link>
          
          <router-link to="/checkout" class="nav-link cart-link" aria-label="Cart">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="cart-icon"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
            <span class="cart-text">Cart</span>
            <span class="cart-count">{{ cartStore.cartCount }}</span>
          </router-link>
          
          <!-- Auth Controls -->
          <template v-if="authStore.isAuthenticated">
            <router-link to="/history" class="nav-link user-link">Orders</router-link>
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
        <p class="brand-tagline"><strong>The Hungry Lab</strong> &bull; Fresh. Sizzling. Full of flavor.</p>
        <p class="copyright-text">&copy; 2026 The Hungry Lab Kitchens. All rights reserved.</p>
        <div class="footer-links">
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
import { ref, watch } from 'vue'
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
  min-height: 100dvh;
}

.navbar {
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-bottom: 2px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 10px 0;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
}

.nav-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.nav-logo {
  height: 44px;
  width: auto;
  transition: transform 0.2s ease;
  display: block;
}
.nav-logo:hover {
  transform: scale(1.03);
}

.nav-links {
  display: flex;
  gap: 18px;
  align-items: center;
  flex-wrap: wrap;
}

.nav-link {
  text-decoration: none;
  color: var(--text-muted);
  font-weight: 700;
  font-family: var(--font-heading);
  font-size: 0.98rem;
  transition: var(--transition);
  position: relative;
  padding: 4px 0;
}
.nav-link:hover, .nav-link.router-link-active {
  color: var(--brand-primary);
}
.nav-link.router-link-active::after {
  content: '';
  position: absolute;
  bottom: -4px;
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
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
  color: white !important;
  padding: 8px 18px;
  border-radius: 25px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  transition: var(--transition);
}
.cart-link::after { display: none !important; }
.cart-link:hover {
  background: var(--brand-primary);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(255, 59, 0, 0.35);
}

.cart-icon {
  margin-top: -1px;
}

.cart-count {
  background-color: var(--brand-primary);
  color: white;
  font-size: 0.8rem;
  padding: 2px 7px;
  border-radius: 12px;
  font-weight: 800;
  line-height: 1.2;
}
.cart-link:hover .cart-count {
  background-color: white;
  color: var(--brand-primary);
}

.btn-sm { font-size: 0.88rem; padding: 7px 18px; border-radius: 20px; }
.btn-login { 
  background-color: white; 
  border: 2px solid var(--text-main); 
  color: var(--text-main); 
  font-weight: 800;
}
.btn-login:hover { 
  border-color: var(--brand-primary); 
  background-color: var(--brand-primary); 
  color: white; 
}
.btn-logout { 
  background-color: transparent; 
  border: none; 
  font-weight: 700; 
  color: var(--text-muted); 
  cursor: pointer; 
  padding: 6px 10px; 
}
.btn-logout:hover { 
  color: var(--brand-alert); 
  background-color: transparent; 
}

.main-content {
  flex: 1;
}

.footer {
  background-color: white;
  padding: 44px 0 32px;
  border-top: 2px solid var(--border-color);
  margin-top: auto;
  color: var(--text-muted);
}
.brand-tagline {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 6px;
}
.copyright-text {
  font-size: 0.88rem;
  color: var(--text-muted);
}
.footer-links {
  margin-top: 18px;
  display: flex;
  justify-content: center;
  gap: 22px;
}
.footer-links a { 
  color: var(--text-muted); 
  text-decoration: none; 
  font-weight: 600; 
  font-size: 0.92rem; 
  transition: color 0.2s;
}
.footer-links a:hover { 
  color: var(--brand-primary); 
}

/* Mobile Responsiveness */
@media (max-width: 640px) {
  .navbar {
    padding: 8px 0;
  }
  .nav-logo {
    height: 36px;
  }
  .nav-links {
    gap: 10px;
  }
  .nav-link {
    font-size: 0.88rem;
  }
  .cart-link {
    padding: 6px 12px;
    gap: 6px;
  }
  .cart-text {
    display: none;
  }
  .cart-count {
    padding: 2px 6px;
    font-size: 0.75rem;
  }
  .btn-sm {
    padding: 6px 12px;
    font-size: 0.82rem;
  }
  .footer-links {
    flex-wrap: wrap;
    gap: 14px;
  }
}

/* Global Transition for Router View */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-enter-from { opacity: 0; transform: translateY(6px); }
.fade-leave-to { opacity: 0; transform: translateY(-6px); }
</style>

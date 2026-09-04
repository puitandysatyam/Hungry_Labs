import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/menu', name: 'menu', component: () => import('../views/MenuView.vue') },
    { path: '/checkout', name: 'checkout', component: () => import('../views/CheckoutView.vue') },
    { path: '/history', name: 'history', component: () => import('../views/HistoryView.vue'), meta: { requiresAuth: true } },
    { path: '/admin', name: 'admin', component: () => import('../views/AdminView.vue'), meta: { requiresAdmin: true } },
    { path: '/privacy', name: 'privacy', component: () => import('../views/PrivacyPolicyView.vue'), alias: '/privacy-policy' },
    { path: '/terms', name: 'terms', component: () => import('../views/TermsOfServiceView.vue'), alias: '/terms-of-service' },
    { path: '/contact', name: 'contact', component: () => import('../views/ContactView.vue'), alias: '/contact-us' }
  ]
})

// Navigation Guard
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    // If not logged in, boot them to home (they can open auth modal from there)
    return next({ name: 'home', query: { login: 'true' } }) 
  }
  
  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    alert("You do not have administrative privileges.")
    return next({ name: 'home' })
  }
  
  next()
})

export default router

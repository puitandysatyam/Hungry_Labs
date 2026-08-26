<template>
  <div v-if="show" class="modal-overlay" @click.self="close">
    <div class="modal-content">
      <button class="close-btn" @click="close">&times;</button>
      
      <div class="modal-header">
        <h2>{{ isLogin ? 'Welcome Back' : 'Create Account' }}</h2>
        <p class="text-muted">{{ isLogin ? 'Sign in to access your orders and coupons.' : 'Join The Hungry Lab today.' }}</p>
      </div>

      <form @submit.prevent="handleSubmit" class="auth-form">
        <div v-if="!isLogin" class="form-group">
          <label>Full Name</label>
          <input type="text" v-model="form.name" required class="form-input" />
        </div>
        
        <div class="form-group">
          <label>Email Address</label>
          <input type="email" v-model="form.email" required class="form-input" />
        </div>
        
        <div v-if="!isLogin" class="form-group">
          <label>Phone Number</label>
          <input type="tel" v-model="form.phone" required class="form-input" />
        </div>

        <div class="form-group">
          <label>Password</label>
          <input type="password" v-model="form.password" required class="form-input" />
        </div>

        <p v-if="errorMsg" class="error-text">{{ errorMsg }}</p>

        <button type="submit" class="btn btn-primary w-100 mt-4" :disabled="isLoading">
          {{ isLoading ? 'Processing...' : (isLogin ? 'Login' : 'Register') }}
        </button>
      </form>

      <div class="modal-footer">
        <p>
          {{ isLogin ? "Don't have an account?" : "Already have an account?" }}
          <a href="#" @click.prevent="isLogin = !isLogin" class="text-brand font-weight-bold">
            {{ isLogin ? 'Sign up' : 'Login' }}
          </a>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useAuthStore } from '../stores/auth'

const props = defineProps({
  show: Boolean
})

const emit = defineEmits(['close', 'success'])

const authStore = useAuthStore()
const isLogin = ref(true)
const isLoading = ref(false)
const errorMsg = ref('')

const form = reactive({
  name: '',
  email: '',
  phone: '',
  password: ''
})

const close = () => {
  errorMsg.value = ''
  emit('close')
}

const handleSubmit = async () => {
  isLoading.value = true
  errorMsg.value = ''
  
  try {
    const endpoint = isLogin.value ? '/api/auth/login' : '/api/auth/register'
    const payload = isLogin.value 
      ? { email: form.email, password: form.password }
      : form
      
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    
    if (!res.ok) {
      const msg = await res.text()
      throw new Error(msg || 'Authentication failed')
    }
    
    const data = await res.json()
    // Explicitly grab the role from the new DTO response!
    authStore.setAuth(data.token, { id: data.userId, name: data.name, role: data.role })
    emit('success')
    close()
  } catch (err) {
    errorMsg.value = err.message
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
/* Unchanged CSS */
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); animation: fadeIn 0.2s ease-out; }
.modal-content { background: white; padding: 32px; border-radius: var(--border-radius); width: 90%; max-width: 400px; position: relative; box-shadow: 0 10px 25px rgba(0,0,0,0.1); animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.close-btn { position: absolute; top: 16px; right: 16px; background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-muted); }
.modal-header h2 { margin-bottom: 4px; font-size: 1.8rem; }
.modal-footer { margin-top: 24px; text-align: center; font-size: 0.9rem; }
.auth-form { margin-top: 24px; }
.form-group { margin-bottom: 16px; display: flex; flex-direction: column; }
.form-group label { font-size: 0.85rem; font-weight: 600; margin-bottom: 4px; }
.form-input { padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 1rem; }
.form-input:focus { outline: none; border-color: var(--brand-primary); }
.error-text { color: #d13d18; font-size: 0.85rem; text-align: center; margin-top: 12px; }
.font-weight-bold { font-weight: bold; }
.w-100 { width: 100%; }
.mt-4 { margin-top: 16px; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
</style>
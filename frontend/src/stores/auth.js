import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || null)
  const user = ref(JSON.parse(localStorage.getItem('user')) || null)

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'ADMIN') // Assuming role comes down in User object

  const setAuth = (newToken, newUser) => {
    token.value = newToken
    user.value = newUser
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(newUser))
  }

  const logout = () => {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const getAuthHeaders = () => {
    if (!token.value) return { 'Content-Type': 'application/json' }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token.value}`
    }
  }

  return { token, user, isAuthenticated, isAdmin, setAuth, logout, getAuthHeaders }
})

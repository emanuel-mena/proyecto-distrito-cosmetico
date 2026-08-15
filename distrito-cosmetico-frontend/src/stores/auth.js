import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { api, SESSION_KEY } from '../api/client'

const readSession = () => {
  try {
    const value = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')
    return value?.token && value?.user ? value : null
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const stored = readSession()
  const activeUser = ref(stored?.user || null)
  const token = ref(stored?.token || '')
  const loading = ref(false)
  const isAuthenticated = computed(() => Boolean(token.value && activeUser.value))
  const isAdmin = computed(() => activeUser.value?.rol === 'admin')
  const firstName = computed(() => activeUser.value?.nombre?.split(' ')[0] || 'Invitado')

  const saveSession = (payload) => {
    activeUser.value = payload.user
    token.value = payload.token
    localStorage.setItem(SESSION_KEY, JSON.stringify({ user: payload.user, token: payload.token }))
  }

  async function login(correo, password) {
    loading.value = true
    try {
      const result = await api('/auth/login', { method: 'POST', body: { correo, password } })
      saveSession(result)
      return { ok: true }
    } catch (error) {
      return { ok: false, message: error.message }
    } finally {
      loading.value = false
    }
  }

  async function register({ nombre, correo, password }) {
    loading.value = true
    try {
      await api('/auth/register', { method: 'POST', body: { nombre, correo, password } })
      return {
        ok: true,
        message: 'Cuenta creada correctamente. Ahora puedes iniciar sesión.',
        type: 'success',
      }
    } catch (error) {
      return {
        ok: false,
        message: error.message,
        type: error.status === 409 ? 'warning' : 'danger',
      }
    } finally {
      loading.value = false
    }
  }

  function logout() {
    activeUser.value = null
    token.value = ''
    localStorage.removeItem(SESSION_KEY)
  }

  window.addEventListener('api:unauthorized', logout)

  return {
    activeUser,
    token,
    loading,
    isAuthenticated,
    isAdmin,
    firstName,
    login,
    register,
    logout,
  }
})

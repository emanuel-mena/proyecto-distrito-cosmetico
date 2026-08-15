<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useCartStore } from '../stores/cart'
import { assetUrl } from '../utils/format'

const auth = useAuthStore()
const cart = useCartStore()
const route = useRoute()
const router = useRouter()
const activeTab = ref('login')
const message = ref(null)
const loginErrors = reactive({ correo: false, password: false })
const registerErrors = reactive({
  nombre: false,
  correo: false,
  password: false,
  confirmation: false,
})
const loginForm = reactive({ correo: '', password: '' })
const registerForm = reactive({ nombre: '', correo: '', password: '', confirmation: '' })

const validEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

const submitLogin = async () => {
  message.value = null
  loginErrors.correo = !validEmail(loginForm.correo.trim())
  loginErrors.password = !loginForm.password
  if (loginErrors.correo || loginErrors.password) return

  const result = await auth.login(loginForm.correo.trim(), loginForm.password)
  if (!result.ok) {
    message.value = { text: result.message, type: 'danger' }
    return
  }

  try {
    await cart.mergeGuest()
  } catch (error) {
    message.value = { text: `Sesión iniciada. ${error.message}`, type: 'warning' }
  }
  await router.push(typeof route.query.redirect === 'string' ? route.query.redirect : '/')
}

const submitRegister = async () => {
  message.value = null
  registerErrors.nombre = registerForm.nombre.trim().length < 3
  registerErrors.correo = !validEmail(registerForm.correo.trim())
  registerErrors.password = registerForm.password.length < 8
  registerErrors.confirmation = registerForm.password !== registerForm.confirmation
  if (Object.values(registerErrors).some(Boolean)) return

  const result = await auth.register({
    nombre: registerForm.nombre.trim(),
    correo: registerForm.correo.trim(),
    password: registerForm.password,
  })
  message.value = { text: result.message, type: result.type }
  if (!result.ok) return

  Object.assign(registerForm, { nombre: '', correo: '', password: '', confirmation: '' })
  activeTab.value = 'login'
}
</script>

<template>
  <main class="auth-page">
    <div class="auth-orb auth-orb--one" aria-hidden="true"></div>
    <div class="auth-orb auth-orb--two" aria-hidden="true"></div>
    <div class="container auth-container py-5">
      <div class="row justify-content-center">
        <div class="col-md-7 col-lg-6">
          <div class="auth-card">
            <div class="auth-card-body">
              <div class="auth-brand">
                <img
                  :src="assetUrl('data/brand/LogComp.svg')"
                  alt="Distrito Cosmético"
                  class="auth-logo"
                />
                <h1>Distrito Cosmético</h1>
                <p>Tu espacio de belleza y cuidado personal</p>
              </div>

              <ul class="auth-tabs" role="tablist">
                <li class="nav-item">
                  <button
                    type="button"
                    class="nav-link"
                    :class="{ active: activeTab === 'login' }"
                    role="tab"
                    :aria-selected="activeTab === 'login'"
                    @click="activeTab = 'login'"
                  >
                    Iniciar Sesión
                  </button>
                </li>
                <li class="nav-item">
                  <button
                    type="button"
                    class="nav-link"
                    :class="{ active: activeTab === 'register' }"
                    role="tab"
                    :aria-selected="activeTab === 'register'"
                    @click="activeTab = 'register'"
                  >
                    Registrarse
                  </button>
                </li>
              </ul>

              <div
                v-if="message"
                class="app-status-banner"
                :class="`app-status-banner--${message.type}`"
              >
                <i class="bi bi-info-circle-fill" aria-hidden="true"></i>{{ message.text }}
              </div>

              <form v-if="activeTab === 'login'" novalidate @submit.prevent="submitLogin">
                <div class="mb-3">
                  <label for="loginEmail" class="form-label">Correo electrónico</label>
                  <input
                    id="loginEmail"
                    v-model="loginForm.correo"
                    type="email"
                    class="form-control app-input"
                    :class="{ 'is-invalid': loginErrors.correo }"
                    placeholder="correo@ejemplo.com"
                  />
                  <div class="invalid-feedback">Ingrese un correo válido.</div>
                </div>
                <div class="mb-4">
                  <label for="loginPassword" class="form-label">Contraseña</label>
                  <input
                    id="loginPassword"
                    v-model="loginForm.password"
                    type="password"
                    class="form-control app-input"
                    :class="{ 'is-invalid': loginErrors.password }"
                    placeholder="********"
                  />
                  <div class="invalid-feedback">La contraseña es obligatoria.</div>
                </div>
                <button type="submit" class="btn-app btn-app-primary w-100" :disabled="auth.loading">
                  {{ auth.loading ? 'Ingresando...' : 'Iniciar Sesión' }}
                </button>
              </form>

              <form v-else novalidate @submit.prevent="submitRegister">
                <div class="mb-3">
                  <label for="registerName" class="form-label">Nombre completo</label>
                  <input
                    id="registerName"
                    v-model="registerForm.nombre"
                    type="text"
                    class="form-control app-input"
                    :class="{ 'is-invalid': registerErrors.nombre }"
                    placeholder="Nombre completo"
                  />
                  <div class="invalid-feedback">Debe ingresar su nombre.</div>
                </div>
                <div class="mb-3">
                  <label for="registerEmail" class="form-label">Correo electrónico</label>
                  <input
                    id="registerEmail"
                    v-model="registerForm.correo"
                    type="email"
                    class="form-control app-input"
                    :class="{ 'is-invalid': registerErrors.correo }"
                    placeholder="correo@ejemplo.com"
                  />
                  <div class="invalid-feedback">Correo inválido.</div>
                </div>
                <div class="mb-3">
                  <label for="registerPassword" class="form-label">Contraseña</label>
                  <input
                    id="registerPassword"
                    v-model="registerForm.password"
                    type="password"
                    class="form-control app-input"
                    :class="{ 'is-invalid': registerErrors.password }"
                    placeholder="Mínimo 8 caracteres"
                  />
                  <div class="invalid-feedback">
                    La contraseña debe tener al menos 8 caracteres.
                  </div>
                </div>
                <div class="mb-4">
                  <label for="registerConfirmation" class="form-label">Confirmar contraseña</label>
                  <input
                    id="registerConfirmation"
                    v-model="registerForm.confirmation"
                    type="password"
                    class="form-control app-input"
                    :class="{ 'is-invalid': registerErrors.confirmation }"
                    placeholder="Repita la contraseña"
                  />
                  <div class="invalid-feedback">Las contraseñas no coinciden.</div>
                </div>
                <button type="submit" class="btn-app btn-app-primary w-100" :disabled="auth.loading">
                  {{ auth.loading ? 'Creando...' : 'Crear cuenta' }}
                </button>
              </form>

              <div class="auth-return">
                <RouterLink to="/"><i class="bi bi-arrow-left" aria-hidden="true"></i>Volver a la tienda</RouterLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

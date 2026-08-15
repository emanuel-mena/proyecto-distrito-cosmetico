<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useCartStore } from '../../stores/cart'
import { useCatalogStore } from '../../stores/catalog'
import { useCategoriesStore } from '../../stores/categories'
import { useCurrencyStore } from '../../stores/currency'
import { assetUrl } from '../../utils/format'

const route = useRoute()
const auth = useAuthStore()
const cart = useCartStore()
const catalog = useCatalogStore()
const categories = useCategoriesStore()
const currency = useCurrencyStore()
const menuOpen = ref(false)
const categoriesOpen = ref(false)
const closeButton = ref(null)
let searchTimer

const fixedLinks = [
  { to: '/nosotros', label: 'Nosotros' },
  { to: '/nuevos-productos', label: 'Nuevo' },
  { to: '/promociones', label: 'Promociones' },
]
const categoryLinks = computed(() =>
  categories.categories
    .filter((category) => category.activa)
    .map((category) => ({ to: `/categoria/${category.slug}`, label: category.nombre })),
)
const links = computed(() => [fixedLinks[0], fixedLinks[1], ...categoryLinks.value, fixedLinks[2]])

const closeMenu = () => {
  menuOpen.value = false
}

const onKeydown = (event) => {
  if (event.key === 'Escape' && menuOpen.value) closeMenu()
}

watch(menuOpen, async (open) => {
  document.body.classList.toggle('overlay-open', open)
  if (open) {
    await nextTick()
    closeButton.value?.focus()
  }
})

watch(
  () => route.fullPath,
  () => {
    closeMenu()
    categoriesOpen.value = false
    catalog.searchQuery = ''
  },
)

watch(
  () => catalog.searchQuery,
  (value) => {
    window.clearTimeout(searchTimer)
    searchTimer = window.setTimeout(() => catalog.load(value ? { search: value } : {}), 300)
  },
)

window.addEventListener('keydown', onKeydown)
onBeforeUnmount(() => {
  window.clearTimeout(searchTimer)
  document.body.classList.remove('overlay-open')
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <header class="d-none d-lg-block">
    <div class="header-top py-3">
      <div class="container d-flex align-items-center">
        <RouterLink to="/" class="logo-box me-3">
          <img
            :src="assetUrl('data/brand/LogComp.svg')"
            alt="Logo Distrito Cosmético"
            class="logo-img"
          />
        </RouterLink>

        <h1 class="mb-0 fs-4 text-dark">Distrito Cosmético</h1>

        <div class="mx-auto w-50 px-4">
          <div class="search-bar-wrapper">
            <input
              v-model="catalog.searchQuery"
              type="search"
              class="form-control rounded-pill"
              placeholder="Buscar..."
              aria-label="Buscar productos"
            />
            <i class="bi bi-search" aria-hidden="true"></i>
          </div>
        </div>

        <div class="d-flex align-items-center fs-4 header-icons">
          <select
            class="form-select form-select-sm me-2"
            :value="currency.currency"
            aria-label="Moneda"
            @change="currency.setCurrency($event.target.value)"
          >
            <option value="CRC">CRC</option>
            <option value="USD">USD</option>
          </select>
          <RouterLink v-if="auth.isAdmin" to="/admin" class="btn btn-sm btn-outline-dark me-2">
            Admin
          </RouterLink>
          <RouterLink
            to="/carrito"
            class="cart-pill text-decoration-none me-2"
            aria-label="Mi carrito"
          >
            <i class="bi bi-cart3 fs-4" aria-hidden="true"></i>
            <span v-if="cart.count" class="cart-count badge rounded-pill bg-danger">
              {{ cart.count }}
            </span>
          </RouterLink>

          <RouterLink
            :to="auth.isAuthenticated ? '/mi-cuenta' : '/login'"
            class="user-pill text-decoration-none"
          >
            <div class="user-avatar"><i class="bi bi-person-fill" aria-hidden="true"></i></div>
            <div class="user-text">
              <div class="user-name">
                Hola, <span>{{ auth.firstName }}</span>
              </div>
              <div class="user-account">Mi Cuenta</div>
            </div>
          </RouterLink>
        </div>
      </div>
    </div>

    <nav class="header-nav py-2" aria-label="Navegación principal">
      <div class="container">
        <ul class="nav justify-content-between">
          <li v-for="link in links" :key="link.to" class="nav-item">
            <RouterLink class="nav-link text-dark px-0" :to="link.to">
              {{ link.label }}
            </RouterLink>
          </li>
        </ul>
      </div>
    </nav>
  </header>

  <header class="d-lg-none mobile-header py-3 px-3 shadow-sm sticky-top">
    <div class="d-flex align-items-center gap-3">
      <RouterLink to="/" class="logo-box me-3">
        <img
          :src="assetUrl('data/brand/LogComp.svg')"
          alt="Logo Distrito Cosmético"
          class="logo-img"
        />
      </RouterLink>

      <div class="flex-grow-1 search-bar-wrapper">
        <input
          v-model="catalog.searchQuery"
          type="search"
          class="form-control rounded-pill"
          placeholder="Buscar..."
          aria-label="Buscar productos"
        />
        <i class="bi bi-search" aria-hidden="true"></i>
      </div>

      <button
        type="button"
        class="btn btn-link text-dark p-0 border-0"
        aria-label="Abrir menú"
        :aria-expanded="menuOpen"
        aria-controls="mobileOffcanvasMenu"
        @click="menuOpen = true"
      >
        <i class="bi bi-three-dots-vertical fs-2" aria-hidden="true"></i>
      </button>
    </div>
  </header>

  <Teleport to="body">
    <div v-if="menuOpen" class="offcanvas-backdrop fade show" @click="closeMenu"></div>
    <aside
      id="mobileOffcanvasMenu"
      class="offcanvas offcanvas-end d-lg-none"
      :class="{ show: menuOpen }"
      :style="{ visibility: menuOpen ? 'visible' : 'hidden' }"
      tabindex="-1"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobileMenuTitle"
    >
      <div class="offcanvas-header border-bottom">
        <h5 id="mobileMenuTitle" class="fw-bold">Menú</h5>
        <button
          ref="closeButton"
          type="button"
          class="btn-close"
          aria-label="Cerrar"
          @click="closeMenu"
        ></button>
      </div>

      <div class="offcanvas-body">
        <ul class="nav flex-column gap-3">
          <li class="nav-item">
            <RouterLink to="/" class="mobile-user-card text-decoration-none" @click="closeMenu">
              <div class="mobile-user-avatar"><i class="bi bi-shop"></i></div>
              <div class="mobile-user-info">
                <div class="mobile-user-title">Tienda</div>
                <small class="text-muted">Explorar productos</small>
              </div>
              <i class="bi bi-chevron-right ms-auto"></i>
            </RouterLink>
          </li>

          <li class="nav-item">
            <button
              type="button"
              class="mobile-user-card text-decoration-none border-0 w-100"
              :aria-expanded="categoriesOpen"
              aria-controls="mobileCategories"
              @click="categoriesOpen = !categoriesOpen"
            >
              <div class="mobile-user-avatar"><i class="bi bi-grid"></i></div>
              <div class="mobile-user-info text-start">
                <div class="mobile-user-title">Categorías</div>
                <small class="text-muted">Ver todas</small>
              </div>
              <i class="bi bi-chevron-down ms-auto"></i>
            </button>

            <div v-show="categoriesOpen" id="mobileCategories" class="mt-3">
              <ul class="nav flex-column ms-4">
                <li v-for="link in categoryLinks" :key="`mobile-${link.to}`">
                  <RouterLink class="nav-link text-dark" :to="link.to" @click="closeMenu">
                    {{ link.label }}
                  </RouterLink>
                </li>
              </ul>
            </div>
          </li>

          <li v-if="auth.isAdmin" class="nav-item">
            <RouterLink
              to="/admin"
              class="mobile-user-card text-decoration-none"
              @click="closeMenu"
            >
              <div class="mobile-user-avatar"><i class="bi bi-gear"></i></div>
              <div class="mobile-user-info">
                <div class="mobile-user-title">Administración</div>
              </div>
              <i class="bi bi-chevron-right ms-auto"></i>
            </RouterLink>
          </li>
          <li class="nav-item">
            <label for="mobileCurrency" class="form-label">Moneda</label>
            <select
              id="mobileCurrency"
              class="form-select"
              :value="currency.currency"
              @change="currency.setCurrency($event.target.value)"
            >
              <option value="CRC">Colones (CRC)</option>
              <option value="USD">Dólares (USD)</option>
            </select>
          </li>

          <li class="nav-item">
            <RouterLink
              to="/carrito"
              class="mobile-user-card text-decoration-none"
              @click="closeMenu"
            >
              <div class="mobile-user-avatar"><i class="bi bi-cart3"></i></div>
              <div class="mobile-user-info">
                <div class="mobile-user-title">
                  Mi Carrito
                  <span v-if="cart.count" class="cart-count badge rounded-pill bg-danger">
                    {{ cart.count }}
                  </span>
                </div>
                <small class="text-muted">Ver productos</small>
              </div>
              <i class="bi bi-chevron-right ms-auto"></i>
            </RouterLink>
          </li>

          <li class="nav-item">
            <RouterLink
              :to="auth.isAuthenticated ? '/mi-cuenta' : '/login'"
              class="mobile-user-card text-decoration-none"
              @click="closeMenu"
            >
              <div class="mobile-user-avatar"><i class="bi bi-person-fill"></i></div>
              <div class="mobile-user-info">
                <div class="mobile-user-title">
                  Hola, <span>{{ auth.firstName }}</span>
                </div>
                <small class="text-muted">Pedidos y Mi Cuenta</small>
              </div>
              <i class="bi bi-chevron-right ms-auto"></i>
            </RouterLink>
          </li>
        </ul>
      </div>
    </aside>
  </Teleport>
</template>

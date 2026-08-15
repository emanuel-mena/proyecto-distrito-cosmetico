<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useCartStore } from '../stores/cart'
import { useOrdersStore } from '../stores/orders'
import { useCatalogStore } from '../stores/catalog'
import { useCurrencyStore } from '../stores/currency'
import { assetUrl } from '../utils/format'

const router = useRouter()
const auth = useAuthStore()
const cart = useCartStore()
const orders = useOrdersStore()
const catalog = useCatalogStore()
const currency = useCurrencyStore()
const checkoutError = ref('')
const checkoutLoading = ref(false)
const delivery = reactive({ telefono: '', direccion: '' })

const imageFallback = (event) => {
  event.target.onerror = null
  event.target.src = assetUrl('data/assets/fallback.webp')
}

const emptyCart = async () => {
  if (!confirm('¿Deseas vaciar el carrito?')) return
  try {
    await cart.clear()
  } catch (error) {
    checkoutError.value = error.message
  }
}

const updateQuantity = async (id, quantity) => {
  try {
    await cart.setQuantity(id, quantity)
  } catch (error) {
    checkoutError.value = error.message
    await cart.load()
  }
}

const removeItem = async (id) => {
  try {
    await cart.remove(id)
  } catch (error) {
    checkoutError.value = error.message
    await cart.load()
  }
}

const checkout = async () => {
  if (!cart.items.length) return
  if (!auth.activeUser) {
    alert('Inicia sesión para finalizar tu compra.')
    await router.push({ name: 'login', query: { redirect: '/carrito' } })
    return
  }
  if (!confirm('¿Confirmas la compra?')) return
  if (!delivery.telefono.trim() || !delivery.direccion.trim()) {
    checkoutError.value = 'Ingresa un teléfono y una dirección de entrega.'
    return
  }
  checkoutError.value = ''
  checkoutLoading.value = true
  try {
    await orders.createOrder(delivery)
    await Promise.all([cart.load(), catalog.load()])
    Object.assign(delivery, { telefono: '', direccion: '' })
    alert('¡Compra realizada exitosamente!')
  } catch (error) {
    checkoutError.value = error.message
    await Promise.all([cart.load(), catalog.load()])
  } finally {
    checkoutLoading.value = false
  }
}
</script>

<template>
  <main class="container py-5">
    <div class="d-flex align-items-center justify-content-between mb-5">
      <h1 class="mb-0">Mi Carrito</h1>
      <RouterLink to="/" class="btn btn-outline-secondary">Seguir comprando</RouterLink>
    </div>

    <div class="card shadow border-0">
      <div class="card-body">
        <div v-if="cart.items.length === 0" class="text-center py-5">
          <i class="bi bi-cart-x display-4 text-muted"></i>
          <p class="lead text-muted mt-3 mb-0">Tu carrito está vacío.</p>
          <RouterLink to="/" class="btn btn-dark mt-4">Explorar productos</RouterLink>
        </div>

        <template v-else>
          <div class="table-responsive">
            <table class="table align-middle mb-0">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Precio</th>
                  <th>Cantidad</th>
                  <th>Subtotal</th>
                  <th><span class="visually-hidden">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in cart.items" :key="item.id">
                  <td class="cart-product">
                    <img
                      :src="assetUrl(item.product.imagen)"
                      :alt="item.product.nombre"
                      @error="imageFallback"
                    />
                    <span>{{ item.product.nombre }}</span>
                  </td>
                  <td>{{ currency.format(item.product.precio) }}</td>
                  <td>
                    <div class="input-group input-group-sm cart-quantity">
                      <button
                        type="button"
                        class="btn btn-outline-secondary"
                        :aria-label="`Disminuir cantidad de ${item.product.nombre}`"
                        @click="updateQuantity(item.id, item.cantidad - 1)"
                      >
                        −
                      </button>
                      <span
                        class="form-control text-center"
                        :aria-label="`Cantidad de ${item.product.nombre}`"
                      >
                        {{ item.cantidad }}
                      </span>
                      <button
                        type="button"
                        class="btn btn-outline-secondary"
                        :disabled="item.cantidad >= item.product.stock"
                        :aria-label="`Aumentar cantidad de ${item.product.nombre}`"
                        @click="updateQuantity(item.id, item.cantidad + 1)"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td>{{ currency.format(item.product.precio * item.cantidad) }}</td>
                  <td>
                    <button
                      type="button"
                      class="btn btn-sm btn-outline-danger"
                      @click="removeItem(item.id)"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <hr />
          <div class="d-flex justify-content-end align-items-center gap-3">
            <h4 class="mb-0">Total:</h4>
            <h4 class="mb-0">{{ currency.format(cart.total) }}</h4>
          </div>
          <div v-if="auth.isAuthenticated" class="row g-3 mt-3">
            <div class="col-md-4">
              <label for="checkoutPhone" class="form-label">Teléfono</label>
              <input
                id="checkoutPhone"
                v-model.trim="delivery.telefono"
                class="form-control"
                required
              />
            </div>
            <div class="col-md-8">
              <label for="checkoutAddress" class="form-label">Dirección de entrega</label>
              <input
                id="checkoutAddress"
                v-model.trim="delivery.direccion"
                class="form-control"
                required
              />
            </div>
          </div>
          <div v-if="checkoutError" class="alert alert-danger mt-3 mb-0">{{ checkoutError }}</div>
          <div class="d-flex flex-column flex-md-row gap-3 mt-4">
            <button type="button" class="btn btn-outline-danger flex-fill" @click="emptyCart">
              Vaciar carrito
            </button>
            <button
              type="button"
              class="btn btn-success flex-fill"
              :disabled="checkoutLoading"
              @click="checkout"
            >
              {{ checkoutLoading ? 'Procesando...' : 'Finalizar compra' }}
            </button>
          </div>
        </template>
      </div>
    </div>
  </main>
</template>

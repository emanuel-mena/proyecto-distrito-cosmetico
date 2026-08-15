<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useCartStore } from '../stores/cart'
import { useOrdersStore } from '../stores/orders'
import { useCatalogStore } from '../stores/catalog'
import { useCurrencyStore } from '../stores/currency'
import { useFeedbackStore } from '../stores/feedback'
import { assetUrl } from '../utils/format'

const router = useRouter()
const auth = useAuthStore()
const cart = useCartStore()
const orders = useOrdersStore()
const catalog = useCatalogStore()
const currency = useCurrencyStore()
const feedback = useFeedbackStore()
const checkoutError = ref('')
const checkoutLoading = ref(false)
const delivery = reactive({ telefono: '', direccion: '' })

const imageFallback = (event) => {
  event.target.onerror = null
  event.target.src = assetUrl('data/assets/fallback.webp')
}

const emptyCart = async () => {
  const accepted = await feedback.confirm({
    title: 'Vaciar carrito',
    message: 'Se eliminarán todos los productos que agregaste. Esta acción no se puede deshacer.',
    confirmLabel: 'Sí, vaciar',
    tone: 'danger',
  })
  if (!accepted) return
  try {
    await cart.clear()
    feedback.notify({ message: 'El carrito quedó vacío.', type: 'info' })
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
    feedback.notify({ message: 'Inicia sesión para finalizar tu compra.', type: 'info' })
    await router.push({ name: 'login', query: { redirect: '/carrito' } })
    return
  }
  if (!delivery.telefono.trim() || !delivery.direccion.trim()) {
    checkoutError.value = 'Ingresa un teléfono y una dirección de entrega.'
    return
  }
  const accepted = await feedback.confirm({
    title: 'Confirmar compra',
    message: `Tu pedido por ${currency.format(cart.total)} quedará registrado con los datos de entrega indicados.`,
    confirmLabel: 'Confirmar pedido',
  })
  if (!accepted) return
  checkoutError.value = ''
  checkoutLoading.value = true
  try {
    await orders.createOrder(delivery)
    await Promise.all([cart.load(), catalog.load()])
    Object.assign(delivery, { telefono: '', direccion: '' })
    feedback.notify({ message: '¡Compra realizada exitosamente!', type: 'success' })
  } catch (error) {
    checkoutError.value = error.message
    await Promise.all([cart.load(), catalog.load()])
  } finally {
    checkoutLoading.value = false
  }
}
</script>

<template>
  <main class="container cart-page py-5">
    <div class="page-heading-row">
      <div>
        <span class="section-eyebrow">Tu selección</span>
        <h1>Mi carrito</h1>
        <p v-if="cart.items.length" class="mb-0">
          {{ cart.count }} {{ cart.count === 1 ? 'producto' : 'productos' }} en tu pedido
        </p>
      </div>
      <RouterLink to="/" class="btn-app btn-app-secondary">
        <i class="bi bi-arrow-left" aria-hidden="true"></i>Seguir comprando
      </RouterLink>
    </div>

    <div v-if="cart.items.length === 0" class="empty-state cart-empty-state">
      <span class="empty-state-icon"><i class="bi bi-bag" aria-hidden="true"></i></span>
      <h2>Tu carrito está esperando</h2>
      <p>Explora nuestras colecciones y encuentra algo especial para ti.</p>
      <RouterLink to="/" class="btn-app btn-app-primary">Explorar productos</RouterLink>
    </div>

    <div v-else class="cart-layout">
      <section class="cart-products-panel" aria-labelledby="cartProductsTitle">
        <div class="cart-panel-heading">
          <h2 id="cartProductsTitle">Productos</h2>
        </div>
        <div class="cart-items">
          <article v-for="item in cart.items" :key="item.id" class="cart-line">
            <div class="cart-product">
              <img
                :src="assetUrl(item.product.imagen)"
                :alt="item.product.nombre"
                @error="imageFallback"
              />
              <div>
                <span class="product-category">{{ item.product.categoria }}</span>
                <h3>{{ item.product.nombre }}</h3>
                <span class="cart-unit-price">{{ currency.format(item.product.precio) }} c/u</span>
              </div>
            </div>
            <div class="cart-quantity" aria-label="Selector de cantidad">
              <button
                type="button"
                :aria-label="`Disminuir cantidad de ${item.product.nombre}`"
                @click="updateQuantity(item.id, item.cantidad - 1)"
              >
                −
              </button>
              <span :aria-label="`Cantidad de ${item.product.nombre}`">{{ item.cantidad }}</span>
              <button
                type="button"
                :disabled="item.cantidad >= item.product.stock"
                :aria-label="`Aumentar cantidad de ${item.product.nombre}`"
                @click="updateQuantity(item.id, item.cantidad + 1)"
              >
                +
              </button>
            </div>
            <div class="cart-line-total">
              <span>Subtotal</span>
              <strong>{{ currency.format(item.product.precio * item.cantidad) }}</strong>
            </div>
            <button
              type="button"
              class="cart-remove"
              :aria-label="`Eliminar ${item.product.nombre}`"
              @click="removeItem(item.id)"
            >
              <i class="bi bi-trash3" aria-hidden="true"></i>
            </button>
          </article>
        </div>
      </section>

      <aside class="cart-summary" aria-labelledby="cartSummaryTitle">
        <h2 id="cartSummaryTitle">Resumen del pedido</h2>
        <div class="summary-row">
          <span>Productos</span><span>{{ cart.count }}</span>
        </div>
        <div class="summary-row summary-total">
          <span>Total</span><strong>{{ currency.format(cart.total) }}</strong>
        </div>

        <div v-if="auth.isAuthenticated" class="delivery-fields">
          <h3>Datos de entrega</h3>
          <div>
            <label for="checkoutPhone" class="form-label">Teléfono</label>
            <input
              id="checkoutPhone"
              v-model.trim="delivery.telefono"
              class="form-control app-input"
              autocomplete="tel"
              required
            />
          </div>
          <div>
            <label for="checkoutAddress" class="form-label">Dirección de entrega</label>
            <input
              id="checkoutAddress"
              v-model.trim="delivery.direccion"
              class="form-control app-input"
              autocomplete="street-address"
              required
            />
          </div>
        </div>

        <div v-if="checkoutError" class="app-status-banner app-status-banner--danger">
          <i class="bi bi-exclamation-circle-fill" aria-hidden="true"></i>{{ checkoutError }}
        </div>
        <button
          type="button"
          class="btn-app btn-app-primary w-100"
          :disabled="checkoutLoading"
          @click="checkout"
        >
          <i class="bi bi-lock-fill" aria-hidden="true"></i>
          {{ checkoutLoading ? 'Procesando...' : 'Finalizar compra' }}
        </button>
        <button type="button" class="cart-clear-action" @click="emptyCart">
          Vaciar carrito
        </button>
      </aside>
    </div>
  </main>
</template>

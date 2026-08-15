<script setup>
import { computed } from 'vue'
import { useCartStore } from '../../stores/cart'
import { assetUrl } from '../../utils/format'
import { useCurrencyStore } from '../../stores/currency'
import AppModal from '../common/AppModal.vue'

const props = defineProps({
  product: { type: Object, default: null },
})
const emit = defineEmits(['close'])
const cart = useCartStore()
const currency = useCurrencyStore()
const open = computed(() => Boolean(props.product))

const imageFallback = (event) => {
  event.target.onerror = null
  event.target.src = assetUrl('data/assets/fallback.webp')
}

const addToCart = async () => {
  const result = await cart.add(props.product)
  alert(result.message)
}
</script>

<template>
  <AppModal :open="open" labelled-by="productModalTitle" @close="emit('close')">
    <template #title>
      <h5 id="productModalTitle" class="modal-title fw-bold">{{ product?.nombre }}</h5>
    </template>

    <div v-if="product" class="modal-body p-4 text-center">
      <div class="product-img-wrapper mb-3 mx-auto modal-product-image">
        <img
          :src="assetUrl(product.imagen)"
          :alt="product.nombre"
          class="img-fluid"
          @error="imageFallback"
        />
      </div>
      <span class="badge bg-secondary mb-2">{{ product.categoria }}</span>
      <h3 class="text-primary fw-bold mb-3">{{ currency.format(product.precio) }}</h3>
      <p>{{ product.descripcion }}</p>
      <span
        class="badge p-2 px-3 rounded-pill mt-2"
        :class="product.disponible && product.stock > 0 ? 'badge-disponibilidad' : 'bg-danger'"
      >
        {{ product.disponible && product.stock > 0 ? 'Disponible' : 'Agotado' }}
      </span>
    </div>

    <div v-if="product" class="modal-footer footer-bar border-0 justify-content-center">
      <button
        type="button"
        class="btn btn-dark text-white rounded-pill px-4"
        :disabled="!product.disponible || product.stock <= 0"
        @click="addToCart"
      >
        <i class="bi bi-cart-plus me-2"></i>Agregar al carrito
      </button>
    </div>
  </AppModal>
</template>

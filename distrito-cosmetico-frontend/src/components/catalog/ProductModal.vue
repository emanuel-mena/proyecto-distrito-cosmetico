<script setup>
import { computed } from 'vue'
import { useCartStore } from '../../stores/cart'
import { assetUrl } from '../../utils/format'
import { useCurrencyStore } from '../../stores/currency'
import { useFeedbackStore } from '../../stores/feedback'
import AppModal from '../common/AppModal.vue'

const props = defineProps({
  product: { type: Object, default: null },
})
const emit = defineEmits(['close'])
const cart = useCartStore()
const currency = useCurrencyStore()
const feedback = useFeedbackStore()
const open = computed(() => Boolean(props.product))

const imageFallback = (event) => {
  event.target.onerror = null
  event.target.src = assetUrl('data/assets/fallback.webp')
}

const addToCart = async () => {
  const result = await cart.add(props.product)
  feedback.notify({ message: result.message, type: result.ok ? 'success' : 'danger' })
}
</script>

<template>
  <AppModal :open="open" labelled-by="productModalTitle" size="modal-lg" @close="emit('close')">
    <template #title>
      <h2 id="productModalTitle" class="modal-title fs-5 fw-bold">Detalle del producto</h2>
    </template>

    <div v-if="product" class="product-modal-body">
      <div class="product-modal-image">
        <div class="product-img-wrapper">
          <img
            :src="assetUrl(product.imagen)"
            :alt="product.nombre"
            class="img-fluid"
            @error="imageFallback"
          />
        </div>
      </div>
      <div class="product-modal-info">
        <span class="product-category">{{ product.categoria }}</span>
        <h3>{{ product.nombre }}</h3>
        <p class="product-modal-description">{{ product.descripcion }}</p>
        <div class="product-modal-price">{{ currency.format(product.precio) }}</div>
        <span
          class="availability-pill"
          :class="{
            'availability-pill--out': !product.disponible || product.stock <= 0,
          }"
        >
          <i
            class="bi"
            :class="
              product.disponible && product.stock > 0 ? 'bi-check-circle-fill' : 'bi-x-circle-fill'
            "
            aria-hidden="true"
          ></i>
          {{ product.disponible && product.stock > 0 ? 'Disponible' : 'Agotado' }}
        </span>
        <button
          type="button"
          class="btn-app btn-app-primary product-modal-action"
          :disabled="!product.disponible || product.stock <= 0"
          @click="addToCart"
        >
          <i class="bi bi-bag-plus" aria-hidden="true"></i>Agregar al carrito
        </button>
      </div>
    </div>
  </AppModal>
</template>

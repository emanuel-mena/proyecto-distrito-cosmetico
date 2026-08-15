<script setup>
import { assetUrl } from '../../utils/format'
import { useCurrencyStore } from '../../stores/currency'

defineProps({
  product: { type: Object, required: true },
})
const emit = defineEmits(['select'])
const currency = useCurrencyStore()

const imageFallback = (event) => {
  event.target.onerror = null
  event.target.src = assetUrl('data/assets/fallback.webp')
}
</script>

<template>
  <article
    class="product-card"
    :class="{ 'product-card--unavailable': !product.disponible || product.stock <= 0 }"
    tabindex="0"
    role="button"
    :aria-label="`Ver ${product.nombre}`"
    @click="emit('select', product)"
    @keydown.enter="emit('select', product)"
    @keydown.space.prevent="emit('select', product)"
  >
    <div class="product-img-wrapper">
      <img :src="assetUrl(product.imagen)" :alt="product.nombre" @error="imageFallback" />
      <span v-if="!product.disponible || product.stock <= 0" class="product-stock-badge">
        Agotado
      </span>
    </div>
    <span class="product-category">{{ product.categoria }}</span>
    <h3 class="product-name">{{ product.nombre }}</h3>
    <p class="product-description">{{ product.descripcion }}</p>
    <div class="product-card-footer">
      <span class="product-price">{{ currency.format(product.precio) }}</span>
      <span class="product-view-icon" aria-hidden="true"><i class="bi bi-arrow-up-right"></i></span>
    </div>
  </article>
</template>

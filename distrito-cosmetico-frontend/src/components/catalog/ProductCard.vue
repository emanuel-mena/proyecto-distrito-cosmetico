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
    tabindex="0"
    role="button"
    :aria-label="`Ver ${product.nombre}`"
    @click="emit('select', product)"
    @keydown.enter="emit('select', product)"
    @keydown.space.prevent="emit('select', product)"
  >
    <div class="product-img-wrapper">
      <img :src="assetUrl(product.imagen)" :alt="product.nombre" @error="imageFallback" />
    </div>
    <h6 class="text-truncate mb-1">{{ product.nombre }}</h6>
    <small class="d-block text-truncate mb-auto">{{ product.descripcion }}</small>
    <p class="fw-bold mt-2 mb-1">{{ currency.format(product.precio) }}</p>
  </article>
</template>

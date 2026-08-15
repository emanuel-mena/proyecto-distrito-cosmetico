<script setup>
import ProductCard from './ProductCard.vue'

defineProps({
  products: { type: Array, required: true },
  horizontal: { type: Boolean, default: false },
})
defineEmits(['select'])
</script>

<template>
  <div :class="horizontal ? 'scroll-container' : 'row g-4'">
    <p v-if="products.length === 0" class="text-muted w-100 mt-2">No se encontraron resultados.</p>
    <template v-else>
      <div
        v-for="product in products"
        :key="product.id"
        :class="{ 'col-md-4 col-lg-3': !horizontal }"
      >
        <ProductCard :product="product" @select="$emit('select', $event)" />
      </div>
    </template>
  </div>
</template>

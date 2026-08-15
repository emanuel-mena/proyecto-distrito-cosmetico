<script setup>
import ProductCard from './ProductCard.vue'

defineProps({
  products: { type: Array, required: true },
  horizontal: { type: Boolean, default: false },
})
defineEmits(['select'])
</script>

<template>
  <div class="product-grid" :class="{ 'product-grid--horizontal': horizontal }">
    <div v-if="products.length === 0" class="empty-state product-empty-state">
      <span class="empty-state-icon"><i class="bi bi-search" aria-hidden="true"></i></span>
      <h3>No encontramos productos</h3>
      <p>Prueba con otra búsqueda o explora una categoría diferente.</p>
    </div>
    <template v-else>
      <div v-for="product in products" :key="product.id" class="product-grid-item">
        <ProductCard :product="product" @select="$emit('select', $event)" />
      </div>
    </template>
  </div>
</template>

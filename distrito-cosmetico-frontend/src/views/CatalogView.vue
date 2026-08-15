<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import CategoryHeader from '../components/catalog/CategoryHeader.vue'
import ProductGrid from '../components/catalog/ProductGrid.vue'
import ProductModal from '../components/catalog/ProductModal.vue'
import { useCatalogStore } from '../stores/catalog'
import { useCategoriesStore } from '../stores/categories'
import { normalizeText } from '../utils/format'

const route = useRoute()
const catalog = useCatalogStore()
const categories = useCategoriesStore()
const selectedProduct = ref(null)

const products = computed(() => {
  const dynamicCategory =
    route.name === 'categoria'
      ? categories.categories.find((category) => category.slug === route.params.slug)
      : null
  const filter = dynamicCategory
    ? { type: 'categoria', value: dynamicCategory.nombre }
    : route.meta.filter
  const query = normalizeText(catalog.searchQuery)

  return catalog.products.filter((product) => {
    const matchesRoute = filter ? product[filter.type] === filter.value : true
    const matchesSearch =
      !query ||
      normalizeText(product.nombre).includes(query) ||
      normalizeText(product.categoria).includes(query)
    return matchesRoute && matchesSearch
  })
})

const heading = computed(() => {
  if (route.name === 'categoria') {
    return (
      categories.categories.find((item) => item.slug === route.params.slug)?.nombre || 'Categoría'
    )
  }
  return route.meta.heading
})

const selectProduct = async (product) => {
  try {
    selectedProduct.value = await catalog.getDetails(product._id || product.id)
  } catch {
    selectedProduct.value = product
  }
}
</script>

<template>
  <main class="container catalog-page py-5">
    <CategoryHeader
      :title="heading"
      :description="route.meta.description || 'Explora nuestros productos.'"
    />
    <div v-if="catalog.loading" class="loading-state" role="status">
      <span class="loading-spinner" aria-hidden="true"></span>
      <span>Cargando productos...</span>
    </div>
    <div v-else-if="catalog.error" class="app-status-banner app-status-banner--danger">
      <i class="bi bi-exclamation-circle-fill" aria-hidden="true"></i>{{ catalog.error }}
    </div>
    <ProductGrid v-else :products="products" @select="selectProduct" />
  </main>
  <ProductModal :product="selectedProduct" @close="selectedProduct = null" />
</template>

<script setup>
import { computed, ref } from 'vue'
import ProductGrid from '../components/catalog/ProductGrid.vue'
import ProductModal from '../components/catalog/ProductModal.vue'
import { useCatalogStore } from '../stores/catalog'
import { assetUrl, normalizeText } from '../utils/format'

const catalog = useCatalogStore()
const selectedProduct = ref(null)

const searchedProducts = computed(() => {
  const query = normalizeText(catalog.searchQuery)
  if (!query) return catalog.products
  return catalog.products.filter((product) => {
    return (
      normalizeText(product.nombre).includes(query) ||
      normalizeText(product.categoria).includes(query)
    )
  })
})

const bestSellers = computed(() =>
  searchedProducts.value.filter((product) => product.seccion === 'mas_vendidos'),
)
const newProducts = computed(() =>
  searchedProducts.value.filter((product) => product.seccion === 'nuevos_productos'),
)

const selectProduct = async (product) => {
  try {
    selectedProduct.value = await catalog.getDetails(product._id || product.id)
  } catch {
    selectedProduct.value = product
  }
}
</script>

<template>
  <main class="container py-4">
    <section class="row g-3 mb-5" aria-label="Promociones destacadas">
      <div class="col-12 col-md-4">
        <div class="hero-banner">
          <img
            :src="assetUrl('img/promoMaquillaje.jpeg')"
            alt="Promoción maquillaje"
            class="img-fluid"
          />
        </div>
      </div>
      <div class="col-12 col-md-4">
        <div class="hero-banner">
          <img
            :src="assetUrl('img/SkincarePromo.jpg')"
            alt="Promoción cuidados"
            class="img-fluid"
          />
        </div>
      </div>
      <div class="col-12 col-md-4">
        <div class="hero-banner d-none d-md-block">
          <img
            :src="assetUrl('img/promoPerfume.webp')"
            alt="Promoción fragancias"
            class="img-fluid"
          />
        </div>
      </div>
    </section>

    <section class="mb-5">
      <div class="d-flex justify-content-between align-items-end mb-3">
        <h2 class="section-title fs-4 mb-0">Más vendidos</h2>
        <RouterLink
          to="/mas-vendidos"
          class="text-decoration-none d-none d-lg-inline-flex align-items-center link-explorar"
        >
          Explorar más <i class="bi bi-arrow-right-circle ms-2 fs-5"></i>
        </RouterLink>
      </div>
      <ProductGrid :products="bestSellers" horizontal @select="selectProduct" />
    </section>

    <section class="mb-5">
      <div class="d-flex justify-content-between align-items-end mb-3">
        <h2 class="section-title fs-4 mb-0">Nuevos Productos</h2>
        <RouterLink
          to="/nuevos-productos"
          class="text-decoration-none d-none d-lg-inline-flex align-items-center link-explorar"
        >
          Explorar más <i class="bi bi-arrow-right-circle ms-2 fs-5"></i>
        </RouterLink>
      </div>
      <ProductGrid :products="newProducts" horizontal @select="selectProduct" />
    </section>
  </main>

  <ProductModal :product="selectedProduct" @close="selectedProduct = null" />
</template>

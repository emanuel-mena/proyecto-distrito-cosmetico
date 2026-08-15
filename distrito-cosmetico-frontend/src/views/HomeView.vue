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
  <main class="container home-page py-4">
    <section class="promo-grid" aria-label="Promociones destacadas">
      <RouterLink to="/promociones" class="hero-banner">
          <img
            :src="assetUrl('img/promoMaquillaje.jpeg')"
            alt="Promoción maquillaje"
            class="img-fluid"
          />
          <span class="hero-banner-overlay">Promociones de maquillaje</span>
      </RouterLink>
      <RouterLink to="/skincare" class="hero-banner">
          <img
            :src="assetUrl('img/SkincarePromo.jpg')"
            alt="Promoción cuidados"
            class="img-fluid"
          />
          <span class="hero-banner-overlay">Cuida tu piel</span>
      </RouterLink>
      <RouterLink to="/fragancias" class="hero-banner hero-banner--optional">
          <img
            :src="assetUrl('img/promoPerfume.webp')"
            alt="Promoción fragancias"
            class="img-fluid"
          />
          <span class="hero-banner-overlay">Encuentra tu fragancia</span>
      </RouterLink>
    </section>

    <section class="home-product-section">
      <div class="section-heading-row">
        <div>
          <span class="section-eyebrow">Favoritos de la comunidad</span>
          <h2 class="section-title">Más vendidos</h2>
        </div>
        <RouterLink
          to="/mas-vendidos"
          class="link-explorar"
        >
          Ver colección <i class="bi bi-arrow-right" aria-hidden="true"></i>
        </RouterLink>
      </div>
      <ProductGrid :products="bestSellers" horizontal @select="selectProduct" />
    </section>

    <section class="home-product-section">
      <div class="section-heading-row">
        <div>
          <span class="section-eyebrow">Recién llegados</span>
          <h2 class="section-title">Nuevos productos</h2>
        </div>
        <RouterLink
          to="/nuevos-productos"
          class="link-explorar"
        >
          Ver colección <i class="bi bi-arrow-right" aria-hidden="true"></i>
        </RouterLink>
      </div>
      <ProductGrid :products="newProducts" horizontal @select="selectProduct" />
    </section>
  </main>

  <ProductModal :product="selectedProduct" @close="selectedProduct = null" />
</template>

<script setup>
import { assetUrl } from '../../utils/format'
</script>

<template>
  <footer class="footer-bar mt-auto">
    <div class="container footer-content">
      <RouterLink to="/" class="footer-brand" aria-label="Ir al inicio">
        <img :src="assetUrl('data/brand/LogComp.svg')" alt="" />
        <span>
          <strong>Distrito Cosmético</strong>
          <small>Belleza para expresarte</small>
        </span>
      </RouterLink>
      <nav class="footer-links" aria-label="Enlaces del pie de página">
        <RouterLink to="/nosotros">Nosotros</RouterLink>
        <RouterLink to="/promociones">Promociones</RouterLink>
        <RouterLink to="/carrito">Mi carrito</RouterLink>
      </nav>
      <div class="footer-meta">
        <p>© 2026 Distrito Cosmético</p>
        <small>Todos los derechos reservados</small>
      </div>
    </div>
  </footer>
</template>

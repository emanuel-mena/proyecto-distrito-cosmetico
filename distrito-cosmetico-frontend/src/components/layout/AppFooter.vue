<script setup>
import { assetUrl } from '../../utils/format'
</script>

<template>
  <footer class="footer-bar py-4 mt-auto">
    <div
      class="container d-flex flex-column flex-md-row justify-content-between align-items-center text-center"
    >
      <p class="mb-3 mb-md-0 w-100 text-dark">
        © Copyright 2026 | Distrito Cosmético | Todos los Derechos Reservados
      </p>
      <div class="logo-box me-3">
        <img :src="assetUrl('data/brand/LogComp.svg')" alt="Logo Distrito Cosmético" />
      </div>
    </div>
  </footer>
</template>

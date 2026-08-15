<script setup>
import { assetUrl } from '../utils/format'
</script>

<template>
  <div class="landing-page">
    <header class="landing-header">
      <div class="container text-center">
        <img
          :src="assetUrl('data/brand/LogoDCVertical.svg')"
          alt="Distrito Cosmético"
          class="landing-logo"
        />
        <h1 class="display-4 fw-bold mt-3">Distrito Cosmético</h1>
        <p class="lead">Belleza, cuidado y confianza en un solo lugar.</p>
        <RouterLink to="/" class="btn btn-light btn-lg mt-3">Ingresar a la tienda</RouterLink>
      </div>
    </header>

    <main class="container py-5">
      <section class="info-section">
        <h2>¿Quiénes Somos?</h2>
        <p>
          Distrito Cosmético es una tienda en línea especializada en maquillaje, skincare,
          fragancias y productos para el cuidado personal. Nuestro objetivo es ofrecer una
          experiencia de compra moderna, segura y accesible para todos nuestros clientes.
        </p>
      </section>
      <section class="info-section">
        <h2>Misión</h2>
        <p>
          Brindar productos cosméticos de alta calidad mediante una experiencia de compra segura,
          eficiente y accesible, satisfaciendo las necesidades de belleza y bienestar de nuestros
          clientes.
        </p>
      </section>
      <section class="info-section">
        <h2>Visión</h2>
        <p>
          Ser la tienda de cosméticos en línea líder en Costa Rica, reconocida por la innovación,
          excelencia en servicio y calidad de nuestros productos.
        </p>
      </section>
      <section class="info-section">
        <h2>Valores</h2>
        <div class="row g-4 mt-3">
          <div
            v-for="value in ['Calidad', 'Innovación', 'Compromiso', 'Confianza']"
            :key="value"
            class="col-md-3"
          >
            <div class="value-card">{{ value }}</div>
          </div>
        </div>
      </section>
      <section class="info-section">
        <h2>Integrantes</h2>
        <ul class="team-list">
          <li>Lindsay Quirós</li>
          <li>Melina Soto</li>
          <li>Emanuel Mena</li>
        </ul>
      </section>
    </main>

    <footer class="landing-footer">
      <div class="container text-center">
        © 2026 Distrito Cosmético | Todos los Derechos Reservados
      </div>
    </footer>
  </div>
</template>

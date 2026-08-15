<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppFooter from './components/layout/AppFooter.vue'
import AppHeader from './components/layout/AppHeader.vue'
import { useCurrencyStore } from './stores/currency'

const route = useRoute()
const currency = useCurrencyStore()
const usesStoreLayout = computed(() => route.meta.layout === 'store')
</script>

<template>
  <div class="app-root" :class="{ 'store-layout': usesStoreLayout }">
    <AppHeader v-if="usesStoreLayout" />
    <div v-if="usesStoreLayout && currency.error" class="container mt-3">
      <div class="alert alert-warning mb-0">{{ currency.error }}</div>
    </div>
    <RouterView />
    <AppFooter v-if="usesStoreLayout" />
  </div>
</template>

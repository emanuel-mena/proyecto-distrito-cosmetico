<script setup>
import { computed } from 'vue'
import { useCurrencyStore } from '../../stores/currency'

const props = defineProps({
  order: { type: Object, required: true },
})
const currency = useCurrencyStore()

const badge = computed(
  () =>
    ({
      'En preparación': 'warning',
      Pendiente: 'secondary',
      'En camino': 'primary',
      Entregado: 'success',
    })[props.order.estado] || 'secondary',
)
</script>

<template>
  <div class="card border mb-3 rounded-4 shadow-sm">
    <div class="card-body">
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <h6 class="fw-bold mb-1">{{ order.id }}</h6>
          <small class="text-muted">{{ order.fecha }}</small>
        </div>
        <span class="badge" :class="`bg-${badge}`">{{ order.estado }}</span>
      </div>
      <hr />
      <div class="mb-3">
        <div
          v-for="(product, index) in order.productos"
          :key="`${order.id}-${index}`"
          class="d-flex justify-content-between gap-3"
        >
          <span>{{ product.cantidad }} × {{ product.nombre }}</span>
          <span>{{ currency.format(product.precio * product.cantidad) }}</span>
        </div>
      </div>
      <hr />
      <div class="d-flex justify-content-between">
        <strong>Total</strong>
        <strong>{{ currency.format(order.total) }}</strong>
      </div>
    </div>
  </div>
</template>

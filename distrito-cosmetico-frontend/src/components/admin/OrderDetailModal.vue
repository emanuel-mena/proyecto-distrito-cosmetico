<script setup>
import AppModal from '../common/AppModal.vue'
import { useCurrencyStore } from '../../stores/currency'

defineProps({
  order: { type: Object, default: null },
})
const emit = defineEmits(['close'])
const currency = useCurrencyStore()
</script>

<template>
  <AppModal
    :open="Boolean(order)"
    labelled-by="orderDetailTitle"
    size="modal-lg"
    @close="emit('close')"
  >
    <template #title>
      <h5 id="orderDetailTitle" class="modal-title fw-bold">Orden #{{ order?.id }}</h5>
    </template>

    <div v-if="order" class="modal-body p-4">
      <div class="row mb-4">
        <div class="col-md-6">
          <p><strong>Cliente:</strong> {{ order.usuario }}</p>
          <p v-if="order.correo"><strong>Correo:</strong> {{ order.correo }}</p>
        </div>
        <div class="col-md-6">
          <p><strong>Fecha:</strong> {{ order.fecha }}</p>
          <p><strong>Estado:</strong> {{ order.estado }}</p>
        </div>
      </div>
      <h6 class="fw-bold mb-3">Productos del pedido</h6>
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Precio</th>
              <th>Cantidad</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(product, index) in order.productos" :key="`${order.id}-${index}`">
              <td>{{ product.nombre }}</td>
              <td>{{ currency.format(product.precio) }}</td>
              <td>{{ product.cantidad }}</td>
              <td>{{ currency.format(product.precio * product.cantidad) }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" class="text-end fw-bold">Total</td>
              <td class="fw-bold">{{ currency.format(order.total) }}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
    <div class="modal-footer footer-bar border-0">
      <button type="button" class="btn btn-outline-dark rounded-pill px-4" @click="emit('close')">
        Cerrar
      </button>
    </div>
  </AppModal>
</template>

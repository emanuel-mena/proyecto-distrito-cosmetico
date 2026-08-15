<script setup>
import { useCurrencyStore } from '../../stores/currency'

defineProps({
  orders: { type: Array, required: true },
})
defineEmits(['status-change', 'view'])
const currency = useCurrencyStore()

const statuses = ['Pendiente', 'En preparación', 'En camino', 'Entregado']
</script>

<template>
  <p v-if="orders.length === 0" class="text-muted text-center py-4">No hay órdenes registradas.</p>
  <div v-else class="table-responsive">
    <table class="table table-hover align-middle">
      <thead>
        <tr>
          <th>Orden #</th>
          <th>Cliente</th>
          <th>Fecha</th>
          <th>Total</th>
          <th>Estado</th>
          <th class="text-end">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="order in orders" :key="order.id">
          <td>#{{ order.id }}</td>
          <td>{{ order.usuario }}</td>
          <td>{{ order.fecha }}</td>
          <td>{{ currency.format(order.total) }}</td>
          <td>
            <select
              class="form-select form-select-sm"
              :value="order.estado"
              :aria-label="`Estado de la orden ${order.id}`"
              @change="$emit('status-change', order, $event.target.value)"
            >
              <option v-for="status in statuses" :key="status" :value="status">
                {{ status }}
              </option>
            </select>
          </td>
          <td class="text-end">
            <button type="button" class="btn btn-sm btn-outline-dark" @click="$emit('view', order)">
              Ver detalle
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

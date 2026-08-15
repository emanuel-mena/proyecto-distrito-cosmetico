<script setup>
import { useCurrencyStore } from '../../stores/currency'

defineProps({
  products: { type: Array, required: true },
})
defineEmits(['edit', 'delete'])
const currency = useCurrencyStore()

const badge = (product) => {
  if (!product.disponible || product.stock === 0) return { className: 'bg-danger', text: 'Agotado' }
  if (product.stock <= 5) return { className: 'bg-warning text-dark', text: 'Stock bajo' }
  return { className: 'badge-disponibilidad', text: 'Disponible' }
}
</script>

<template>
  <div class="table-responsive">
    <table class="table table-hover align-middle">
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Categoría</th>
          <th>Precio</th>
          <th>Cantidad</th>
          <th>Estado</th>
          <th class="text-end">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="product in products" :key="product.id">
          <td>{{ product.nombre }}</td>
          <td>{{ product.categoria }}</td>
          <td>{{ currency.format(product.precio) }}</td>
          <td>{{ product.stock }}</td>
          <td>
            <span class="badge" :class="badge(product).className">{{ badge(product).text }}</span>
          </td>
          <td class="text-end">
            <button
              type="button"
              class="btn btn-sm btn-outline-dark me-2"
              @click="$emit('edit', product)"
            >
              Editar
            </button>
            <button
              type="button"
              class="btn btn-sm btn-outline-danger"
              @click="$emit('delete', product)"
            >
              Eliminar
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

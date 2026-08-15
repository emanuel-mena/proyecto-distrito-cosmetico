<script setup>
import { reactive, ref, watch } from 'vue'
import AppModal from '../common/AppModal.vue'

const props = defineProps({
  open: { type: Boolean, required: true },
  product: { type: Object, default: null },
  categories: { type: Array, default: () => [] },
})
const emit = defineEmits(['close', 'save'])
const formElement = ref(null)
const form = reactive({
  _id: '',
  id: null,
  nombre: '',
  categoria: 'Maquillaje',
  precio: '',
  stock: 0,
  descripcion: '',
  disponible: true,
  imagen: 'data/assets/fallback.webp',
  seccion: '',
  promocion: false,
})

watch(
  () => [props.open, props.product],
  ([open]) => {
    if (!open) return
    Object.assign(form, {
      _id: props.product?._id || '',
      id: props.product?.id || null,
      nombre: props.product?.nombre || '',
      categoria: props.product?.categoria || 'Maquillaje',
      precio: props.product?.precio ?? '',
      stock: props.product?.stock ?? 0,
      descripcion: props.product?.descripcion || '',
      disponible: props.product?.disponible ?? true,
      imagen: props.product?.imagen || 'data/assets/fallback.webp',
      seccion: props.product?.seccion || '',
      promocion: props.product?.promocion || false,
    })
  },
  { immediate: true },
)

const submit = () => {
  if (!formElement.value?.checkValidity()) {
    formElement.value?.reportValidity()
    return
  }
  emit('save', { ...form, precio: Number(form.precio), stock: Number(form.stock) })
}

watch(
  () => props.categories,
  (categories) => {
    if (!props.product && !categories.some((item) => item.nombre === form.categoria)) {
      form.categoria = categories.find((item) => item.activa)?.nombre || ''
    }
  },
  { immediate: true },
)
</script>

<template>
  <AppModal :open="open" labelled-by="productFormTitle" @close="emit('close')">
    <template #title>
      <h5 id="productFormTitle" class="modal-title fw-bold">
        {{ product ? 'Editar Producto' : 'Nuevo Producto' }}
      </h5>
    </template>

    <div class="modal-body p-4">
      <form ref="formElement" @submit.prevent="submit">
        <div class="mb-3">
          <label for="adminProductName" class="form-label">Nombre</label>
          <input
            id="adminProductName"
            v-model.trim="form.nombre"
            type="text"
            class="form-control"
            required
          />
        </div>
        <div class="mb-3">
          <label for="adminProductCategory" class="form-label">Categoría</label>
          <select id="adminProductCategory" v-model="form.categoria" class="form-select" required>
            <option
              v-for="category in categories.filter((item) => item.activa)"
              :key="category._id"
            >
              {{ category.nombre }}
            </option>
          </select>
        </div>
        <div class="mb-3">
          <label for="adminProductPrice" class="form-label">Precio (₡)</label>
          <input
            id="adminProductPrice"
            v-model="form.precio"
            type="number"
            class="form-control"
            min="0"
            required
          />
        </div>
        <div class="mb-3">
          <label for="adminProductStock" class="form-label">Cantidad disponible (stock)</label>
          <input
            id="adminProductStock"
            v-model="form.stock"
            type="number"
            class="form-control"
            min="0"
            required
          />
        </div>
        <div class="mb-3">
          <label for="adminProductDescription" class="form-label">Descripción</label>
          <textarea
            id="adminProductDescription"
            v-model.trim="form.descripcion"
            class="form-control"
            rows="2"
            required
          ></textarea>
        </div>
        <div class="form-check">
          <input
            id="adminProductAvailable"
            v-model="form.disponible"
            class="form-check-input"
            type="checkbox"
          />
          <label class="form-check-label" for="adminProductAvailable"
            >Disponible para la venta</label
          >
        </div>
      </form>
    </div>
    <div class="modal-footer footer-bar border-0">
      <button type="button" class="btn btn-outline-dark rounded-pill px-4" @click="emit('close')">
        Cancelar
      </button>
      <button type="button" class="btn btn-dark text-white rounded-pill px-4" @click="submit">
        Guardar
      </button>
    </div>
  </AppModal>
</template>

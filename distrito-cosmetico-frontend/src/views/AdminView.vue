<script setup>
import { onMounted, reactive, ref } from 'vue'
import OrderDetailModal from '../components/admin/OrderDetailModal.vue'
import OrderTable from '../components/admin/OrderTable.vue'
import ProductFormModal from '../components/admin/ProductFormModal.vue'
import ProductTable from '../components/admin/ProductTable.vue'
import { useCatalogStore } from '../stores/catalog'
import { useOrdersStore } from '../stores/orders'
import { useCategoriesStore } from '../stores/categories'

const catalog = useCatalogStore()
const orders = useOrdersStore()
const categories = useCategoriesStore()
const activeTab = ref('products')
const productModalOpen = ref(false)
const editingProduct = ref(null)
const selectedOrder = ref(null)
const error = ref('')
const categoryForm = reactive({ _id: '', nombre: '', activa: true })

onMounted(() => Promise.all([catalog.load(), categories.load(), orders.loadAll()]))

const openNewProduct = () => {
  editingProduct.value = null
  productModalOpen.value = true
}

const openEditProduct = (product) => {
  editingProduct.value = product
  productModalOpen.value = true
}

const saveProduct = async (product) => {
  try {
    await catalog.saveProduct(product)
    productModalOpen.value = false
    editingProduct.value = null
  } catch (cause) {
    error.value = cause.message
  }
}

const deleteProduct = async (product) => {
  if (confirm(`¿Eliminar "${product.nombre}"? Esta acción no se puede deshacer.`)) {
    try {
      await catalog.deleteProduct(product)
    } catch (cause) {
      error.value = cause.message
    }
  }
}

const editCategory = (category) => Object.assign(categoryForm, category)
const resetCategory = () => Object.assign(categoryForm, { _id: '', nombre: '', activa: true })
const saveCategory = async () => {
  try {
    await categories.save(categoryForm)
    resetCategory()
    await catalog.load()
  } catch (cause) {
    error.value = cause.message
  }
}
const deleteCategory = async (category) => {
  if (!confirm(`¿Eliminar la categoría "${category.nombre}"?`)) return
  try {
    await categories.remove(category)
  } catch (cause) {
    error.value = cause.message
  }
}
const changeStatus = async (order, status) => {
  try {
    await orders.updateStatus(order, status)
  } catch (cause) {
    error.value = cause.message
    await orders.loadAll()
  }
}
const viewOrder = async (order) => {
  try {
    selectedOrder.value = await orders.getDetails(order._id)
  } catch (cause) {
    error.value = cause.message
  }
}
</script>

<template>
  <main class="container py-5">
    <div class="text-center mb-5">
      <h1 class="display-4 fw-bold">Panel de Administrador</h1>
      <p class="lead text-muted">Gestiona productos, inventario y órdenes.</p>
    </div>

    <ul class="nav nav-tabs mb-4" role="tablist">
      <li class="nav-item">
        <button
          type="button"
          class="nav-link"
          :class="{ active: activeTab === 'products' }"
          role="tab"
          @click="activeTab = 'products'"
        >
          Productos
        </button>
      </li>
      <li class="nav-item">
        <button
          type="button"
          class="nav-link"
          :class="{ active: activeTab === 'categories' }"
          role="tab"
          @click="activeTab = 'categories'"
        >
          Categorías
        </button>
      </li>
      <li class="nav-item">
        <button
          type="button"
          class="nav-link"
          :class="{ active: activeTab === 'orders' }"
          role="tab"
          @click="activeTab = 'orders'"
        >
          Órdenes
        </button>
      </li>
    </ul>

    <div v-if="error" class="alert alert-danger alert-dismissible">
      {{ error }}
      <button type="button" class="btn-close" aria-label="Cerrar" @click="error = ''"></button>
    </div>

    <section v-if="activeTab === 'products'">
      <div class="d-flex justify-content-end mb-3">
        <button
          type="button"
          class="btn btn-dark text-white rounded-pill px-4"
          @click="openNewProduct"
        >
          <i class="bi bi-plus-lg me-2"></i>Nuevo Producto
        </button>
      </div>
      <ProductTable :products="catalog.products" @edit="openEditProduct" @delete="deleteProduct" />
    </section>

    <section v-else-if="activeTab === 'orders'">
      <OrderTable :orders="orders.orders" @status-change="changeStatus" @view="viewOrder" />
    </section>
    <section v-else>
      <form class="card card-body border-0 shadow-sm mb-4" @submit.prevent="saveCategory">
        <div class="row g-3 align-items-end">
          <div class="col-md-7">
            <label for="categoryName" class="form-label">Nombre de la categoría</label>
            <input
              id="categoryName"
              v-model.trim="categoryForm.nombre"
              class="form-control"
              required
            />
          </div>
          <div class="col-md-2 form-check mb-2 ms-3">
            <input
              id="categoryActive"
              v-model="categoryForm.activa"
              type="checkbox"
              class="form-check-input"
            />
            <label for="categoryActive" class="form-check-label">Activa</label>
          </div>
          <div class="col-md d-flex gap-2">
            <button class="btn btn-dark" type="submit">
              {{ categoryForm._id ? 'Actualizar' : 'Agregar' }}
            </button>
            <button
              v-if="categoryForm._id"
              class="btn btn-outline-secondary"
              type="button"
              @click="resetCategory"
            >
              Cancelar
            </button>
          </div>
        </div>
      </form>
      <div class="table-responsive">
        <table class="table table-hover align-middle">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Slug</th>
              <th>Estado</th>
              <th class="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="category in categories.categories" :key="category._id">
              <td>{{ category.nombre }}</td>
              <td>{{ category.slug }}</td>
              <td>{{ category.activa ? 'Activa' : 'Inactiva' }}</td>
              <td class="text-end">
                <button
                  class="btn btn-sm btn-outline-dark me-2"
                  type="button"
                  @click="editCategory(category)"
                >
                  Editar
                </button>
                <button
                  class="btn btn-sm btn-outline-danger"
                  type="button"
                  @click="deleteCategory(category)"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </main>

  <ProductFormModal
    :open="productModalOpen"
    :product="editingProduct"
    :categories="categories.categories"
    @close="productModalOpen = false"
    @save="saveProduct"
  />
  <OrderDetailModal :order="selectedOrder" @close="selectedOrder = null" />
</template>

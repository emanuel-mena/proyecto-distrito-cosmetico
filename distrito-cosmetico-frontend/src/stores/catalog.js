import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '../api/client'

export const normalizeProduct = (product) => ({
  _id: String(product._id || ''),
  id: Number(product.id),
  nombre: String(product.nombre || ''),
  categoria: String(product.categoria || ''),
  precio: Math.max(0, Number(product.precio) || 0),
  descripcion: String(product.descripcion || ''),
  imagen: String(product.imagen || 'data/assets/fallback.webp'),
  disponible: product.disponible === true,
  seccion: String(product.seccion || ''),
  promocion: product.promocion === true,
  stock: Math.max(0, Math.floor(Number(product.stock) || 0)),
})

export const useCatalogStore = defineStore('catalog', () => {
  const products = ref([])
  const searchQuery = ref('')
  const loading = ref(false)
  const error = ref('')

  async function load(query = {}) {
    loading.value = true
    error.value = ''
    try {
      const params = new URLSearchParams(query)
      const result = await api(`/products${params.size ? `?${params}` : ''}`)
      products.value = result.data.map(normalizeProduct)
    } catch (cause) {
      error.value = cause.message
    } finally {
      loading.value = false
    }
  }

  function findById(id) {
    return products.value.find((product) => product.id === Number(id) || product._id === String(id))
  }

  async function getDetails(id) {
    const result = await api(`/products/${id}`)
    return normalizeProduct(result.data)
  }

  async function saveProduct(input) {
    const editing = Boolean(input._id || input.id)
    const identifier = input._id || input.id
    const body = { ...input }
    delete body._id
    if (!editing) delete body.id
    const result = await api(editing ? `/products/${identifier}` : '/products', {
      method: editing ? 'PUT' : 'POST',
      body,
    })
    const product = normalizeProduct(result.data)
    const index = products.value.findIndex((item) => item._id === product._id)
    if (index >= 0) products.value[index] = product
    else products.value.push(product)
    return product
  }

  async function deleteProduct(product) {
    await api(`/products/${product._id || product.id}`, { method: 'DELETE' })
    products.value = products.value.filter((item) => item._id !== product._id)
  }

  return {
    products,
    searchQuery,
    loading,
    error,
    load,
    findById,
    getDetails,
    saveProduct,
    deleteProduct,
  }
})

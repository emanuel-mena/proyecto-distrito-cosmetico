import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '../api/client'

export const useCategoriesStore = defineStore('categories', () => {
  const categories = ref([])
  const loading = ref(false)
  const error = ref('')

  async function load() {
    loading.value = true
    try {
      const result = await api('/categories')
      categories.value = result.data
    } catch (cause) {
      error.value = cause.message
    } finally {
      loading.value = false
    }
  }

  async function save(input) {
    const editing = Boolean(input._id)
    const result = await api(editing ? `/categories/${input._id}` : '/categories', {
      method: editing ? 'PUT' : 'POST',
      body: { nombre: input.nombre, activa: input.activa ?? true },
    })
    await load()
    return result.data
  }

  async function remove(category) {
    await api(`/categories/${category._id}`, { method: 'DELETE' })
    categories.value = categories.value.filter((item) => item._id !== category._id)
  }

  return { categories, loading, error, load, save, remove }
})

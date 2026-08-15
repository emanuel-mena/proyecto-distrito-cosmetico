import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '../api/client'

const normalizeOrder = (order) => ({
  ...order,
  _id: String(order._id || ''),
  id: String(order.numero || order._id || ''),
  usuario: String(order.cliente || 'Cliente'),
  fecha: order.fecha ? new Date(order.fecha).toLocaleDateString('es-CR') : '',
  productos: Array.isArray(order.productos) ? order.productos : [],
  total: Number(order.total) || 0,
})

export const useOrdersStore = defineStore('orders', () => {
  const orders = ref([])
  const loading = ref(false)
  const error = ref('')

  async function loadAll() {
    loading.value = true
    error.value = ''
    try {
      const result = await api('/orders')
      orders.value = result.data.map(normalizeOrder)
    } catch (cause) {
      error.value = cause.message
    } finally {
      loading.value = false
    }
  }

  async function loadForUser(userId) {
    loading.value = true
    try {
      const result = await api(`/orders/user/${userId}`)
      orders.value = result.data.map(normalizeOrder)
    } catch (cause) {
      error.value = cause.message
    } finally {
      loading.value = false
    }
  }

  async function getDetails(id) {
    const result = await api(`/orders/${id}`)
    return normalizeOrder(result.data)
  }

  async function createOrder(details) {
    const result = await api('/orders', { method: 'POST', body: details })
    const order = normalizeOrder(result.data)
    orders.value.unshift(order)
    return order
  }

  async function updateStatus(order, estado) {
    const result = await api(`/orders/${order._id}/status`, {
      method: 'PATCH',
      body: { estado },
    })
    const updated = normalizeOrder(result.data)
    const index = orders.value.findIndex((item) => item._id === updated._id)
    if (index >= 0) orders.value[index] = updated
  }

  return { orders, loading, error, loadAll, loadForUser, getDetails, createOrder, updateStatus }
})

import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '../api/client'
import { useAuthStore } from './auth'
import { normalizeProduct, useCatalogStore } from './catalog'

const GUEST_CART_KEY = 'dcGuestCartV2'
const readGuest = () => {
  try {
    const value = JSON.parse(localStorage.getItem(GUEST_CART_KEY) || '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

const normalizeRemote = (cart) =>
  (cart?.items || [])
    .filter((item) => item.producto)
    .map((item) => ({
      id: Number(item.producto.id),
      cantidad: Number(item.cantidad),
      product: normalizeProduct(item.producto),
    }))

export const useCartStore = defineStore('cart', () => {
  const auth = useAuthStore()
  const catalog = useCatalogStore()
  const lines = ref([])
  const loading = ref(false)
  const error = ref('')

  const items = computed(() =>
    lines.value
      .map((line) => ({ ...line, product: line.product || catalog.findById(line.id) }))
      .filter((item) => item.product),
  )
  const count = computed(() => lines.value.reduce((sum, item) => sum + item.cantidad, 0))
  const total = computed(() =>
    items.value.reduce((sum, item) => sum + item.product.precio * item.cantidad, 0),
  )

  const persistGuest = () =>
    localStorage.setItem(
      GUEST_CART_KEY,
      JSON.stringify(lines.value.map(({ id, cantidad }) => ({ id, cantidad }))),
    )

  async function load() {
    error.value = ''
    if (!auth.isAuthenticated) {
      lines.value = readGuest()
      return
    }
    loading.value = true
    try {
      const result = await api('/cart')
      lines.value = normalizeRemote(result.data)
    } catch (cause) {
      error.value = cause.message
    } finally {
      loading.value = false
    }
  }

  async function add(product) {
    if (!product?.disponible || product.stock <= 0)
      return { ok: false, message: 'Este producto no está disponible.' }
    const existing = lines.value.find((line) => line.id === product.id)
    const quantity = (existing?.cantidad || 0) + 1
    if (quantity > product.stock)
      return { ok: false, message: `Solo hay ${product.stock} unidad(es) disponible(s).` }
    try {
      if (auth.isAuthenticated) {
        const result = await api('/cart/items', {
          method: 'POST',
          body: { productId: product._id || product.id, cantidad: quantity },
        })
        lines.value = normalizeRemote(result.data)
      } else {
        if (existing) existing.cantidad = quantity
        else lines.value.push({ id: product.id, cantidad: 1, product })
        persistGuest()
      }
      return { ok: true, message: 'Producto agregado al carrito.' }
    } catch (cause) {
      return { ok: false, message: cause.message }
    }
  }

  async function setQuantity(id, quantity) {
    const product =
      catalog.findById(id) || items.value.find((item) => item.id === Number(id))?.product
    if (!product || quantity <= 0) return remove(id)
    const normalized = Math.min(Math.floor(Number(quantity)), product.stock)
    if (auth.isAuthenticated) {
      const result = await api(`/cart/items/${product._id || product.id}`, {
        method: 'PUT',
        body: { cantidad: normalized },
      })
      lines.value = normalizeRemote(result.data)
    } else {
      const line = lines.value.find((item) => item.id === Number(id))
      if (line) line.cantidad = normalized
      persistGuest()
    }
  }

  async function remove(id) {
    const product =
      catalog.findById(id) || items.value.find((item) => item.id === Number(id))?.product
    if (auth.isAuthenticated && product) {
      const result = await api(`/cart/items/${product._id || product.id}`, { method: 'DELETE' })
      lines.value = normalizeRemote(result.data)
    } else {
      lines.value = lines.value.filter((item) => item.id !== Number(id))
      persistGuest()
    }
  }

  async function clear() {
    if (auth.isAuthenticated) await api('/cart', { method: 'DELETE' })
    lines.value = []
    if (!auth.isAuthenticated) persistGuest()
  }

  async function mergeGuest() {
    const guest = readGuest()
    const remoteResult = await api('/cart')
    lines.value = normalizeRemote(remoteResult.data)
    for (const guestLine of guest) {
      const product = catalog.findById(guestLine.id)
      if (!product?.disponible || product.stock <= 0) continue
      const remote = lines.value.find((line) => line.id === guestLine.id)
      const cantidad = Math.min((remote?.cantidad || 0) + guestLine.cantidad, product.stock)
      const result = await api(`/cart/items/${product._id || product.id}`, {
        method: 'PUT',
        body: { cantidad },
      })
      lines.value = normalizeRemote(result.data)
    }
    localStorage.removeItem(GUEST_CART_KEY)
  }

  function useGuestCart() {
    lines.value = readGuest()
  }

  return {
    lines,
    items,
    count,
    total,
    loading,
    error,
    load,
    add,
    setQuantity,
    remove,
    clear,
    mergeGuest,
    useGuestCart,
  }
})

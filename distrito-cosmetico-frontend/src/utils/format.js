export const formatPrice = (value) => `₡${Number(value || 0).toLocaleString('es-CR')}`

export const normalizeText = (value = '') =>
  value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

export const assetUrl = (path) => {
  if (!path) return `${import.meta.env.BASE_URL}data/assets/fallback.webp`
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`
}

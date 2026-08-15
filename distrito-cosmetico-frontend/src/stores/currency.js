import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '../api/client'

const CURRENCY_KEY = 'dcCurrencyV1'

export const useCurrencyStore = defineStore('currency', () => {
  const currency = ref(localStorage.getItem(CURRENCY_KEY) === 'USD' ? 'USD' : 'CRC')
  const rate = ref(1)
  const error = ref('')
  const symbol = computed(() => (currency.value === 'USD' ? '$' : '₡'))

  async function setCurrency(value) {
    currency.value = value === 'USD' ? 'USD' : 'CRC'
    localStorage.setItem(CURRENCY_KEY, currency.value)
    rate.value = 1
    error.value = ''
    if (currency.value === 'USD') {
      try {
        const result = await api('/currency/convert?amount=1&from=crc&to=usd')
        rate.value = Number(result.data.rate)
      } catch (cause) {
        currency.value = 'CRC'
        localStorage.setItem(CURRENCY_KEY, 'CRC')
        error.value = `${cause.message} Se muestran precios en colones.`
      }
    }
  }

  const convert = (value) => Number(value || 0) * rate.value

  const format = (value) =>
    new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: currency.value,
      maximumFractionDigits: currency.value === 'USD' ? 2 : 0,
    }).format(convert(value))

  return { currency, rate, error, symbol, setCurrency, convert, format }
})

import { ref } from 'vue'
import { defineStore } from 'pinia'

let notificationId = 0

export const useFeedbackStore = defineStore('feedback', () => {
  const notifications = ref([])
  const confirmation = ref(null)

  function dismiss(id) {
    notifications.value = notifications.value.filter((item) => item.id !== id)
  }

  function notify({ message, type = 'success', duration = 3600 }) {
    const id = ++notificationId
    notifications.value.push({ id, message, type })
    window.setTimeout(() => dismiss(id), duration)
    return id
  }

  function confirm({
    title,
    message,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    tone = 'primary',
  }) {
    if (confirmation.value) confirmation.value.resolve(false)

    return new Promise((resolve) => {
      confirmation.value = { title, message, confirmLabel, cancelLabel, tone, resolve }
    })
  }

  function settleConfirmation(accepted) {
    if (!confirmation.value) return
    const { resolve } = confirmation.value
    confirmation.value = null
    resolve(accepted)
  }

  return { notifications, confirmation, notify, dismiss, confirm, settleConfirmation }
})

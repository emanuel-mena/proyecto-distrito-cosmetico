<script setup>
import AppModal from './AppModal.vue'
import { useFeedbackStore } from '../../stores/feedback'

const feedback = useFeedbackStore()

const iconFor = (type) =>
  ({
    success: 'bi-check-circle-fill',
    danger: 'bi-exclamation-circle-fill',
    warning: 'bi-exclamation-triangle-fill',
    info: 'bi-info-circle-fill',
  })[type] || 'bi-check-circle-fill'
</script>

<template>
  <Teleport to="body">
    <div class="toast-region" aria-live="polite" aria-atomic="true">
      <div
        v-for="notification in feedback.notifications"
        :key="notification.id"
        class="app-toast"
        :class="`app-toast--${notification.type}`"
        role="status"
      >
        <i class="bi" :class="iconFor(notification.type)" aria-hidden="true"></i>
        <span>{{ notification.message }}</span>
        <button
          type="button"
          class="app-toast-close"
          aria-label="Cerrar notificación"
          @click="feedback.dismiss(notification.id)"
        >
          <i class="bi bi-x-lg" aria-hidden="true"></i>
        </button>
      </div>
    </div>
  </Teleport>

  <AppModal
    :open="Boolean(feedback.confirmation)"
    labelled-by="confirmationTitle"
    @close="feedback.settleConfirmation(false)"
  >
    <template #title>
      <h2 id="confirmationTitle" class="modal-title fs-5 fw-bold">
        {{ feedback.confirmation?.title }}
      </h2>
    </template>

    <div class="confirmation-dialog-body">
      <div
        class="confirmation-icon"
        :class="`confirmation-icon--${feedback.confirmation?.tone || 'primary'}`"
      >
        <i
          class="bi"
          :class="feedback.confirmation?.tone === 'danger' ? 'bi-trash3' : 'bi-bag-check'"
          aria-hidden="true"
        ></i>
      </div>
      <p class="mb-0">{{ feedback.confirmation?.message }}</p>
    </div>
    <div class="confirmation-dialog-actions">
      <button
        type="button"
        class="btn-app btn-app-secondary"
        @click="feedback.settleConfirmation(false)"
      >
        {{ feedback.confirmation?.cancelLabel }}
      </button>
      <button
        type="button"
        class="btn-app"
        :class="feedback.confirmation?.tone === 'danger' ? 'btn-app-danger' : 'btn-app-primary'"
        @click="feedback.settleConfirmation(true)"
      >
        {{ feedback.confirmation?.confirmLabel }}
      </button>
    </div>
  </AppModal>
</template>

<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps({
  open: { type: Boolean, required: true },
  labelledBy: { type: String, required: true },
  size: { type: String, default: '' },
})
const emit = defineEmits(['close'])
const closeButton = ref(null)
const dialog = ref(null)
let previousFocus = null

const close = () => emit('close')
const onCancel = (event) => {
  event.preventDefault()
  close()
}

watch(
  () => props.open,
  async (open) => {
    if (open) {
      previousFocus = document.activeElement
      document.body.classList.add('modal-open')
      await nextTick()
      if (props.open && dialog.value && !dialog.value.open) {
        dialog.value.showModal()
        closeButton.value?.focus()
      }
    } else {
      if (dialog.value?.open) dialog.value.close()
      document.body.classList.remove('modal-open')
      previousFocus?.focus?.()
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  document.body.classList.remove('modal-open')
  if (dialog.value?.open) dialog.value.close()
})
</script>

<template>
  <Teleport to="body">
    <dialog
      v-if="open"
      ref="dialog"
      class="modal fade show app-modal-dialog"
      :aria-labelledby="labelledBy"
      @cancel="onCancel"
      @mousedown.self="close"
    >
      <div class="modal-dialog modal-dialog-centered" :class="size">
        <div class="modal-content border-0 shadow">
          <div class="modal-header header-top text-dark">
            <slot name="title"></slot>
            <button
              ref="closeButton"
              type="button"
              class="btn-close"
              aria-label="Cerrar"
              @click="close"
            ></button>
          </div>
          <slot></slot>
        </div>
      </div>
    </dialog>
  </Teleport>
</template>

<style scoped>
.app-modal-dialog {
  display: block;
  max-width: none;
  max-height: none;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
}

.app-modal-dialog::backdrop {
  background: rgba(0, 0, 0, 0.5);
}
</style>

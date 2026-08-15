<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps({
  open: { type: Boolean, required: true },
  labelledBy: { type: String, required: true },
  size: { type: String, default: '' },
})
const emit = defineEmits(['close'])
const closeButton = ref(null)
let previousFocus = null

const close = () => emit('close')
const onKeydown = (event) => {
  if (event.key === 'Escape' && props.open) close()
}

watch(
  () => props.open,
  async (open) => {
    if (open) {
      previousFocus = document.activeElement
      document.body.classList.add('modal-open')
      await nextTick()
      closeButton.value?.focus()
    } else {
      document.body.classList.remove('modal-open')
      previousFocus?.focus?.()
    }
  },
)

window.addEventListener('keydown', onKeydown)
onBeforeUnmount(() => {
  document.body.classList.remove('modal-open')
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <div v-if="open">
      <div class="modal-backdrop fade show"></div>
      <div
        class="modal fade show"
        tabindex="-1"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="labelledBy"
        style="display: block"
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
      </div>
    </div>
  </Teleport>
</template>

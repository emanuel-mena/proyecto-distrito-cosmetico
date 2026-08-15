<script setup>
defineProps({
  title: { type: String, required: true },
  description: { type: String, required: true },
})
</script>

<template>
  <div class="text-center mb-5">
    <h1 class="display-4 fw-bold">{{ title }}</h1>
    <p class="lead text-muted">{{ description }}</p>
  </div>
</template>

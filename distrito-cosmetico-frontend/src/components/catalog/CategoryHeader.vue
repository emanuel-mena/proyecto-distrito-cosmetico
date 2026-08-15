<script setup>
defineProps({
  title: { type: String, required: true },
  description: { type: String, required: true },
})
</script>

<template>
  <div class="category-heading">
    <span class="section-eyebrow">Colección Distrito</span>
    <h1>{{ title }}</h1>
    <p>{{ description }}</p>
  </div>
</template>

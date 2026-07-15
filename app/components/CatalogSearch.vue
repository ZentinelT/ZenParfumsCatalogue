<script setup lang="ts">
const model = defineModel<string>({ required: true });
</script>

<template>
  <div class="srch-wrap">
    <svg class="srch-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
    <input
      :value="model"
      class="srch"
      type="search"
      placeholder="Buscar perfume, marca, notas…"
      autocomplete="off"
      aria-label="Buscar en el catálogo"
      @input="model = ($event.target as HTMLInputElement).value"
    >
  </div>
</template>

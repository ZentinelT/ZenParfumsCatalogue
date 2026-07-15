<script setup lang="ts">
defineProps<{ dark?: boolean }>();
</script>

<template>
  <svg class="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
    <template v-if="dark">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </template>
    <template v-else>
      <path d="M12 3v2m0 14v2m9-9h-2M5 12H3m9-6 1.4-1.4M9.6 14.4 8.2 15.8m6.2-1.4 1.4 1.4M9.6 9.6 8.2 8.2" />
      <circle cx="12" cy="12" r="3.5" />
    </template>
  </svg>
</template>

<script setup lang="ts">
const notifications = useNotificationsStore();
</script>

<template>
  <div class="notif" :class="{ on: notifications.visible }" role="status" aria-live="polite">
    <span class="nico">✓</span>
    <span>{{ notifications.text }}</span>
  </div>
</template>

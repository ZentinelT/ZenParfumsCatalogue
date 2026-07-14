<script setup lang="ts">
// Shell mínimo del scaffold. Las páginas viven en app/pages/.
useHead({
  title: "Zen Parfums — Fragancias Originales Premium",
  meta: [
    { name: "description", content: "Perfumes 100% originales. Más de 500 fragancias. Envíos a toda Argentina." },
  ],
});
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </div>
</template>

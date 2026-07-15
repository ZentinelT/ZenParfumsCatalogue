<script setup lang="ts">
defineProps<{ size?: number }>();
</script>

<template>
  <!-- .attr fuerza atributo: en el <svg> raíz de un componente, Vue intenta
       setear width/height como propiedad del DOM (read-only) y rompe la hidratación. -->
  <svg :width.attr="size ?? 15" :height.attr="size ?? 15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
</template>

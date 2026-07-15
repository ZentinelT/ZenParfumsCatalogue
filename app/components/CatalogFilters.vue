<script setup lang="ts">
import type { Filtro } from "~/composables/useCatalog";

const model = defineModel<Filtro>({ required: true });

const opciones: { value: Filtro; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "hombre", label: "Hombre" },
  { value: "mujer", label: "Mujer" },
  { value: "unisex", label: "Unisex" },
  { value: "arabes", label: "Árabes" },
  { value: "internacional", label: "Internacional" },
];
</script>

<template>
  <div class="filters" role="group" aria-label="Filtrar catálogo">
    <button
      v-for="o in opciones"
      :key="o.value"
      class="fb"
      :class="{ on: model === o.value }"
      :aria-pressed="model === o.value"
      @click="model = o.value"
    >
      {{ o.label }}
    </button>
  </div>
</template>

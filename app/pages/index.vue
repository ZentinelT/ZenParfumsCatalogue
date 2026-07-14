<script setup lang="ts">
import type { Product } from "~~/shared/types.ts";
// data/catalog.json lo genera scripts/fetch-catalog.ts antes de `nuxi generate`
// (ver script `generate:fixture`). Es un artefacto, no se commitea.
import catalog from "~~/data/catalog.json";

const productos = catalog as Product[];

// Placeholder de scaffold. Fase 3 reemplaza esto por CatalogGrid + filtros +
// búsqueda + paginación + tarjetas reales.
const visibles = computed(() => productos.filter((p) => p.categoria !== "accesorios").slice(0, 12));
</script>

<template>
  <main style="max-width: var(--mw); margin: 0 auto; padding: 2rem 1rem;">
    <h1 style="font-family: var(--fd); color: var(--go); font-size: 2rem;">
      Zen Parfums
    </h1>
    <p style="color: var(--gr); margin: .5rem 0 2rem;">
      Scaffold Nuxt SSG · {{ productos.length }} productos en el catálogo
    </p>

    <ul style="list-style: none; display: grid; gap: 1rem; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));">
      <li
        v-for="p in visibles"
        :key="p.id"
        style="border: 1px solid var(--lg); border-radius: var(--r8); padding: 1rem; background: var(--ow);"
      >
        <img
          v-if="p.imagenUrl"
          :src="p.imagenUrl"
          :alt="p.marca"
          referrerpolicy="no-referrer"
          loading="lazy"
          style="width: 100%; height: 160px; object-fit: contain;"
        >
        <div style="font-size: .75rem; letter-spacing: .05em; color: var(--mg);">
          {{ p.marca }}
        </div>
        <div style="font-family: var(--fd); font-size: 1.1rem; color: var(--bk);">
          {{ p.nombre }}
        </div>
        <div style="color: var(--go); font-weight: 600;">
          {{ p.stock === "out" ? "SIN STOCK" : p.precioFmt }}
        </div>
      </li>
    </ul>
  </main>
</template>

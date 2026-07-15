<script setup lang="ts">
import type { Ficha } from "~~/shared/types.ts";

const ui = useUiStore();
const { getProductByFicha } = useCatalogData();
const { getFicha, cargando } = useFichas();

const ficha = ref<Ficha | undefined>();

// Las fichas se bajan on-demand la primera vez que se abre una (NFR-001).
watch(() => ui.fichaSlug, async (slug) => {
  if (!slug) { ficha.value = undefined; return; }
  ficha.value = await getFicha(slug);
}, { immediate: true });

const producto = computed(() => (ficha.value ? getProductByFicha(ficha.value.slug) : undefined));
const nombre = computed(() => producto.value?.nombre ?? ficha.value?.nombre_completo ?? "");
const abierto = computed(() => ui.fichaSlug !== null);
</script>

<template>
  <div class="pmov" :class="{ on: abierto }" @click.self="ui.closeFicha()">
    <div v-if="abierto" class="fc" role="dialog" aria-modal="true" :aria-label="nombre">
      <button class="pm-cl" aria-label="Cerrar" @click="ui.closeFicha()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
      <FichaContent v-if="ficha" :ficha="ficha" :nombre="nombre" :marca-fallback="producto?.marca" />
      <div v-else class="fc-bd" style="padding:32px;text-align:center;color:var(--gr)">
        {{ cargando ? "Cargando ficha…" : "Ficha no disponible." }}
      </div>
    </div>
  </div>
</template>

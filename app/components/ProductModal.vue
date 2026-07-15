<script setup lang="ts">
const ui = useUiStore();
const { getProduct } = useCatalogData();

const product = computed(() => (ui.productId !== null ? getProduct(ui.productId) : undefined));
</script>

<template>
  <div class="pmov" :class="{ on: !!product }" @click.self="ui.closeProduct()">
    <div v-if="product" class="pm" role="dialog" aria-modal="true" :aria-label="product.nombre">
      <button class="pm-cl" aria-label="Cerrar" @click="ui.closeProduct()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
      <ProductDetail :product="product" />
    </div>
  </div>
</template>

<script setup lang="ts">
const { productos } = useCatalogData();
const cart = useCartStore();

const { filtro, busqueda, pagina, visibles, contador, paginas, setPagina } = useCatalog(productos);

const section = ref<HTMLElement | null>(null);

onMounted(() => {
  // Migración: reasigna ids del carrito legacy contra el catálogo actual.
  cart.remapIds(productos);
});

function scrollToTop() {
  section.value?.scrollIntoView({ behavior: "smooth", block: "start" });
}
function onFiltro(v: typeof filtro.value) {
  filtro.value = v;
  busqueda.value = "";
  pagina.value = 1;
  if (v !== "todos") nextTick(scrollToTop);
}
function onPagina(p: number) {
  setPagina(p);
  nextTick(scrollToTop);
}
</script>

<template>
  <section id="catalogo" ref="section" class="sec sec-p">
    <div class="sec-in">
      <div class="sh">
        <span class="sey">Catálogo</span>
        <h2 class="st">Fragancias <em>Premium</em></h2>
        <p class="sub">+500 perfumes originales. Árabes e internacionales, para él, para ella y unisex.</p>
        <div class="gr" />
      </div>

      <CatalogSearch v-model="busqueda" />
      <CatalogFilters :model-value="filtro" @update:model-value="onFiltro" />

      <div class="pg">
        <ProductCard v-for="p in visibles" :key="p.id" :product="p" />
      </div>

      <PaginationBar :current="pagina" :pages="paginas" @change="onPagina" />
      <p class="pcount">{{ contador }}</p>
    </div>
  </section>
</template>

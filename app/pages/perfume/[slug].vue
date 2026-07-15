<script setup lang="ts">
const route = useRoute();
const { productos } = useCatalogData();

const product = productos.find((p) => p.slug === route.params.slug);
if (!product) {
  throw createError({ statusCode: 404, statusMessage: "Perfume no encontrado", fatal: true });
}

// Solo la ficha de este producto entra al payload (no el fichas.json entero).
const { getFicha } = useFichas();
const { data: ficha } = await useAsyncData(
  `ficha-${product.slug}`,
  async () => (await getFicha(product.fichaSlug)) ?? null,
);

const disponible = computed(() => product.stock !== "out");

const site = useSiteConfig();
const canonical = computed(() => `${site.url}/perfume/${product!.slug}`);

useSeoMeta({
  title: () => `${product!.marca} ${product!.nombre} — Zen Parfums`,
  description: () =>
    `${product!.marca} ${product!.nombre}${product!.concentracion ? ` ${product!.concentracion}` : ""}${product!.tamanoMl ? ` ${product!.tamanoMl}ml` : ""}. ${disponible.value ? `Precio ${product!.precioFmt}.` : "Sin stock."} 100% original en Zen Parfums.`,
  ogTitle: () => `${product!.marca} ${product!.nombre}`,
  ogType: "product",
  ogImage: () => product!.imagenUrl || undefined,
});

useHead({
  link: [{ rel: "canonical", href: canonical.value }],
  script: [
    {
      type: "application/ld+json",
      innerHTML: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Product",
        name: `${product.marca} ${product.nombre}`,
        brand: { "@type": "Brand", name: product.marca },
        image: product.imagenUrl || undefined,
        offers: {
          "@type": "Offer",
          priceCurrency: "ARS",
          price: product.precio,
          availability: disponible.value
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
          url: canonical.value,
        },
      }),
    },
  ],
});
</script>

<template>
  <div class="sec">
    <div class="sec-in">
      <NuxtLink to="/#catalogo" class="btn btn-ol" style="margin-bottom:24px;display:inline-flex">← Volver al catálogo</NuxtLink>
      <div class="pm pm-static">
        <ProductDetail v-if="product" :product="product" />
      </div>

      <div v-if="ficha" class="fc fc-static">
        <FichaContent :ficha="ficha" :nombre="product!.nombre" :marca-fallback="product!.marca" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.pm-static,
.fc-static {
  position: static;
  transform: none;
  max-width: 720px;
  margin: 0 auto 32px;
  opacity: 1;
}
</style>

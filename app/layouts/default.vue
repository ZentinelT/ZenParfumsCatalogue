<script setup lang="ts">
const ui = useUiStore();

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape" && ui.algunoAbierto) ui.closeTopmost();
}

onMounted(() => window.addEventListener("keydown", onKeydown));
onUnmounted(() => {
  window.removeEventListener("keydown", onKeydown);
  document.body.style.overflow = "";
});

// Scroll-lock del body mientras haya un overlay abierto.
watch(() => ui.algunoAbierto, (abierto) => {
  document.body.style.overflow = abierto ? "hidden" : "";
});
</script>

<template>
  <div>
    <SiteHeader />
    <MobileMenu />

    <main>
      <slot />
    </main>

    <SiteFooter />
    <WhatsAppButton />

    <!-- Carrito y favoritos salen de localStorage: el SSR los renderiza vacíos
         y el cliente los restaura, lo que rompe la hidratación para cualquier
         usuario que vuelva con un carrito guardado (HU-4). Son UI puramente de
         cliente y están fuera de pantalla, así que no cuesta nada en SEO/LCP. -->
    <ClientOnly>
      <CartDrawer />
      <WishlistDrawer />
    </ClientOnly>
    <ProductModal />
    <FichaTecnica />
    <NotificationToast />
  </div>
</template>

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

    <CartDrawer />
    <WishlistDrawer />
    <ProductModal />
    <FichaTecnica />
    <NotificationToast />
  </div>
</template>

// Estado de overlays (modales y drawers). No se persiste.
export const useUiStore = defineStore("ui", () => {
  const productId = ref<number | null>(null);
  const fichaSlug = ref<string | null>(null);
  const cartOpen = ref(false);
  const wishOpen = ref(false);
  const mobOpen = ref(false);

  const algunoAbierto = computed(() =>
    productId.value !== null || fichaSlug.value !== null ||
    cartOpen.value || wishOpen.value || mobOpen.value);

  function openProduct(id: number) { productId.value = id; }
  function closeProduct() { productId.value = null; }
  function openFicha(slug: string) { fichaSlug.value = slug; }
  function closeFicha() { fichaSlug.value = null; }
  function openCart() { cartOpen.value = true; }
  function closeCart() { cartOpen.value = false; }
  function openWish() { wishOpen.value = true; }
  function closeWish() { wishOpen.value = false; }
  function openMob() { mobOpen.value = true; }
  function closeMob() { mobOpen.value = false; }

  /** Cierra el overlay superior según prioridad visual (para tecla Escape). */
  function closeTopmost() {
    if (fichaSlug.value !== null) return closeFicha();
    if (productId.value !== null) return closeProduct();
    if (cartOpen.value) return closeCart();
    if (wishOpen.value) return closeWish();
    if (mobOpen.value) return closeMob();
  }

  return {
    productId, fichaSlug, cartOpen, wishOpen, mobOpen, algunoAbierto,
    openProduct, closeProduct, openFicha, closeFicha,
    openCart, closeCart, openWish, closeWish, openMob, closeMob, closeTopmost,
  };
});

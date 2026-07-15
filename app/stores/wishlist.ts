import type { Product } from "~~/shared/types.ts";

export const useWishlistStore = defineStore("wishlist", () => {
  const ids = ref<number[]>([]);

  const count = computed(() => ids.value.length);

  function has(id: number) {
    return ids.value.includes(id);
  }

  /** Toggle; devuelve true si quedó agregado. */
  function toggle(id: number): boolean {
    const i = ids.value.indexOf(id);
    if (i === -1) { ids.value.push(id); return true; }
    ids.value.splice(i, 1);
    return false;
  }

  function products(catalog: Product[]): Product[] {
    return ids.value
      .map((id) => catalog.find((p) => p.id === id))
      .filter((p): p is Product => Boolean(p));
  }

  return { ids, count, has, toggle, products };
}, {
  persist: {
    key: "zp-wish",
    serializer: {
      serialize: (state) => JSON.stringify((state as { ids: number[] }).ids),
      deserialize: (raw) => {
        // Legacy (clave zp-wish) ya era un array de ids numéricos.
        try {
          const arr = JSON.parse(raw);
          return { ids: Array.isArray(arr) ? arr.filter((n) => typeof n === "number") : [] };
        } catch { return { ids: [] }; }
      },
    },
  },
});

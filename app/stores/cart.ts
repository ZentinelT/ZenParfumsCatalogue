import { cleanName } from "~~/shared/transform/slug.ts";
import type { CartItem, Product } from "~~/shared/types.ts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrarItems(raw: any): CartItem[] {
  if (!Array.isArray(raw)) return [];
  const out: CartItem[] = [];
  for (const it of raw) {
    if (!it || typeof it !== "object") continue;
    if ("marca" in it && "nombreCompleto" in it) {
      // Formato nuevo
      out.push({
        id: Number(it.id),
        marca: String(it.marca ?? ""),
        nombre: String(it.nombre ?? cleanName(it.nombreCompleto)),
        nombreCompleto: String(it.nombreCompleto ?? ""),
        tamano: String(it.tamano ?? ""),
        precio: Number(it.precio) || 0,
        imagenUrl: String(it.imagenUrl ?? ""),
        qty: Math.max(1, Number(it.qty) || 1),
      });
    } else if ("b" in it || "n" in it) {
      // Formato legacy (clave zp2): {id,b,n,s,p,i,qty}
      out.push({
        id: Number(it.id),
        marca: String(it.b ?? ""),
        nombre: cleanName(String(it.n ?? "")),
        nombreCompleto: String(it.n ?? ""),
        tamano: String(it.s ?? ""),
        precio: Number(it.p) || 0,
        imagenUrl: String(it.i ?? ""),
        qty: Math.max(1, Number(it.qty) || 1),
      });
    }
  }
  return out;
}

export const useCartStore = defineStore("cart", () => {
  const items = ref<CartItem[]>([]);

  const count = computed(() => items.value.reduce((s, i) => s + i.qty, 0));
  const total = computed(() => items.value.reduce((s, i) => s + i.precio * i.qty, 0));

  function add(p: Product) {
    if (p.stock === "out") return;
    const existente = items.value.find((i) => i.id === p.id);
    if (existente) {
      existente.qty++;
    } else {
      items.value.push({
        id: p.id,
        marca: p.marca,
        nombre: p.nombre,
        nombreCompleto: p.nombreCompleto,
        tamano: p.tamanoMl ? `${p.tamanoMl}ml` : "",
        precio: p.precio,
        imagenUrl: p.imagenUrl,
        qty: 1,
      });
    }
  }

  function changeQty(id: number, delta: number) {
    const it = items.value.find((i) => i.id === id);
    if (!it) return;
    it.qty += delta;
    if (it.qty <= 0) items.value = items.value.filter((i) => i.id !== id);
  }

  function remove(id: number) {
    items.value = items.value.filter((i) => i.id !== id);
  }

  /** Reasigna ids por marca+nombre contra el catálogo actual (ids cambiaron vs legacy). */
  function remapIds(catalog: Product[]) {
    const byKey = new Map<string, Product>();
    for (const p of catalog) byKey.set(`${p.marca}␟${p.nombreCompleto}`.toLowerCase(), p);
    for (const it of items.value) {
      const match = byKey.get(`${it.marca}␟${it.nombreCompleto}`.toLowerCase());
      if (match) { it.id = match.id; it.precio = match.precio; }
    }
  }

  return {
    items, count, total, add, changeQty, remove, remapIds,
    _migrar: migrarItems,
  };
}, {
  persist: {
    key: "zp2",
    serializer: {
      serialize: (state) => JSON.stringify((state as { items: CartItem[] }).items),
      deserialize: (raw) => {
        try { return { items: migrarItems(JSON.parse(raw)) }; }
        catch { return { items: [] }; }
      },
    },
  },
});

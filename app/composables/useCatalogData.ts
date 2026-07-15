import catalog from "~~/data/catalog.json";
import type { Product } from "~~/shared/types.ts";

// data/catalog.json lo genera scripts/fetch-catalog.ts antes del build.
// Las fichas NO se importan acá: se bajan on-demand (ver useFichas).
//
// `reactive` para que la revalidación de stock/precio en runtime (FR-016) se
// refleje en pantalla al mutar los productos en su lugar. Es un singleton de
// módulo: válido porque el sitio es SSG (sin servidor en producción, no hay
// estado compartido entre requests) y la revalidación solo corre en el cliente.
const productos = reactive(catalog as Product[]) as Product[];

export function useCatalogData() {
  return {
    productos,
    getProduct: (id: number) => productos.find((p) => p.id === id),
    getProductByFicha: (slug: string) => productos.find((p) => p.fichaSlug === slug),
  };
}

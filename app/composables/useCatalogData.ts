import catalog from "~~/data/catalog.json";
import type { Product } from "~~/shared/types.ts";

// data/catalog.json lo genera scripts/fetch-catalog.ts antes del build.
// Las fichas NO se importan acá: se bajan on-demand (ver useFichas).
const productos = catalog as Product[];

export function useCatalogData() {
  return {
    productos,
    getProduct: (id: number) => productos.find((p) => p.id === id),
    getProductByFicha: (slug: string) => productos.find((p) => p.fichaSlug === slug),
  };
}

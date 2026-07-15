import { calcularPrecio, formatearPrecio, type PrecioMargenes } from "./precio.ts";
import { calcularStock } from "./stock.ts";
import type { Product } from "../types.ts";

/** Fila mínima de la vista pública `catalogo_publico` (solo lectura, RLS). */
export interface FilaPublica {
  id: number | string;
  stock_actual?: number | null;
  precio_min_ars?: number | null;
  activo?: boolean | null;
}

export interface ResultadoRevalidacion {
  /** Cantidad de productos cuyo stock o precio cambió respecto al build. */
  actualizados: number;
  /** Ids que pasaron a estar sin stock. */
  agotados: number[];
}

/**
 * Aplica stock/precio frescos sobre los productos del build (FR-016, HU-5).
 * Muta los productos en su lugar (son reactivos) y devuelve un resumen.
 * Los productos ausentes en la respuesta se dejan como estaban.
 */
export function aplicarRevalidacion(
  productos: Product[],
  filas: FilaPublica[],
  margenes: PrecioMargenes,
): ResultadoRevalidacion {
  const porId = new Map<number, FilaPublica>();
  for (const f of filas) porId.set(Number(f.id), f);

  let actualizados = 0;
  const agotados: number[] = [];

  for (const p of productos) {
    const f = porId.get(p.id);
    if (!f) continue;

    const stockAntes = p.stock;
    const precioAntes = p.precio;

    // Un producto desactivado en Supabase se trata como sin stock.
    const stock = f.activo === false ? "out" : calcularStock(f.stock_actual);
    const precio = calcularPrecio(f.precio_min_ars, p.marca, margenes);

    p.stock = stock;
    // Precio 0 = sin dato: conservamos el del build en vez de mostrar $0.
    if (precio > 0) {
      p.precio = precio;
      p.precioFmt = formatearPrecio(precio);
    }

    if (p.stock !== stockAntes || p.precio !== precioAntes) actualizados++;
    if (p.stock === "out" && stockAntes !== "out") agotados.push(p.id);
  }

  return { actualizados, agotados };
}

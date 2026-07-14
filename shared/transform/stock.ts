import type { StockStatus } from "../types.ts";

// Port fiel de `calcular_stock` (actualizar_catalogo.py):
//   ≤0 o nulo → out · ≤2 → low · resto → ok
export function calcularStock(stockActual: number | null | undefined): StockStatus {
  const n = Number(stockActual);
  if (stockActual == null || Number.isNaN(n) || n <= 0) return "out";
  if (n <= 2) return "low";
  return "ok";
}

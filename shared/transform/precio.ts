// Cálculo de precio publicado. Port fiel de `calcular_precio` (actualizar_catalogo.py).
// El margen se aplica una sola vez, en build. Márgenes configurables por env.

export interface PrecioMargenes {
  /** Margen para empresas distintas de TUBBEES (default 15000). */
  normal: number;
  /** Margen para la empresa TUBBEES (default 10000). */
  tubbees: number;
}

export function margenesFromEnv(env: Record<string, string | undefined> = process.env): PrecioMargenes {
  const num = (v: string | undefined, def: number) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : def;
  };
  return {
    normal: num(env.MARGEN_NORMAL, 15000),
    tubbees: num(env.MARGEN_TUBBEES, 10000),
  };
}

/**
 * Precio final = precio_min_ars + margen (según empresa).
 * Devuelve 0 si no hay precio base (paridad con el pipeline Python).
 */
export function calcularPrecio(
  precioMinArs: number | null | undefined,
  empresa: string | null | undefined,
  margenes: PrecioMargenes,
): number {
  if (precioMinArs == null || Number.isNaN(Number(precioMinArs))) return 0;
  const esTubbees = String(empresa ?? "").trim().toUpperCase() === "TUBBEES";
  const margen = esTubbees ? margenes.tubbees : margenes.normal;
  return Math.trunc(Number(precioMinArs) + margen);
}

/** Formato "$65.900" (miles con punto), o "—" si es 0/falsy. Port de `fmt_precio`. */
export function formatearPrecio(p: number): string {
  if (!p) return "—";
  return "$" + Math.trunc(p).toLocaleString("es-AR");
}

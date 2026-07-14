import type { Genero } from "../types.ts";

// Port fiel de `genero_map` (actualizar_catalogo.py): deriva el género del
// símbolo ♀/♂ presente en el campo de Supabase; sin símbolo → unisex.
export function mapearGenero(g: string | null | undefined): Genero {
  const s = String(g ?? "").trim();
  if (s.includes("♀")) return "mujer"; // ♀
  if (s.includes("♂")) return "hombre"; // ♂
  return "unisex";
}

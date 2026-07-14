// Parseo del nombre de producto (formato `CÓDIGO - NOMBRE | CONCENTRACIÓN | 100ML`)
// y generación de slugs. Port de normName/cleanName/getType (index.html).

/** Normaliza para matching de ficha: mayúsculas, espacios colapsados, sin sufijo `| N ML`. */
export function normName(n: string | null | undefined): string {
  let s = String(n ?? "").toUpperCase().replace(/\s+/g, " ").trim();
  while (/\|\s*\d+\s*ML\s*$/i.test(s)) {
    s = s.replace(/\|\s*\d+\s*ML\s*$/i, "").trim();
  }
  return s;
}

/** Nombre limpio para display: sin prefijo de código (antes del primer `-`) ni sufijos `|`. */
export function cleanName(n: string | null | undefined): string {
  let s = String(n ?? "");
  s = s.indexOf("-") > -1 ? s.split("-").slice(1).join("-") : s;
  s = s.indexOf("|") > -1 ? s.split("|")[0]! : s;
  return s.trim();
}

const CONCENTRACIONES: Record<string, string> = {
  edp: "EDP",
  edt: "EDT",
  elixir: "Elixir",
  parfum: "Parfum",
  "extrait de parfum": "Extrait de Parfum",
};

/** Detecta la concentración desde los segmentos `|` (de derecha a izquierda). */
export function getConcentracion(n: string | null | undefined): string | null {
  const parts = String(n ?? "").split("|").map((s) => s.trim()).filter(Boolean);
  for (let i = parts.length - 1; i >= 0; i--) {
    const t = parts[i]!.toLowerCase();
    if (CONCENTRACIONES[t]) return CONCENTRACIONES[t]!;
  }
  return null;
}

/** Extrae el tamaño en ml desde el sufijo `| 100ML` / `100 ml`, si existe. */
export function getTamanoMl(n: string | null | undefined): number | null {
  const m = String(n ?? "").match(/\|\s*(\d+)\s*ML\b/i);
  return m ? Number(m[1]) : null;
}

/** slug URL-safe: minúsculas, sin acentos, separado por guiones. */
export function slugify(...parts: (string | null | undefined)[]): string {
  return parts
    .filter(Boolean)
    .join(" ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

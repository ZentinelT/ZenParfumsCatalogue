import type { Notas, Piramide } from "../types.ts";

// Implementación única del parseo de notas olfativas.
// Unifica la versión Python (`parsear_notas` → string normalizado) y la JS
// (`parseNotes` → pirámide salida/corazón/fondo).

const PLACEHOLDERS = new Set([
  "nan", "none", "null", "n/a", "na", "undefined", "sin datos", "sin notas", "no data",
]);

const LABEL_MAP: Record<string, string> = {
  salida: "Salida",
  "corazón": "Corazón",
  corazon: "Corazón",
  fondo: "Fondo",
  base: "Fondo",
};

/** Quita de ambos extremos cualquiera de los chars indicados (equiv. a str.strip(chars) de Python). */
function stripChars(s: string, chars: string): string {
  let start = 0;
  let end = s.length;
  while (start < end && chars.includes(s[start]!)) start++;
  while (end > start && chars.includes(s[end - 1]!)) end--;
  return s.slice(start, end);
}

/**
 * Normaliza una descripción a un string de notas (o null).
 * Port de `parsear_notas`, devolviendo null en vez de "—".
 */
export function normalizarNotas(desc: unknown): string | null {
  if (desc == null) return null;
  let text = String(desc).trim();
  if (!text) return null;
  if (PLACEHOLDERS.has(text.toLowerCase())) return null;

  text = text.replace(/\s+/g, " ").trim();

  // Intento 1: etiquetas "Salida: ...", "Corazón: ...", "Fondo: ..."
  const re = /(?:^|[.;\n])\s*(?:notas?\s+de\s+)?(salida|coraz[oó]n|fondo|base)\b\s*[:\-–/]*\s*([^.;\n]+)/gi;
  const partes: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const label = m[1]!.trim().toLowerCase();
    const value = stripChars(m[2]!.replace(/\s+/g, " "), " .:-");
    if (value) {
      const pretty = LABEL_MAP[label] ?? (label.charAt(0).toUpperCase() + label.slice(1));
      partes.push(pretty + " " + value);
    }
  }
  if (partes.length) return partes.join(" · ");

  // Intento 2: texto libre limpio si es razonablemente corto.
  const cleaned = stripChars(text.replace(/\s+/g, " "), " .;:-");
  if (cleaned && cleaned.length < 400) return cleaned;

  return null;
}

/**
 * Estructura un string de notas en pirámide salida/corazón/fondo.
 * Port de `parseNotes` (index.html). Devuelve null si no hay estructura.
 */
export function parsePiramide(nt: string | null | undefined): Piramide | null {
  if (!nt || nt === "—") return null;
  const re = /(salida|coraz[oó]n|fondo)/gi;
  const idx: { kw: string; i: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(nt)) !== null) idx.push({ kw: m[1]!.toLowerCase(), i: m.index });
  if (!idx.length) return null;

  const out: Piramide = { salida: "", corazon: "", fondo: "" };
  for (let i = 0; i < idx.length; i++) {
    const end = i + 1 < idx.length ? idx[i + 1]!.i : nt.length;
    let chunk = nt.slice(idx[i]!.i, end);
    chunk = chunk
      .replace(/^(salida|coraz[oó]n|fondo)/i, "")
      .replace(/^\s*de\s*/i, "")
      .replace(/^[:\s·-]+/, "")
      .replace(/\s*notas?\s+de\s*$/i, "")
      .replace(/[·\s]+$/, "")
      .trim();
    const kw = idx[i]!.kw;
    const key: keyof Piramide = kw.indexOf("coraz") > -1 ? "corazon" : kw === "fondo" ? "fondo" : "salida";
    if (chunk.length > out[key].length) out[key] = chunk;
  }
  return out;
}

/** Parseo completo: desde descripción cruda a { texto, piramide }. */
export function parseNotas(desc: unknown): Notas {
  const texto = normalizarNotas(desc);
  return { texto, piramide: parsePiramide(texto) };
}

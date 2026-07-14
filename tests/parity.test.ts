import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { formatearPrecio } from "../shared/transform/precio.ts";
import { parsePiramide } from "../shared/transform/notas.ts";

// Paridad: los transforms portados deben reproducir la salida del pipeline
// Python legacy sobre los datos reales embebidos hoy en index.html (#pdata).
const HERE = dirname(fileURLToPath(import.meta.url));
type Legacy = { id: number; p: number; p1: string; nt: string; st: string; g: string };
const pdata = JSON.parse(
  readFileSync(resolve(HERE, "fixtures/legacy-pdata.json"), "utf8"),
) as Legacy[];

describe("paridad con pipeline legacy (#pdata)", () => {
  it("carga el fixture", () => {
    expect(pdata.length).toBeGreaterThan(500);
  });

  it("formatearPrecio reproduce p1 para todos los productos con precio > 0", () => {
    const mismatches = pdata
      .filter((p) => p.p > 0 && formatearPrecio(p.p) !== p.p1)
      .map((p) => ({ id: p.id, p: p.p, got: formatearPrecio(p.p), want: p1(p) }));
    expect(mismatches).toEqual([]);
  });

  it("los estados de stock legacy son válidos", () => {
    const validos = new Set(["ok", "low", "out"]);
    expect(pdata.every((p) => validos.has(p.st))).toBe(true);
  });

  it("parsePiramide no rompe sobre ninguna nota real", () => {
    for (const p of pdata) {
      const r = parsePiramide(p.nt);
      if (r) {
        expect(typeof r.salida).toBe("string");
        expect(typeof r.corazon).toBe("string");
        expect(typeof r.fondo).toBe("string");
      }
    }
  });
});

function p1(p: Legacy) {
  return p.p1;
}

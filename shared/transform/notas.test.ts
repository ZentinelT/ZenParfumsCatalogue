import { describe, it, expect } from "vitest";
import { normalizarNotas, parsePiramide, parseNotas } from "./notas.ts";

describe("normalizarNotas", () => {
  it("null para placeholders y vacío", () => {
    for (const ph of ["nan", "sin datos", "N/A", "  ", "no data"]) {
      expect(normalizarNotas(ph)).toBeNull();
    }
    expect(normalizarNotas(null)).toBeNull();
  });
  it("estructura etiquetas salida/corazón/fondo", () => {
    expect(normalizarNotas("Salida: bergamota. Corazón: rosa. Fondo: vainilla"))
      .toBe("Salida bergamota · Corazón rosa · Fondo vainilla");
  });
  it("mapea base → Fondo", () => {
    expect(normalizarNotas("Salida: limón. Base: almizcle"))
      .toBe("Salida limón · Fondo almizcle");
  });
  it("texto libre corto se devuelve tal cual", () => {
    expect(normalizarNotas("aroma amaderado y cítrico")).toBe("aroma amaderado y cítrico");
  });
  it("texto libre >= 400 chars → null", () => {
    expect(normalizarNotas("a".repeat(400))).toBeNull();
  });
});

describe("parsePiramide", () => {
  it("null si no hay estructura", () => {
    expect(parsePiramide("un texto libre")).toBeNull();
    expect(parsePiramide("—")).toBeNull();
    expect(parsePiramide(null)).toBeNull();
  });
  it("separa los tres niveles", () => {
    expect(parsePiramide("Salida bergamota · Corazón rosa · Fondo vainilla"))
      .toEqual({ salida: "bergamota", corazon: "rosa", fondo: "vainilla" });
  });
});

describe("parseNotas", () => {
  it("compone texto + pirámide", () => {
    const r = parseNotas("Salida: bergamota. Corazón: rosa. Fondo: vainilla");
    expect(r.texto).toBe("Salida bergamota · Corazón rosa · Fondo vainilla");
    expect(r.piramide).toEqual({ salida: "bergamota", corazon: "rosa", fondo: "vainilla" });
  });
  it("texto sin estructura → piramide null", () => {
    const r = parseNotas("aroma amaderado");
    expect(r.texto).toBe("aroma amaderado");
    expect(r.piramide).toBeNull();
  });
});

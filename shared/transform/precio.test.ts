import { describe, it, expect } from "vitest";
import { calcularPrecio, formatearPrecio, margenesFromEnv } from "./precio.ts";

const M = { normal: 15000, tubbees: 10000 };

describe("calcularPrecio", () => {
  it("suma el margen normal", () => {
    expect(calcularPrecio(50900, "SWISS ARABIAN", M)).toBe(65900);
  });
  it("usa el margen TUBBEES (case-insensitive, con espacios)", () => {
    expect(calcularPrecio(50000, "  tubbees ", M)).toBe(60000);
  });
  it("devuelve 0 si no hay precio base", () => {
    expect(calcularPrecio(null, "X", M)).toBe(0);
    expect(calcularPrecio(undefined, "X", M)).toBe(0);
    expect(calcularPrecio(NaN as unknown as number, "X", M)).toBe(0);
  });
});

describe("formatearPrecio", () => {
  it("formatea con puntos de miles", () => {
    expect(formatearPrecio(65900)).toBe("$65.900");
    expect(formatearPrecio(1234567)).toBe("$1.234.567");
  });
  it("devuelve — para 0", () => {
    expect(formatearPrecio(0)).toBe("—");
  });
});

describe("margenesFromEnv", () => {
  it("usa defaults cuando no hay env", () => {
    expect(margenesFromEnv({})).toEqual({ normal: 15000, tubbees: 10000 });
  });
  it("lee valores de env", () => {
    expect(margenesFromEnv({ MARGEN_NORMAL: "20000", MARGEN_TUBBEES: "5000" }))
      .toEqual({ normal: 20000, tubbees: 5000 });
  });
});

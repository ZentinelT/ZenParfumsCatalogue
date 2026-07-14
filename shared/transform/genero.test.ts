import { describe, it, expect } from "vitest";
import { mapearGenero } from "./genero.ts";

describe("mapearGenero", () => {
  it("detecta mujer por ♀", () => {
    expect(mapearGenero("♀")).toBe("mujer");
    expect(mapearGenero("Perfume ♀")).toBe("mujer");
  });
  it("detecta hombre por ♂", () => {
    expect(mapearGenero("♂ Hombre")).toBe("hombre");
  });
  it("unisex si no hay símbolo", () => {
    expect(mapearGenero("")).toBe("unisex");
    expect(mapearGenero(null)).toBe("unisex");
    expect(mapearGenero("Unisex")).toBe("unisex");
  });
});

import { describe, it, expect } from "vitest";
import { normName, cleanName, getConcentracion, getTamanoMl, slugify } from "./slug.ts";

describe("normName", () => {
  it("mayúsculas, colapsa espacios y quita sufijo ml", () => {
    expect(normName("SWISS ARABIAN - Shirley May | EDT | 100 ML"))
      .toBe("SWISS ARABIAN - SHIRLEY MAY | EDT");
  });
  it("quita múltiples sufijos ml", () => {
    expect(normName("X | 50 ML | 100ML")).toBe("X");
  });
});

describe("cleanName", () => {
  it("quita prefijo de código y sufijo de concentración", () => {
    expect(cleanName("SWISS ARABIAN - Shirley May Vida Vida 1088 | EDT"))
      .toBe("Shirley May Vida Vida 1088");
  });
  it("respeta nombres con guiones internos", () => {
    expect(cleanName("MARCA - Sub-Zero Cool | EDP")).toBe("Sub-Zero Cool");
  });
});

describe("getConcentracion", () => {
  it("detecta la concentración desde la derecha", () => {
    expect(getConcentracion("X - Y | EDP | 100ML")).toBe("EDP");
    expect(getConcentracion("X - Y | Elixir")).toBe("Elixir");
  });
  it("null si no hay", () => {
    expect(getConcentracion("X - Y | 100ML")).toBeNull();
  });
});

describe("getTamanoMl", () => {
  it("extrae el tamaño en ml", () => {
    expect(getTamanoMl("X - Y | EDP | 100ML")).toBe(100);
    expect(getTamanoMl("X - Y | 50 ml")).toBe(50);
  });
  it("null si no hay tamaño", () => {
    expect(getTamanoMl("X - Y | EDP")).toBeNull();
  });
});

describe("slugify", () => {
  it("normaliza acentos y espacios", () => {
    expect(slugify("Calvin Klein", "CK Bé")).toBe("calvin-klein-ck-be");
    expect(slugify("Perfume Ñandú 100%")).toBe("perfume-nandu-100");
  });
});

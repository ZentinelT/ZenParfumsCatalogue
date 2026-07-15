import { describe, it, expect } from "vitest";
import { aplicarRevalidacion } from "./revalidacion.ts";
import type { Product } from "../types.ts";

const M = { normal: 15000, tubbees: 10000 };

function producto(over: Partial<Product> = {}): Product {
  return {
    id: 1,
    slug: "marca-x",
    marca: "MARCA",
    nombre: "X",
    nombreCompleto: "MARCA - X | EDP",
    concentracion: "EDP",
    tamanoMl: 100,
    precio: 65900,
    precioFmt: "$65.900",
    categoria: "arabes",
    genero: "unisex",
    stock: "ok",
    imagenUrl: "",
    notas: { texto: null, piramide: null },
    ...over,
  };
}

describe("aplicarRevalidacion", () => {
  it("actualiza stock y precio con los datos frescos", () => {
    const ps = [producto()];
    const r = aplicarRevalidacion(ps, [{ id: 1, stock_actual: 1, precio_min_ars: 60000 }], M);
    expect(ps[0]!.stock).toBe("low");
    expect(ps[0]!.precio).toBe(75000);
    expect(ps[0]!.precioFmt).toBe("$75.000");
    expect(r.actualizados).toBe(1);
  });

  it("marca como agotado el producto que se quedó sin stock", () => {
    const ps = [producto({ stock: "ok" })];
    const r = aplicarRevalidacion(ps, [{ id: 1, stock_actual: 0, precio_min_ars: 50900 }], M);
    expect(ps[0]!.stock).toBe("out");
    expect(r.agotados).toEqual([1]);
  });

  it("trata un producto desactivado como sin stock", () => {
    const ps = [producto()];
    aplicarRevalidacion(ps, [{ id: 1, stock_actual: 10, precio_min_ars: 50900, activo: false }], M);
    expect(ps[0]!.stock).toBe("out");
  });

  it("aplica el margen TUBBEES según la marca", () => {
    const ps = [producto({ marca: "TUBBEES", precio: 0 })];
    aplicarRevalidacion(ps, [{ id: 1, stock_actual: 5, precio_min_ars: 50000 }], M);
    expect(ps[0]!.precio).toBe(60000);
  });

  it("conserva el precio del build si el fresco viene sin dato", () => {
    const ps = [producto({ precio: 65900, precioFmt: "$65.900" })];
    aplicarRevalidacion(ps, [{ id: 1, stock_actual: 5, precio_min_ars: null }], M);
    expect(ps[0]!.precio).toBe(65900);
    expect(ps[0]!.precioFmt).toBe("$65.900");
  });

  it("deja intactos los productos ausentes en la respuesta", () => {
    const ps = [producto({ id: 1 }), producto({ id: 2, stock: "ok" })];
    const r = aplicarRevalidacion(ps, [{ id: 1, stock_actual: 0 }], M);
    expect(ps[1]!.stock).toBe("ok");
    expect(r.actualizados).toBe(1);
  });

  it("no rompe con una respuesta vacía (Supabase sin datos)", () => {
    const ps = [producto()];
    const r = aplicarRevalidacion(ps, [], M);
    expect(ps[0]!.stock).toBe("ok");
    expect(r).toEqual({ actualizados: 0, agotados: [] });
  });
});

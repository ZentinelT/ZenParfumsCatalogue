import { describe, it, expect } from "vitest";
import { calcularStock } from "./stock.ts";

describe("calcularStock", () => {
  it("out para <= 0, null o NaN", () => {
    expect(calcularStock(0)).toBe("out");
    expect(calcularStock(-3)).toBe("out");
    expect(calcularStock(null)).toBe("out");
    expect(calcularStock(undefined)).toBe("out");
  });
  it("low para 1 y 2", () => {
    expect(calcularStock(1)).toBe("low");
    expect(calcularStock(2)).toBe("low");
  });
  it("ok para > 2", () => {
    expect(calcularStock(3)).toBe("ok");
    expect(calcularStock(100)).toBe("ok");
  });
});

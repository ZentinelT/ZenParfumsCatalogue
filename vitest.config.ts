import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "happy-dom",
    include: ["shared/**/*.test.ts", "tests/**/*.test.ts", "app/**/*.test.ts"],
    exclude: ["tests/e2e/**", "node_modules/**"],
  },
});

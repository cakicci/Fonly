import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

/**
 * Vitest — saf fonksiyon (lib/data) birim testleri için.
 * `vite-tsconfig-paths` tsconfig'teki `@/*` alias'ını çözer, böylece testler
 * uygulama koduyla aynı import'ları kullanır.
 *
 * Uzantı `.mts` — `vite-tsconfig-paths` ESM-only; package.json'da
 * `type: module` olmadığı için config dosyasını açıkça ESM işaretliyoruz.
 *
 * Ortam `node` — DOM gerekmez (indikatörler, parser'lar, formatlayıcılar saf).
 * React component testi eklenirse `environment: "jsdom"` + jsdom kurulmalı.
 */
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", ".next"],
    coverage: {
      provider: "v8",
      include: ["lib/**/*.ts", "data/**/*.ts"],
      exclude: ["lib/**/*.d.ts"],
    },
  },
});

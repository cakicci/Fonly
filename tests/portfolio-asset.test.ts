import { describe, it, expect } from "vitest";
import { normalizeAssetSlug, assetHref } from "@/lib/portfolio/asset";

describe("normalizeAssetSlug", () => {
  it("geçerli slug'ları kanonik biçime getirir", () => {
    expect(normalizeAssetSlug("doviz-usd")).toBe("doviz-USD");
    expect(normalizeAssetSlug("altin-GRAM")).toBe("altin-gram");
    expect(normalizeAssetSlug("hisse-thyao")).toBe("hisse-THYAO");
    expect(normalizeAssetSlug("fon-aak")).toBe("fon-AAK");
  });

  it("boşlukları temizler", () => {
    expect(normalizeAssetSlug("  doviz-usd  ")).toBe("doviz-USD");
  });

  it("bilinmeyen / geçersiz → null", () => {
    expect(normalizeAssetSlug("kripto-btc")).toBeNull();
    expect(normalizeAssetSlug("doviz-XXX")).toBeNull(); // tanımsız döviz
    expect(normalizeAssetSlug("altin-platin")).toBeNull(); // tanımsız altın
    expect(normalizeAssetSlug("nodash")).toBeNull();
    expect(normalizeAssetSlug("")).toBeNull();
    expect(normalizeAssetSlug(null)).toBeNull();
  });

  it("fon kodu biçimsel doğrulanır (2–6 alfanümerik)", () => {
    expect(normalizeAssetSlug("fon-A")).toBeNull(); // çok kısa
    expect(normalizeAssetSlug("fon-TOOLONG7")).toBeNull(); // çok uzun
  });
});

describe("assetHref", () => {
  it("slug → detay sayfası linki", () => {
    expect(assetHref("doviz-USD")).toBe("/doviz/USD");
    expect(assetHref("altin-gram")).toBe("/altin/gram");
    expect(assetHref("hisse-THYAO")).toBe("/hisse/THYAO");
    expect(assetHref("fon-AAK")).toBe("/fon/AAK");
  });
});

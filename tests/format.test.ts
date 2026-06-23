import { describe, it, expect } from "vitest";
import {
  decimalsFor,
  priceFormatFor,
  fmtAsset,
  fmtPercent,
  kindFromGoldCategory,
  kindFromSlug,
} from "@/lib/format";

describe("decimalsFor / priceFormatFor", () => {
  it("varlık tipine göre ondalık sayısı", () => {
    expect(decimalsFor("currency")).toBe(4);
    expect(decimalsFor("fund")).toBe(4);
    expect(decimalsFor("stock")).toBe(2);
    expect(decimalsFor("gold-standard")).toBe(2);
  });

  it("priceFormat minMove = 10^-precision", () => {
    expect(priceFormatFor("currency")).toEqual({ precision: 4, minMove: 0.0001 });
    expect(priceFormatFor("stock")).toEqual({ precision: 2, minMove: 0.01 });
  });
});

describe("fmtAsset", () => {
  it("null/undefined/NaN/Infinity → tire", () => {
    expect(fmtAsset(null, "stock")).toBe("—");
    expect(fmtAsset(undefined, "stock")).toBe("—");
    expect(fmtAsset(NaN, "stock")).toBe("—");
    expect(fmtAsset(Infinity, "stock")).toBe("—");
  });

  it("tr-TR formatında virgül ondalık ayraç kullanır", () => {
    expect(fmtAsset(1.2346, "currency")).toBe("1,2346");
    expect(fmtAsset(42.5, "stock")).toBe("42,50");
  });
});

describe("fmtPercent", () => {
  it("|x| < 1 → 4 ondalık, aksi 2 ondalık", () => {
    expect(fmtPercent(0.5)).toBe("0,5000");
    expect(fmtPercent(12.34)).toBe("12,34");
  });

  it("geçersiz → tire", () => {
    expect(fmtPercent(null)).toBe("—");
    expect(fmtPercent(NaN)).toBe("—");
  });
});

describe("kindFromGoldCategory", () => {
  it("kategori → AssetKind", () => {
    expect(kindFromGoldCategory("standart")).toBe("gold-standard");
    expect(kindFromGoldCategory("antika")).toBe("gold-coin");
    expect(kindFromGoldCategory("ayar")).toBe("gold-purity");
    expect(kindFromGoldCategory("gumus")).toBe("gold-silver");
  });
});

describe("kindFromSlug", () => {
  it.each([
    ["doviz-USD", "currency"],
    ["fon-AAK", "fund"],
    ["hisse-THYAO", "stock"],
    ["hisse-XU100", "stock-index"],
    ["altin-gram", "gold-standard"],
    ["altin-cumhuriyet", "gold-coin"],
    ["altin-14ayar", "gold-purity"],
    ["altin-gumus", "gold-silver"],
  ])("%s → %s", (slug, kind) => {
    expect(kindFromSlug(slug)).toBe(kind);
  });

  it("bilinmeyen tip / tire yok → null", () => {
    expect(kindFromSlug("kripto-BTC")).toBeNull();
    expect(kindFromSlug("nodash")).toBeNull();
  });

  it("bilinmeyen altın türü → null", () => {
    expect(kindFromSlug("altin-platin")).toBeNull();
  });
});

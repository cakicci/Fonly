import { describe, it, expect } from "vitest";
import {
  parseAssetSlug,
  supportsCandles,
  ALL_TIMEFRAMES,
  YAHOO_PARAMS,
  TEFAS_PERIYOD,
  TIMEFRAME_LABELS,
} from "@/lib/chart/timeframe";

describe("parseAssetSlug", () => {
  it.each([
    ["hisse-THYAO", "hisse", "THYAO"],
    ["doviz-USD", "doviz", "USD"],
    ["altin-gram", "altin", "gram"],
    ["fon-AAK", "fon", "AAK"],
  ])("%s → tip + kod ayrıştırır", (slug, type, code) => {
    expect(parseAssetSlug(slug)).toEqual({ type, code });
  });

  it("ilk tireden böler — kod içinde tire kalabilir", () => {
    expect(parseAssetSlug("hisse-BRK-B")).toEqual({ type: "hisse", code: "BRK-B" });
  });

  it("tire yoksa tip null", () => {
    expect(parseAssetSlug("nodash")).toEqual({ type: null, code: "" });
  });

  it("bilinmeyen tip → null ama kod korunur", () => {
    expect(parseAssetSlug("kripto-BTC")).toEqual({ type: null, code: "BTC" });
  });
});

describe("supportsCandles", () => {
  it("fon dışındaki tipler candle destekler", () => {
    expect(supportsCandles("hisse")).toBe(true);
    expect(supportsCandles("doviz")).toBe(true);
    expect(supportsCandles("altin")).toBe(true);
  });

  it("fon candle desteklemez (TEFAS sadece NAV)", () => {
    expect(supportsCandles("fon")).toBe(false);
  });
});

describe("timeframe tabloları eksiksiz", () => {
  it("her timeframe için Yahoo parametresi var", () => {
    for (const tf of ALL_TIMEFRAMES) {
      expect(YAHOO_PARAMS[tf], `YAHOO_PARAMS eksik: ${tf}`).toBeDefined();
      expect(YAHOO_PARAMS[tf].range).toBeTruthy();
      expect(YAHOO_PARAMS[tf].interval).toBeTruthy();
    }
  });

  it("her timeframe için TEFAS periyodu ve label var", () => {
    for (const tf of ALL_TIMEFRAMES) {
      expect(TEFAS_PERIYOD[tf], `TEFAS_PERIYOD eksik: ${tf}`).toBeTypeOf("number");
      expect(TIMEFRAME_LABELS[tf], `LABEL eksik: ${tf}`).toBeTruthy();
    }
  });
});

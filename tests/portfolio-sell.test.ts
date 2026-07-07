import { describe, expect, it } from "vitest";
import {
  aggregatePositions,
  portfolioSummary,
  portfolioValueSeries,
  type LotInput,
} from "@/lib/portfolio/aggregate";

const P = (entries: Array<[string, number | null]>) => new Map(entries);

describe("aggregatePositions — satış (ortalama maliyet yöntemi)", () => {
  it("satış, o anki ortalama maliyetten düşer ve gerçekleşen K/Z üretir", () => {
    // 10 adet 100'den + 10 adet 200'den al → ort. 150. 5 adet 300'den sat.
    const lots: LotInput[] = [
      { slug: "hisse-THYAO", quantity: 10, unitCost: 100, at: "2026-01-01" },
      { slug: "hisse-THYAO", quantity: 10, unitCost: 200, at: "2026-02-01" },
      { slug: "hisse-THYAO", quantity: 5, unitCost: 300, side: "sell", at: "2026-03-01" },
    ];
    const [pos] = aggregatePositions(lots, P([["hisse-THYAO", 250]]));

    expect(pos.quantity).toBe(15);
    expect(pos.avgCost).toBeCloseTo(150);
    expect(pos.costTotal).toBeCloseTo(2250); // 150 × 15
    expect(pos.realizedPnl).toBeCloseTo((300 - 150) * 5); // +750
    expect(pos.value).toBeCloseTo(15 * 250);
    expect(pos.pnl).toBeCloseTo(15 * 250 - 2250);
  });

  it("satış sırası önemlidir: satıştan SONRAKİ alım ortalamayı değiştirir", () => {
    // 10 × 100 al → 5'ini 120'den sat (gerçekleşen +100) → 10 × 200 al.
    const lots: LotInput[] = [
      { slug: "doviz-USD", quantity: 10, unitCost: 100, at: "2026-01-01" },
      { slug: "doviz-USD", quantity: 5, unitCost: 120, side: "sell", at: "2026-01-15" },
      { slug: "doviz-USD", quantity: 10, unitCost: 200, at: "2026-02-01" },
    ];
    const [pos] = aggregatePositions(lots, P([["doviz-USD", 150]]));

    expect(pos.realizedPnl).toBeCloseTo(100); // (120-100)×5
    expect(pos.quantity).toBe(15);
    // Kalan maliyet: 5×100 + 10×200 = 2500 → ort. 166.67
    expect(pos.costTotal).toBeCloseTo(2500);
    expect(pos.avgCost).toBeCloseTo(2500 / 15);
  });

  it("tamamen kapanan pozisyon listede kalır; açık özet dışında tutulur", () => {
    const lots: LotInput[] = [
      { slug: "altin-gram", quantity: 10, unitCost: 4000, at: "2026-01-01" },
      { slug: "altin-gram", quantity: 10, unitCost: 4600, side: "sell", at: "2026-06-01" },
      { slug: "hisse-ASELS", quantity: 2, unitCost: 50, at: "2026-01-01" },
    ];
    const positions = aggregatePositions(
      lots,
      P([["altin-gram", 4700], ["hisse-ASELS", 60]])
    );

    const closed = positions.find((p) => p.slug === "altin-gram")!;
    expect(closed.quantity).toBe(0);
    expect(closed.costTotal).toBe(0);
    expect(closed.realizedPnl).toBeCloseTo(6000); // (4600-4000)×10

    const summary = portfolioSummary(positions);
    expect(summary.realizedPnl).toBeCloseTo(6000);
    // Açık özet yalnızca ASELS: maliyet 100, değer 120.
    expect(summary.costTotal).toBeCloseTo(100);
    expect(summary.value).toBeCloseTo(120);
    expect(summary.pnl).toBeCloseTo(20);
    expect(summary.missingPrices).toBe(0);
  });

  it("eldekinden fazla satış eldekine kırpılır (veri hatası savunması)", () => {
    const lots: LotInput[] = [
      { slug: "hisse-THYAO", quantity: 5, unitCost: 100, at: "2026-01-01" },
      { slug: "hisse-THYAO", quantity: 99, unitCost: 150, side: "sell", at: "2026-02-01" },
    ];
    const [pos] = aggregatePositions(lots, P([["hisse-THYAO", 200]]));
    expect(pos.quantity).toBe(0);
    expect(pos.realizedPnl).toBeCloseTo((150 - 100) * 5);
  });

  it("side verilmeyen lot alım sayılır (geriye uyum)", () => {
    const [pos] = aggregatePositions(
      [{ slug: "fon-AAK", quantity: 100, unitCost: 2 }],
      P([["fon-AAK", 3]])
    );
    expect(pos.quantity).toBe(100);
    expect(pos.realizedPnl).toBe(0);
  });
});

describe("portfolioValueSeries", () => {
  const series = (entries: Array<[string, number]>) => new Map(entries);

  it("adet × günlük fiyattan değer serisi üretir; alım günü pozisyona girer", () => {
    const lots: LotInput[] = [
      { slug: "hisse-THYAO", quantity: 10, unitCost: 100, at: "2026-01-02" },
    ];
    const bySlug = new Map([
      ["hisse-THYAO", series([["2026-01-01", 100], ["2026-01-02", 110], ["2026-01-03", 120]])],
    ]);

    const { points, missingSlugs } = portfolioValueSeries(lots, bySlug);
    expect(missingSlugs).toEqual([]);
    // 01-01: henüz pozisyon yok → kırpıldı.
    expect(points.map((p) => p.date)).toEqual(["2026-01-02", "2026-01-03"]);
    expect(points[0]).toMatchObject({ value: 1100, cost: 1000 });
    expect(points[1]).toMatchObject({ value: 1200, cost: 1000 });
  });

  it("satış sonrası değer düşer; fiyat boşlukları backward-fill edilir", () => {
    const lots: LotInput[] = [
      { slug: "doviz-USD", quantity: 100, unitCost: 40, at: "2026-01-01" },
      { slug: "doviz-USD", quantity: 50, unitCost: 45, side: "sell", at: "2026-01-03" },
    ];
    const bySlug = new Map([
      // 01-02 fiyatı yok → 01-01 değeri taşınır; eksen diğer slug'dan genişleyebilir.
      ["doviz-USD", series([["2026-01-01", 42], ["2026-01-03", 46], ["2026-01-04", 47]])],
    ]);

    const { points } = portfolioValueSeries(lots, bySlug);
    expect(points[0]).toMatchObject({ date: "2026-01-01", value: 4200, cost: 4000 });
    // Satış günü: 50 kaldı × 46.
    expect(points[1]).toMatchObject({ date: "2026-01-03", value: 50 * 46, cost: 2000 });
    expect(points[2]).toMatchObject({ date: "2026-01-04", value: 50 * 47, cost: 2000 });
  });

  it("iki varlığı ortak tarih ekseninde toplar", () => {
    const lots: LotInput[] = [
      { slug: "hisse-THYAO", quantity: 1, unitCost: 100, at: "2026-01-01" },
      { slug: "altin-gram", quantity: 2, unitCost: 4000, at: "2026-01-01" },
    ];
    const bySlug = new Map([
      ["hisse-THYAO", series([["2026-01-01", 100], ["2026-01-02", 110]])],
      ["altin-gram", series([["2026-01-01", 4000], ["2026-01-02", 4100]])],
    ]);

    const { points } = portfolioValueSeries(lots, bySlug);
    expect(points[1].value).toBeCloseTo(110 + 2 * 4100);
    expect(points[1].cost).toBeCloseTo(100 + 8000);
  });

  it("serisi olmayan slug missingSlugs'a düşer ve değere karışmaz", () => {
    const lots: LotInput[] = [
      { slug: "hisse-THYAO", quantity: 1, unitCost: 100, at: "2026-01-01" },
      { slug: "altin-cumhuriyet", quantity: 1, unitCost: 30000, at: "2026-01-01" },
    ];
    const bySlug = new Map<string, Map<string, number> | null>([
      ["hisse-THYAO", series([["2026-01-01", 100]])],
      ["altin-cumhuriyet", null],
    ]);

    const { points, missingSlugs } = portfolioValueSeries(lots, bySlug);
    expect(missingSlugs).toEqual(["altin-cumhuriyet"]);
    expect(points[0].value).toBeCloseTo(100);
    expect(points[0].cost).toBeCloseTo(100); // 30000 maliyet karışmadı
  });
});

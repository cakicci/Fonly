import { describe, it, expect } from "vitest";
import {
  aggregatePositions,
  portfolioSummary,
  portfolioDailyChange,
  type LotInput,
} from "@/lib/portfolio/aggregate";

const lots: LotInput[] = [
  { slug: "hisse-A", quantity: 10, unitCost: 100 },
  { slug: "hisse-A", quantity: 10, unitCost: 120 },
  { slug: "doviz-USD", quantity: 100, unitCost: 30 },
];

describe("aggregatePositions", () => {
  it("aynı slug'ı gruplar, ağırlıklı ortalama maliyet hesaplar", () => {
    const prices = new Map([
      ["hisse-A", 150],
      ["doviz-USD", null],
    ]);
    const positions = aggregatePositions(lots, prices);
    const a = positions.find((p) => p.slug === "hisse-A")!;

    expect(a.quantity).toBe(20);
    expect(a.costTotal).toBe(2200);
    expect(a.avgCost).toBe(110);
    expect(a.value).toBe(3000);
    expect(a.pnl).toBe(800);
    expect(a.pnlPct).toBeCloseTo(36.3636, 3);
  });

  it("fiyatı bilinmeyen pozisyon → value/pnl null", () => {
    const prices = new Map<string, number | null>([["doviz-USD", null]]);
    const positions = aggregatePositions(lots, prices);
    const usd = positions.find((p) => p.slug === "doviz-USD")!;
    expect(usd.value).toBeNull();
    expect(usd.pnl).toBeNull();
    expect(usd.pnlPct).toBeNull();
    expect(usd.costTotal).toBe(3000);
  });

  it("maliyet toplamına göre azalan sıralar", () => {
    const positions = aggregatePositions(lots, new Map());
    expect(positions[0].slug).toBe("doviz-USD"); // 3000 > 2200
    expect(positions[1].slug).toBe("hisse-A");
  });

  it("boş lot listesi → boş", () => {
    expect(aggregatePositions([], new Map())).toEqual([]);
  });

  it("geçersiz sayısal lot'ları atlar", () => {
    const bad: LotInput[] = [{ slug: "hisse-X", quantity: NaN, unitCost: 5 }];
    expect(aggregatePositions(bad, new Map())).toEqual([]);
  });
});

describe("portfolioSummary", () => {
  it("toplam maliyet/değer/KZ + eksik fiyat sayısı", () => {
    const prices = new Map([
      ["hisse-A", 150],
      ["doviz-USD", null],
    ]);
    const summary = portfolioSummary(aggregatePositions(lots, prices));

    expect(summary.costTotal).toBe(5200); // 2200 + 3000
    expect(summary.value).toBe(3000); // sadece A fiyatlı
    expect(summary.pnl).toBe(800); // 3000 - 2200 (fiyatlı maliyet)
    expect(summary.pnlPct).toBeCloseTo(36.3636, 3);
    expect(summary.missingPrices).toBe(1);
  });

  it("hiç fiyat yoksa pnlPct null", () => {
    const summary = portfolioSummary(aggregatePositions(lots, new Map()));
    expect(summary.value).toBe(0);
    expect(summary.pnlPct).toBeNull();
    expect(summary.missingPrices).toBe(2);
  });
});

describe("portfolioDailyChange", () => {
  it("günlük değişimi bilinen pozisyonlardan TL + yüzde hesaplar", () => {
    const positions = aggregatePositions(lots, new Map([["hisse-A", 150]]));
    // hisse-A: değer 3000, +%5 → dün 3000/1.05 = 2857.14, değişim 142.857
    const change = portfolioDailyChange(positions, new Map([["hisse-A", 5]]));

    expect(change.changeValue).toBeCloseTo(142.857, 2);
    expect(change.changePct).toBeCloseTo(5, 6);
    expect(change.missing).toBe(1); // doviz-USD fiyatsız
  });

  it("negatif değişimde değer düşer", () => {
    const positions = aggregatePositions(lots, new Map([["hisse-A", 150]]));
    const change = portfolioDailyChange(positions, new Map([["hisse-A", -10]]));
    // dün 3000/0.9 = 3333.33, değişim -333.33
    expect(change.changeValue).toBeCloseTo(-333.333, 2);
    expect(change.changePct).toBeCloseTo(-10, 6);
  });

  it("birden çok pozisyonu birleştirir, değişimi olmayanı sayar", () => {
    const positions = aggregatePositions(
      lots,
      new Map([
        ["hisse-A", 150],
        ["doviz-USD", 40],
      ])
    );
    // hisse-A +%5 (değer 3000), doviz-USD değişimi map'te yok → missing
    const change = portfolioDailyChange(positions, new Map([["hisse-A", 5]]));
    expect(change.missing).toBe(1);
    expect(change.changeValue).toBeCloseTo(142.857, 2);
  });

  it("hiç değişim bilgisi yoksa changePct null", () => {
    const positions = aggregatePositions(lots, new Map([["hisse-A", 150]]));
    const change = portfolioDailyChange(positions, new Map());
    expect(change.changeValue).toBe(0);
    expect(change.changePct).toBeNull();
  });
});

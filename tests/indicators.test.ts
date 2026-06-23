import { describe, it, expect } from "vitest";
import {
  sma,
  ema,
  rsi,
  bollinger,
  atr,
  stochastic,
  williamsR,
  cci,
} from "@/lib/chart/indicators";
import type { Candle } from "@/types/chart";

/** Sadece close'ları verilen düz bir Candle dizisi (OHLC = close). */
function closes(values: number[]): Candle[] {
  return values.map((v, i) => ({
    time: i as Candle["time"],
    open: v,
    high: v,
    low: v,
    close: v,
    volume: 0,
  }));
}

/** Tam OHLC verilen Candle dizisi. */
function ohlc(rows: Array<[high: number, low: number, close: number]>): Candle[] {
  return rows.map(([high, low, close], i) => ({
    time: i as Candle["time"],
    open: close,
    high,
    low,
    close,
    volume: 0,
  }));
}

const values = (pts: { value: number }[]) => pts.map((p) => p.value);

describe("sma", () => {
  it("kayan ortalamayı doğru hesaplar", () => {
    const out = sma(closes([1, 2, 3, 4, 5]), 3);
    expect(values(out)).toEqual([2, 3, 4]);
  });

  it("period > uzunluk → boş", () => {
    expect(sma(closes([1, 2]), 3)).toEqual([]);
  });

  it("period <= 0 → boş", () => {
    expect(sma(closes([1, 2, 3]), 0)).toEqual([]);
  });

  it("ilk değerin zamanı period-1'inci mum", () => {
    const out = sma(closes([10, 20, 30, 40]), 2);
    expect(out[0].time).toBe(1);
    expect(out).toHaveLength(3);
  });
});

describe("ema", () => {
  it("ilk değer = ilk period'un SMA'sı", () => {
    const out = ema(closes([1, 2, 4]), 2);
    expect(out[0].value).toBeCloseTo(1.5, 6); // (1+2)/2
  });

  it("sonraki değer EMA formülünü izler (k=2/3)", () => {
    const out = ema(closes([1, 2, 4]), 2);
    // 4*0.6667 + 1.5*0.3333 = 3.16667
    expect(out[1].value).toBeCloseTo(3.16667, 4);
  });

  it("doğrusal seride EMA = SMA", () => {
    expect(values(ema(closes([1, 2, 3, 4, 5]), 3))).toEqual([2, 3, 4]);
  });
});

describe("rsi", () => {
  it("sürekli artan seride RSI = 100", () => {
    const out = rsi(closes([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]), 14);
    expect(out).toHaveLength(1);
    expect(out[0].value).toBe(100);
  });

  it("sürekli düşen seride RSI = 0", () => {
    const out = rsi(closes([15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]), 14);
    expect(out[0].value).toBe(0);
  });

  it("uzunluk <= period → boş", () => {
    expect(rsi(closes([1, 2, 3]), 14)).toEqual([]);
  });
});

describe("bollinger", () => {
  it("sabit seride üç bant da ortalamaya eşit (σ=0)", () => {
    const r = bollinger(closes([10, 10, 10, 10]), 3);
    expect(values(r.middle)).toEqual([10, 10]);
    expect(values(r.upper)).toEqual([10, 10]);
    expect(values(r.lower)).toEqual([10, 10]);
  });

  it("upper > middle > lower (değişken seri)", () => {
    const r = bollinger(closes([1, 2, 3, 4, 5, 6]), 3);
    const i = r.middle.length - 1;
    expect(r.upper[i].value).toBeGreaterThan(r.middle[i].value);
    expect(r.middle[i].value).toBeGreaterThan(r.lower[i].value);
  });

  it("yetersiz veri → boş bantlar", () => {
    const r = bollinger(closes([1, 2]), 3);
    expect(r.middle).toEqual([]);
  });
});

describe("atr", () => {
  it("period=1 → True Range serisini döner", () => {
    // c0: 10/8/9, c1: 12/9/11 (TR=3), c2: 11/10/10 (TR=1)
    const out = atr(ohlc([[10, 8, 9], [12, 9, 11], [11, 10, 10]]), 1);
    expect(values(out)).toEqual([3, 1]);
  });

  it("uzunluk < period+1 → boş", () => {
    expect(atr(ohlc([[10, 8, 9]]), 14)).toEqual([]);
  });
});

describe("stochastic", () => {
  it("sabit seride %K = 50 (range 0)", () => {
    const r = stochastic(ohlc([[10, 10, 10], [10, 10, 10], [10, 10, 10]]), 2);
    expect(r.k.every((p) => p.value === 50)).toBe(true);
  });
});

describe("williamsR", () => {
  it("range 0 → -50", () => {
    const out = williamsR(ohlc([[10, 10, 10], [10, 10, 10]]), 2);
    expect(out[0].value).toBe(-50);
  });
});

describe("cci", () => {
  it("sabit seride CCI = 0 (mean deviation 0)", () => {
    const out = cci(ohlc([[10, 10, 10], [10, 10, 10], [10, 10, 10]]), 2);
    expect(out.every((p) => p.value === 0)).toBe(true);
  });
});

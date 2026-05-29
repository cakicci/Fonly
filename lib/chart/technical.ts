import type {
  Candle,
  MovingAverageRow,
  TechnicalRow,
  TechnicalSignal,
  TechnicalSummary,
  Timeframe,
} from "@/types/chart"
import {
  sma, ema, rsi, macd, bollinger,
  stochastic, williamsR, cci, adx, atr,
} from "./indicators"

/**
 * Teknik özet motoru. Verilen mum dizisi için hareketli ortalama tablosu,
 * indikatör tablosu ve genel "AL/TUT/SAT" kararını üretir.
 *
 * Investing.com'un teknik özet sayfasına yakın bir kural setiyle çalışır;
 * yatırım tavsiyesi değildir, bilgi amaçlıdır.
 */

const MA_PERIODS = [5, 10, 20, 50, 100, 200] as const

// ── Formatlama ───────────────────────────────────────────────────────────────

function fmt(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return "—"
  return n.toLocaleString("tr-TR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

// ── Sinyal kuralları ─────────────────────────────────────────────────────────

function maSignal(price: number, maValue: number): TechnicalSignal {
  if (price > maValue) return "buy"
  if (price < maValue) return "sell"
  return "neutral"
}

function rsiSignal(v: number): TechnicalSignal {
  if (v < 30) return "buy"
  if (v > 70) return "sell"
  return "neutral"
}

function stochSignal(k: number): TechnicalSignal {
  if (k < 20) return "buy"
  if (k > 80) return "sell"
  return "neutral"
}

function williamsSignal(v: number): TechnicalSignal {
  if (v < -80) return "buy"
  if (v > -20) return "sell"
  return "neutral"
}

function cciSignal(v: number): TechnicalSignal {
  if (v >  100) return "buy"
  if (v < -100) return "sell"
  return "neutral"
}

function macdSignal(hist: number): TechnicalSignal {
  if (hist > 0) return "buy"
  if (hist < 0) return "sell"
  return "neutral"
}

function bbSignal(price: number, upper: number, lower: number): TechnicalSignal {
  if (price < lower) return "buy"
  if (price > upper) return "sell"
  return "neutral"
}

function adxSignal(adxV: number, plusDi: number, minusDi: number): TechnicalSignal {
  if (adxV < 20) return "neutral"
  if (plusDi  > minusDi) return "buy"
  if (minusDi > plusDi)  return "sell"
  return "neutral"
}

// ── Genel kararın hesaplanması ───────────────────────────────────────────────

function computeVerdict(
  totals: { buy: number; sell: number; neutral: number },
): TechnicalSummary["verdict"] {
  const total = totals.buy + totals.sell + totals.neutral
  if (total === 0) return "neutral"

  const buyRatio  = totals.buy  / total
  const sellRatio = totals.sell / total

  if (buyRatio  >= 0.7) return "strong_buy"
  if (sellRatio >= 0.7) return "strong_sell"
  if (buyRatio  >  sellRatio + 0.15) return "buy"
  if (sellRatio >  buyRatio  + 0.15) return "sell"
  return "neutral"
}

// ── Yardımcı: dizinin son elemanı ────────────────────────────────────────────

function lastValue<T extends { value: number }>(arr: T[]): number | null {
  return arr.length > 0 ? arr[arr.length - 1].value : null
}

// ── Ana motor ────────────────────────────────────────────────────────────────

export function computeTechnicalSummary(
  candles: Candle[],
  timeframe: Timeframe,
): TechnicalSummary | null {
  if (candles.length === 0) return null
  const lastPrice = candles[candles.length - 1].close

  // Hareketli ortalamalar tablosu
  const maRows: MovingAverageRow[] = MA_PERIODS.map(p => {
    const smaLast = lastValue(sma(candles, p))
    const emaLast = lastValue(ema(candles, p))
    return {
      period:    p,
      smaValue:  smaLast == null ? "—" : fmt(smaLast),
      smaSignal: smaLast == null ? null : maSignal(lastPrice, smaLast),
      emaValue:  emaLast == null ? "—" : fmt(emaLast),
      emaSignal: emaLast == null ? null : maSignal(lastPrice, emaLast),
    }
  })

  // İndikatör tablosu
  const indicators: TechnicalRow[] = []

  const rsiVal = lastValue(rsi(candles, 14))
  if (rsiVal != null) {
    indicators.push({ name: "RSI (14)", value: fmt(rsiVal), signal: rsiSignal(rsiVal) })
  }

  const stoch = stochastic(candles, 14, 3)
  const kVal  = lastValue(stoch.k)
  if (kVal != null) {
    indicators.push({ name: "Stoch %K (14, 3)", value: fmt(kVal), signal: stochSignal(kVal) })
  }

  const macdRes  = macd(candles, 12, 26, 9)
  const histVal  = lastValue(macdRes.histogram)
  if (histVal != null) {
    indicators.push({
      name:   "MACD (12, 26, 9)",
      value:  fmt(histVal, 4),
      signal: macdSignal(histVal),
    })
  }

  const wrVal = lastValue(williamsR(candles, 14))
  if (wrVal != null) {
    indicators.push({ name: "Williams %R (14)", value: fmt(wrVal), signal: williamsSignal(wrVal) })
  }

  const cciVal = lastValue(cci(candles, 20))
  if (cciVal != null) {
    indicators.push({ name: "CCI (20)", value: fmt(cciVal), signal: cciSignal(cciVal) })
  }

  const adxRes  = adx(candles, 14)
  const adxVal  = lastValue(adxRes.adx)
  const pdiVal  = lastValue(adxRes.plusDi)
  const mdiVal  = lastValue(adxRes.minusDi)
  if (adxVal != null && pdiVal != null && mdiVal != null) {
    indicators.push({
      name:   "ADX (14)",
      value:  fmt(adxVal),
      signal: adxSignal(adxVal, pdiVal, mdiVal),
    })
  }

  const atrVal = lastValue(atr(candles, 14))
  if (atrVal != null) {
    // ATR sinyal üretmez (volatility göstergesi) — neutral olarak işaretlenir
    // ama totals'a katılmaz.
    indicators.push({ name: "ATR (14)", value: fmt(atrVal, 4), signal: "neutral" })
  }

  const bb       = bollinger(candles, 20, 2)
  const bbUpper  = lastValue(bb.upper)
  const bbLower  = lastValue(bb.lower)
  if (bbUpper != null && bbLower != null) {
    indicators.push({
      name:   "Bollinger (20, 2)",
      value:  `${fmt(bbLower)} / ${fmt(bbUpper)}`,
      signal: bbSignal(lastPrice, bbUpper, bbLower),
    })
  }

  // Sayım — ATR sinyalsiz, totals'a katılmaz
  const totals = { buy: 0, sell: 0, neutral: 0 }
  for (const r of maRows) {
    if (r.smaSignal) totals[r.smaSignal]++
    if (r.emaSignal) totals[r.emaSignal]++
  }
  for (const ind of indicators) {
    if (ind.name.startsWith("ATR")) continue
    totals[ind.signal]++
  }

  return {
    timeframe,
    lastPrice,
    ma: maRows,
    indicators,
    totals,
    verdict: computeVerdict(totals),
  }
}

// ── UI için yardımcılar ──────────────────────────────────────────────────────

export const VERDICT_LABEL: Record<TechnicalSummary["verdict"], string> = {
  strong_buy:  "Güçlü Al",
  buy:         "Al",
  neutral:     "Nötr",
  sell:        "Sat",
  strong_sell: "Güçlü Sat",
}

export const SIGNAL_LABEL: Record<TechnicalSignal, string> = {
  buy:     "Al",
  sell:    "Sat",
  neutral: "Nötr",
}

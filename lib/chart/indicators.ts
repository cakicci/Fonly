import type {
  BollingerResult,
  Candle,
  IndicatorPoint,
  MacdResult,
} from "@/types/chart"

/**
 * Teknik gösterge hesaplayıcıları. Pure functions — Candle dizisi alır,
 * IndicatorPoint dizisi döner. Periyod kadar candle birikene kadar değer
 * üretmez (dizinin başını boş bırakır, böylece grafikte sol kenar boş kalır).
 *
 * Formüller standart — Investopedia/TradingView ile aynı.
 */

// ── SMA — Simple Moving Average ──────────────────────────────────────────────

export function sma(candles: Candle[], period: number): IndicatorPoint[] {
  if (period <= 0 || candles.length < period) return []
  const out: IndicatorPoint[] = []
  let sum = 0
  for (let i = 0; i < period; i++) sum += candles[i].close
  out.push({ time: candles[period - 1].time, value: sum / period })
  for (let i = period; i < candles.length; i++) {
    sum += candles[i].close - candles[i - period].close
    out.push({ time: candles[i].time, value: sum / period })
  }
  return out
}

// ── EMA — Exponential Moving Average ─────────────────────────────────────────

export function ema(candles: Candle[], period: number): IndicatorPoint[] {
  if (period <= 0 || candles.length < period) return []
  const k = 2 / (period + 1)
  const out: IndicatorPoint[] = []

  // İlk EMA = ilk period candle'ın SMA'sı
  let sum = 0
  for (let i = 0; i < period; i++) sum += candles[i].close
  let prev = sum / period
  out.push({ time: candles[period - 1].time, value: prev })

  for (let i = period; i < candles.length; i++) {
    prev = candles[i].close * k + prev * (1 - k)
    out.push({ time: candles[i].time, value: prev })
  }
  return out
}

// ── RSI — Relative Strength Index (Wilder smoothing) ────────────────────────

export function rsi(candles: Candle[], period = 14): IndicatorPoint[] {
  if (candles.length <= period) return []
  const out: IndicatorPoint[] = []
  let gainSum = 0
  let lossSum = 0

  // İlk period kadar fiyat değişimi
  for (let i = 1; i <= period; i++) {
    const diff = candles[i].close - candles[i - 1].close
    if (diff >= 0) gainSum += diff
    else           lossSum += -diff
  }
  let avgGain = gainSum / period
  let avgLoss = lossSum / period

  const rsAt = (gain: number, loss: number) =>
    loss === 0 ? 100 : 100 - 100 / (1 + gain / loss)

  out.push({ time: candles[period].time, value: rsAt(avgGain, avgLoss) })

  for (let i = period + 1; i < candles.length; i++) {
    const diff = candles[i].close - candles[i - 1].close
    const gain = diff > 0 ?  diff : 0
    const loss = diff < 0 ? -diff : 0
    avgGain = (avgGain * (period - 1) + gain) / period
    avgLoss = (avgLoss * (period - 1) + loss) / period
    out.push({ time: candles[i].time, value: rsAt(avgGain, avgLoss) })
  }
  return out
}

// ── MACD — Moving Average Convergence Divergence ─────────────────────────────

/**
 * MACD = EMA(12) - EMA(26)
 * Signal = EMA(9) of MACD
 * Histogram = MACD - Signal
 */
export function macd(
  candles: Candle[],
  fast = 12,
  slow = 26,
  signalPeriod = 9
): MacdResult {
  const emaFast = ema(candles, fast)
  const emaSlow = ema(candles, slow)
  if (emaSlow.length === 0) return { macd: [], signal: [], histogram: [] }

  // emaSlow daha kısa (sonra başlıyor). Hizala — emaFast'ın son N elemanı.
  const offset = emaFast.length - emaSlow.length
  const macdLine: IndicatorPoint[] = emaSlow.map((slowPt, i) => ({
    time:  slowPt.time,
    value: emaFast[i + offset].value - slowPt.value,
  }))

  // Signal — MACD üzerinde EMA(9)
  // EMA fonksiyonumuz Candle alıyor; macdLine'ı sahte Candle'a çevir
  const macdAsCandles: Candle[] = macdLine.map(p => ({
    time:   p.time,
    open:   p.value,
    high:   p.value,
    low:    p.value,
    close:  p.value,
    volume: 0,
  }))
  const signalLine = ema(macdAsCandles, signalPeriod)

  const signalOffset = macdLine.length - signalLine.length
  const histogram: IndicatorPoint[] = signalLine.map((s, i) => ({
    time:  s.time,
    value: macdLine[i + signalOffset].value - s.value,
  }))

  return { macd: macdLine, signal: signalLine, histogram }
}

// ── Bollinger Bands ──────────────────────────────────────────────────────────

/**
 * Middle = SMA(period)
 * Upper  = SMA + (stdMultiplier × σ)
 * Lower  = SMA - (stdMultiplier × σ)
 */
export function bollinger(
  candles: Candle[],
  period = 20,
  stdMultiplier = 2
): BollingerResult {
  if (period <= 0 || candles.length < period) {
    return { middle: [], upper: [], lower: [] }
  }
  const middle: IndicatorPoint[] = []
  const upper:  IndicatorPoint[] = []
  const lower:  IndicatorPoint[] = []

  for (let i = period - 1; i < candles.length; i++) {
    let sum = 0
    for (let j = i - period + 1; j <= i; j++) sum += candles[j].close
    const mean = sum / period

    let variance = 0
    for (let j = i - period + 1; j <= i; j++) {
      const d = candles[j].close - mean
      variance += d * d
    }
    const sigma = Math.sqrt(variance / period)

    const t = candles[i].time
    middle.push({ time: t, value: mean })
    upper.push({  time: t, value: mean + stdMultiplier * sigma })
    lower.push({  time: t, value: mean - stdMultiplier * sigma })
  }
  return { middle, upper, lower }
}

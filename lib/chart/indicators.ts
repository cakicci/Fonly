import type {
  AdxResult,
  BollingerResult,
  Candle,
  IndicatorPoint,
  MacdResult,
  StochasticResult,
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

// ── Stochastic Oscillator ───────────────────────────────────────────────────

/**
 * %K = 100 × (close - lowest(low, period)) / (highest(high, period) - lowest(low, period))
 * %D = SMA(%K, smoothing)
 *
 * Standart: period=14, smoothing=3 (yavaş stokastik).
 */
export function stochastic(
  candles: Candle[],
  period = 14,
  smoothing = 3,
): StochasticResult {
  if (candles.length < period) return { k: [], d: [] }
  const k: IndicatorPoint[] = []

  for (let i = period - 1; i < candles.length; i++) {
    let hh = candles[i].high
    let ll = candles[i].low
    for (let j = i - period + 1; j <= i; j++) {
      if (candles[j].high > hh) hh = candles[j].high
      if (candles[j].low  < ll) ll = candles[j].low
    }
    const range = hh - ll
    const val   = range === 0 ? 50 : ((candles[i].close - ll) / range) * 100
    k.push({ time: candles[i].time, value: val })
  }

  // %D = SMA of %K
  const d: IndicatorPoint[] = []
  if (k.length >= smoothing) {
    let sum = 0
    for (let i = 0; i < smoothing; i++) sum += k[i].value
    d.push({ time: k[smoothing - 1].time, value: sum / smoothing })
    for (let i = smoothing; i < k.length; i++) {
      sum += k[i].value - k[i - smoothing].value
      d.push({ time: k[i].time, value: sum / smoothing })
    }
  }
  return { k, d }
}

// ── Williams %R ──────────────────────────────────────────────────────────────

/**
 * %R = -100 × (highest(high) - close) / (highest(high) - lowest(low))
 * Stochastic'in -100..0 ölçeğindeki ters versiyonu. < -80 aşırı satım, > -20 aşırı alım.
 */
export function williamsR(candles: Candle[], period = 14): IndicatorPoint[] {
  if (candles.length < period) return []
  const out: IndicatorPoint[] = []
  for (let i = period - 1; i < candles.length; i++) {
    let hh = candles[i].high
    let ll = candles[i].low
    for (let j = i - period + 1; j <= i; j++) {
      if (candles[j].high > hh) hh = candles[j].high
      if (candles[j].low  < ll) ll = candles[j].low
    }
    const range = hh - ll
    const val   = range === 0 ? -50 : ((hh - candles[i].close) / range) * -100
    out.push({ time: candles[i].time, value: val })
  }
  return out
}

// ── CCI — Commodity Channel Index ────────────────────────────────────────────

/**
 * Typical Price = (high + low + close) / 3
 * CCI = (TP - SMA(TP, 20)) / (0.015 × meanDeviation)
 * > +100 aşırı alım, < -100 aşırı satım.
 */
export function cci(candles: Candle[], period = 20): IndicatorPoint[] {
  if (candles.length < period) return []
  const out: IndicatorPoint[] = []
  const tp = candles.map(c => (c.high + c.low + c.close) / 3)

  for (let i = period - 1; i < tp.length; i++) {
    let sum = 0
    for (let j = i - period + 1; j <= i; j++) sum += tp[j]
    const sma = sum / period

    let md = 0
    for (let j = i - period + 1; j <= i; j++) md += Math.abs(tp[j] - sma)
    md /= period

    const val = md === 0 ? 0 : (tp[i] - sma) / (0.015 * md)
    out.push({ time: candles[i].time, value: val })
  }
  return out
}

// ── ATR — Average True Range (Wilder smoothing) ──────────────────────────────

/**
 * True Range = max(high-low, |high-prevClose|, |low-prevClose|)
 * ATR = Wilder-smoothed TR (ilk değer = TR'nin period SMA'sı, sonrası
 *   ATR = ((prev × (period-1)) + TR) / period )
 */
export function atr(candles: Candle[], period = 14): IndicatorPoint[] {
  if (candles.length < period + 1) return []
  const tr: number[] = [0] // index 0 — kullanılmaz
  for (let i = 1; i < candles.length; i++) {
    const c = candles[i], p = candles[i - 1]
    tr.push(Math.max(
      c.high - c.low,
      Math.abs(c.high - p.close),
      Math.abs(c.low  - p.close),
    ))
  }

  let sum = 0
  for (let i = 1; i <= period; i++) sum += tr[i]
  let prev = sum / period
  const out: IndicatorPoint[] = [{ time: candles[period].time, value: prev }]

  for (let i = period + 1; i < candles.length; i++) {
    prev = (prev * (period - 1) + tr[i]) / period
    out.push({ time: candles[i].time, value: prev })
  }
  return out
}

// ── ADX — Average Directional Index ──────────────────────────────────────────

/**
 * Wilder'in trend gücü göstergesi. ADX > 25 → güçlü trend.
 * +DI > -DI → yukarı, +DI < -DI → aşağı. ADX yön söylemez, sadece güç.
 */
export function adx(candles: Candle[], period = 14): AdxResult {
  if (candles.length < period * 2) return { adx: [], plusDi: [], minusDi: [] }

  const tr: number[]      = [0]
  const plusDm: number[]  = [0]
  const minusDm: number[] = [0]

  for (let i = 1; i < candles.length; i++) {
    const c = candles[i], p = candles[i - 1]
    tr.push(Math.max(
      c.high - c.low,
      Math.abs(c.high - p.close),
      Math.abs(c.low  - p.close),
    ))
    const upMove   = c.high - p.high
    const downMove = p.low  - c.low
    plusDm.push( upMove   > downMove && upMove   > 0 ? upMove   : 0)
    minusDm.push(downMove > upMove   && downMove > 0 ? downMove : 0)
  }

  // İlk smoothing'ler — period'luk toplamlar (Wilder yöntemi)
  let trSum = 0, pSum = 0, mSum = 0
  for (let i = 1; i <= period; i++) {
    trSum += tr[i]; pSum += plusDm[i]; mSum += minusDm[i]
  }

  const plusDi:  IndicatorPoint[] = []
  const minusDi: IndicatorPoint[] = []
  const dx: number[] = []

  // İlk DI'lar
  let pdi = trSum === 0 ? 0 : (pSum / trSum) * 100
  let mdi = trSum === 0 ? 0 : (mSum / trSum) * 100
  plusDi.push({  time: candles[period].time, value: pdi })
  minusDi.push({ time: candles[period].time, value: mdi })
  dx.push(pdi + mdi === 0 ? 0 : (Math.abs(pdi - mdi) / (pdi + mdi)) * 100)

  for (let i = period + 1; i < candles.length; i++) {
    trSum = trSum - trSum / period + tr[i]
    pSum  = pSum  - pSum  / period + plusDm[i]
    mSum  = mSum  - mSum  / period + minusDm[i]
    pdi   = trSum === 0 ? 0 : (pSum / trSum) * 100
    mdi   = trSum === 0 ? 0 : (mSum / trSum) * 100
    plusDi.push({  time: candles[i].time, value: pdi })
    minusDi.push({ time: candles[i].time, value: mdi })
    dx.push(pdi + mdi === 0 ? 0 : (Math.abs(pdi - mdi) / (pdi + mdi)) * 100)
  }

  // ADX = DX'in period-Wilder ortalaması (DX'in ilk period'unu SMA'la, sonrasını smooth'la)
  if (dx.length < period) return { adx: [], plusDi, minusDi }
  let adxSum = 0
  for (let i = 0; i < period; i++) adxSum += dx[i]
  let adxVal = adxSum / period
  const adxOut: IndicatorPoint[] = [
    { time: plusDi[period - 1].time, value: adxVal },
  ]
  for (let i = period; i < dx.length; i++) {
    adxVal = (adxVal * (period - 1) + dx[i]) / period
    adxOut.push({ time: plusDi[i].time, value: adxVal })
  }
  return { adx: adxOut, plusDi, minusDi }
}

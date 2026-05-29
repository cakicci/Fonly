/**
 * Chart sistemi için ortak tipler.
 * Lightweight Charts'ın UTCTimestamp tipi epoch saniye (number); biz de
 * o formata uyuyoruz.
 */

export type Timeframe =
  | "1dk" | "5dk" | "15dk" | "30dk"  // intraday minute (Yahoo only)
  | "1S"  | "5S"                     // saatlik / 5 saatlik bars (Yahoo 60m, 5S aggregated)
  | "1D"  | "1W"  | "1Mo"            // günlük / haftalık / aylık bars
  | "1G" | "1H" | "1A" | "3A" | "1Y" | "5Y" | "MAX"

export type ChartType = "candle" | "line" | "area"

export type IndicatorKey =
  | "sma20"
  | "sma50"
  | "sma200"
  | "ema20"
  | "ema50"
  | "rsi14"
  | "macd"
  | "bollinger"

export interface Candle {
  /** Epoch saniye (UTCTimestamp). */
  time:   number
  open:   number
  high:   number
  low:    number
  close:  number
  /** TEFAS fonlarında ve forex'te 0 olabilir. */
  volume: number
}

/** Asset slug formatı: "{type}-{code}" (örn. "hisse-THYAO", "doviz-USD"). */
export type AssetSlug = `${"hisse" | "doviz" | "altin" | "fon"}-${string}`

export interface OhlcResponse {
  /** "{type}-{code}" şeklinde slug — istek yapılan asset. */
  slug:      string
  /** Asset insan-okur isim — sayfada gösterilir. */
  name:      string
  /** Timeframe — istemcinin gönderdiği değer (echo). */
  timeframe: Timeframe
  candles:   Candle[]
  /**
   * Fonlar için true — sadece günlük NAV, candle yapısı open=high=low=close.
   * UI bunu görünce "Mum yerine line kullan, volume gösterme" der.
   */
  isLineOnly: boolean
  /**
   * Yahoo'nun meta.regularMarketPrice'ı — `candles[last].close` ile aynı
   * OLMAYABİLİR çünkü uzun range sorgularında son tam günlük mum güne göre
   * geride kalabiliyor. AssetHeader bu değeri kullanır.
   * TEFAS fonlar için son NAV ile aynıdır.
   */
  latest?: {
    price:     number
    /** Önceki günkü kapanışa göre yüzdesel değişim. */
    changePct: number | null
    /** Epoch saniye. */
    time:      number
  } | null
}

export interface IndicatorPoint {
  time:  number
  value: number
}

/** MACD üç ayrı seri üretir — main line, signal, histogram. */
export interface MacdResult {
  macd:      IndicatorPoint[]
  signal:    IndicatorPoint[]
  histogram: IndicatorPoint[]
}

/** Bollinger üç seri — orta (SMA), üst, alt. */
export interface BollingerResult {
  middle: IndicatorPoint[]
  upper:  IndicatorPoint[]
  lower:  IndicatorPoint[]
}

/** Stochastic Oscillator — %K (fast) ve %D (signal, %K'nın SMA'sı). */
export interface StochasticResult {
  k: IndicatorPoint[]
  d: IndicatorPoint[]
}

/** ADX paketi — trend gücü (ADX) + yönlü hareket (+DI / -DI). */
export interface AdxResult {
  adx:      IndicatorPoint[]
  plusDi:   IndicatorPoint[]
  minusDi:  IndicatorPoint[]
}

/** Teknik özette tek bir göstergenin durumu — tablo satırı için. */
export type TechnicalSignal = "buy" | "sell" | "neutral"

export interface TechnicalRow {
  name:   string
  /** İnsan-okur değer (formatlı string). */
  value:  string
  signal: TechnicalSignal
}

export interface MovingAverageRow {
  period:    number
  /** "—" → veri yetersiz. */
  smaValue:  string
  smaSignal: TechnicalSignal | null
  emaValue:  string
  emaSignal: TechnicalSignal | null
}

export interface TechnicalSummary {
  timeframe:  Timeframe
  /** Son fiyat (tüm sinyallerin referansı). */
  lastPrice:  number
  ma:         MovingAverageRow[]
  indicators: TechnicalRow[]
  /** Tüm sinyaller — MA + gösterge toplamı. */
  totals:     { buy: number; sell: number; neutral: number }
  /** "Güçlü Al" / "Al" / "Tut" / "Sat" / "Güçlü Sat" */
  verdict:    "strong_buy" | "buy" | "neutral" | "sell" | "strong_sell"
}

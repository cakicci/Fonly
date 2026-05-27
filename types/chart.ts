/**
 * Chart sistemi için ortak tipler.
 * Lightweight Charts'ın UTCTimestamp tipi epoch saniye (number); biz de
 * o formata uyuyoruz.
 */

export type Timeframe =
  | "1dk" | "5dk" | "15dk" | "30dk"  // intraday minute (Yahoo only)
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

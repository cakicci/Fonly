"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  AreaSeries,
  HistogramSeries,
  CrosshairMode,
  type IChartApi,
  type ISeriesApi,
  type Time,
  type CandlestickData,
  type LineData,
  type HistogramData,
  type SeriesType,
} from "lightweight-charts";
import type { Candle, ChartType, IndicatorKey } from "@/types/chart";
import { sma, ema, rsi, macd, bollinger } from "@/lib/chart/indicators";
import { fmtAsset, priceFormatFor, type AssetKind } from "@/lib/format";

export interface AdvancedChartProps {
  data:       Candle[];
  chartType:  ChartType;
  showVolume: boolean;
  indicators: IndicatorKey[];
  /** Fon gibi candle desteklemeyen asset'lerde true — line zorla. */
  isLineOnly: boolean;
  height?:    number;
  /** OHLC görselleştirmesinde formatlama için ipucu (örn. "₺", "$"). */
  unit?:      string;
  /**
   * Varlık tipi — y-ekseni hassasiyeti ve tooltip ondalık sayısı için.
   * Verilmezse büyüklüğe göre auto (geriye dönük).
   */
  assetKind?: AssetKind;
  /**
   * Polling sonucu son mum güncellemesi — chart yeniden oluşturulmadan
   * `mainSeries.update(...)` çağrılır. null = no-op.
   */
  tickUpdate?: Candle | null;
}

// ── Renkler (dark theme) ────────────────────────────────────────────────────
const COLORS = {
  bg:          "transparent",
  text:        "#9ca3af",
  grid:        "rgba(255,255,255,0.05)",
  border:      "rgba(255,255,255,0.1)",
  up:          "#34d399",
  down:        "#fb7185",
  upBorder:    "#34d399",
  downBorder:  "#fb7185",
  upWick:      "#34d399",
  downWick:    "#fb7185",
  lineMain:    "#34d399",
  areaTopMain: "rgba(52,211,153,0.30)",
  areaBotMain: "rgba(52,211,153,0.02)",
  volumeUp:    "rgba(52,211,153,0.5)",
  volumeDown:  "rgba(251,113,133,0.5)",
};

const INDICATOR_COLORS: Record<IndicatorKey, string> = {
  sma20:     "#f59e0b",
  sma50:     "#3b82f6",
  sma200:    "#a855f7",
  ema20:     "#fbbf24",
  ema50:     "#06b6d4",
  rsi14:     "#ec4899",
  macd:      "#10b981",
  bollinger: "#94a3b8",
};

export function AdvancedChart({
  data,
  chartType,
  showVolume,
  indicators,
  isLineOnly,
  height = 480,
  unit = "",
  assetKind,
  tickUpdate,
}: AdvancedChartProps) {
  const containerRef    = useRef<HTMLDivElement>(null);
  const chartRef        = useRef<IChartApi | null>(null);
  const mainSeriesRef   = useRef<ISeriesApi<SeriesType> | null>(null);
  const [hoverOhlc, setHoverOhlc] = useState<Candle | null>(null);

  // Effective chart type — fonlarda candle zorlamalı line
  const effectiveType: ChartType = isLineOnly && chartType === "candle" ? "line" : chartType;
  const effectiveVolume = showVolume && !isLineOnly;

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    // İstanbul timezone'unda zaman gösterimi — Yahoo timestamp'leri UTC,
    // kullanıcıya TR saati lazım. tickMarkFormatter x-ekseninde, timeFormatter
    // tooltip'te. tickMarkType ile gün/saat seviyesini ayırt ediyoruz.
    const tzFmt = (timeSec: number, withDate: boolean): string => {
      const d = new Date(timeSec * 1000);
      const opts: Intl.DateTimeFormatOptions = withDate
        ? { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" }
        : { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" };
      return d.toLocaleString("tr-TR", opts);
    };

    const chart = createChart(containerRef.current, {
      width:  containerRef.current.clientWidth,
      height,
      layout: {
        background:        { color: COLORS.bg },
        textColor:         COLORS.text,
        fontFamily:        "ui-sans-serif, system-ui",
        attributionLogo:   false,
      },
      grid: {
        vertLines: { color: COLORS.grid },
        horzLines: { color: COLORS.grid },
      },
      crosshair: { mode: CrosshairMode.Normal },
      localization: {
        locale: "tr-TR",
        timeFormatter: (time: number) => tzFmt(time, true),
      },
      timeScale: {
        borderColor:    COLORS.border,
        timeVisible:    true,
        secondsVisible: false,
        tickMarkFormatter: (time: number, tickMarkType: number) => {
          // tickMarkType: 0=Year, 1=Month, 2=DayOfMonth, 3=Time, 4=TimeWithSeconds
          const d = new Date(time * 1000);
          if (tickMarkType <= 1) {
            return d.toLocaleString("tr-TR", { year: "numeric", month: "short", timeZone: "Europe/Istanbul" });
          }
          if (tickMarkType === 2) {
            return d.toLocaleString("tr-TR", { day: "2-digit", month: "short", timeZone: "Europe/Istanbul" });
          }
          return tzFmt(time, false);
        },
      },
      rightPriceScale: {
        borderColor:   COLORS.border,
        scaleMargins:  effectiveVolume ? { top: 0.05, bottom: 0.25 } : { top: 0.05, bottom: 0.05 },
      },
      handleScroll: true,
      handleScale:  true,
    });
    chartRef.current = chart;

    // ── Ana seri ───────────────────────────────────────────────────────────
    // Y-ekseni hassasiyeti: kind verilirse (FX=4, hisse=2, fon=4, altın=2);
    // verilmezse büyüklüğe göre auto (geriye dönük).
    const priceFormat = assetKind
      ? { type: "price" as const, ...priceFormatFor(assetKind) }
      : autoPriceFormat(data);

    let mainSeries: ISeriesApi<SeriesType>;
    if (effectiveType === "candle") {
      mainSeries = chart.addSeries(CandlestickSeries, {
        upColor:         COLORS.up,
        downColor:       COLORS.down,
        borderUpColor:   COLORS.upBorder,
        borderDownColor: COLORS.downBorder,
        wickUpColor:     COLORS.upWick,
        wickDownColor:   COLORS.downWick,
        priceFormat,
      });
      const candleData: CandlestickData<Time>[] = data.map(c => ({
        time:  c.time as Time,
        open:  c.open,
        high:  c.high,
        low:   c.low,
        close: c.close,
      }));
      mainSeries.setData(candleData);
    } else if (effectiveType === "area") {
      mainSeries = chart.addSeries(AreaSeries, {
        lineColor:    COLORS.lineMain,
        topColor:     COLORS.areaTopMain,
        bottomColor:  COLORS.areaBotMain,
        lineWidth:    2,
        priceFormat,
      });
      const lineData: LineData<Time>[] = data.map(c => ({
        time:  c.time as Time,
        value: c.close,
      }));
      mainSeries.setData(lineData);
    } else {
      mainSeries = chart.addSeries(LineSeries, {
        color:     COLORS.lineMain,
        lineWidth: 2,
        priceFormat,
      });
      const lineData: LineData<Time>[] = data.map(c => ({
        time:  c.time as Time,
        value: c.close,
      }));
      mainSeries.setData(lineData);
    }

    // ── Volume pane ────────────────────────────────────────────────────────
    if (effectiveVolume) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat:  { type: "volume" },
        priceScaleId: "volume",
      });
      volumeSeries.priceScale().applyOptions({
        scaleMargins: { top: 0.75, bottom: 0 },
      });
      const volData: HistogramData<Time>[] = data.map(c => ({
        time:  c.time as Time,
        value: c.volume,
        color: c.close >= c.open ? COLORS.volumeUp : COLORS.volumeDown,
      }));
      volumeSeries.setData(volData);
    }

    // ── Indicators (overlay'ler) ───────────────────────────────────────────
    for (const ind of indicators) {
      if (ind === "sma20" || ind === "sma50" || ind === "sma200") {
        const period = ind === "sma20" ? 20 : ind === "sma50" ? 50 : 200;
        const points = sma(data, period);
        if (points.length === 0) continue;
        const series = chart.addSeries(LineSeries, {
          color:           INDICATOR_COLORS[ind],
          lineWidth:       1,
          lastValueVisible: false,
          priceLineVisible: false,
        });
        series.setData(points.map(p => ({ time: p.time as Time, value: p.value })));
      } else if (ind === "ema20" || ind === "ema50") {
        const period = ind === "ema20" ? 20 : 50;
        const points = ema(data, period);
        if (points.length === 0) continue;
        const series = chart.addSeries(LineSeries, {
          color:           INDICATOR_COLORS[ind],
          lineWidth:       1,
          lineStyle:       2, // dashed
          lastValueVisible: false,
          priceLineVisible: false,
        });
        series.setData(points.map(p => ({ time: p.time as Time, value: p.value })));
      } else if (ind === "bollinger") {
        const { upper, lower, middle } = bollinger(data, 20, 2);
        if (middle.length === 0) continue;
        const mid = chart.addSeries(LineSeries, {
          color: INDICATOR_COLORS.bollinger, lineWidth: 1,
          lastValueVisible: false, priceLineVisible: false,
        });
        mid.setData(middle.map(p => ({ time: p.time as Time, value: p.value })));
        const up = chart.addSeries(LineSeries, {
          color: "rgba(148,163,184,0.6)", lineWidth: 1,
          lastValueVisible: false, priceLineVisible: false,
        });
        up.setData(upper.map(p => ({ time: p.time as Time, value: p.value })));
        const lo = chart.addSeries(LineSeries, {
          color: "rgba(148,163,184,0.6)", lineWidth: 1,
          lastValueVisible: false, priceLineVisible: false,
        });
        lo.setData(lower.map(p => ({ time: p.time as Time, value: p.value })));
      }
      // RSI ve MACD ayrı pane gerektiriyor — şimdilik atlıyoruz, faz 6'da
      // genişletilecek (lightweight-charts'ta ayrı pane API'si v5'te yeni)
    }

    // ── Crosshair tooltip ──────────────────────────────────────────────────
    chart.subscribeCrosshairMove(param => {
      if (!param.time || !param.seriesData.size) {
        setHoverOhlc(null);
        return;
      }
      const seriesData = param.seriesData.get(mainSeries) as
        | CandlestickData<Time>
        | LineData<Time>
        | undefined;
      if (!seriesData) {
        setHoverOhlc(null);
        return;
      }
      // CandlestickData has open/high/low/close, LineData has value only
      if ("open" in seriesData) {
        setHoverOhlc({
          time:   seriesData.time as number,
          open:   seriesData.open,
          high:   seriesData.high,
          low:    seriesData.low,
          close:  seriesData.close,
          volume: 0,
        });
      } else {
        setHoverOhlc({
          time:   seriesData.time as number,
          open:   seriesData.value,
          high:   seriesData.value,
          low:    seriesData.value,
          close:  seriesData.value,
          volume: 0,
        });
      }
    });

    chart.timeScale().fitContent();
    mainSeriesRef.current = mainSeries;

    // ── Resize ────────────────────────────────────────────────────────────
    const resizeObserver = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect.width ?? 0;
      if (w > 0) chart.applyOptions({ width: w });
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      mainSeriesRef.current = null;
    };
  }, [data, effectiveType, effectiveVolume, indicators, height]);

  // ── Tick update — son mumu chart'ı yeniden oluşturmadan güncelle ──────────
  useEffect(() => {
    if (!tickUpdate || !mainSeriesRef.current) return;
    if (effectiveType === "candle") {
      mainSeriesRef.current.update({
        time:  tickUpdate.time as Time,
        open:  tickUpdate.open,
        high:  tickUpdate.high,
        low:   tickUpdate.low,
        close: tickUpdate.close,
      } as CandlestickData<Time>);
    } else {
      mainSeriesRef.current.update({
        time:  tickUpdate.time as Time,
        value: tickUpdate.close,
      } as LineData<Time>);
    }
  }, [tickUpdate, effectiveType]);

  return (
    <div className="relative w-full">
      {hoverOhlc && (
        <div className="pointer-events-none absolute left-2 top-2 z-10 rounded-lg border border-white/10 bg-ink/85 px-3 py-1.5 text-xs font-mono backdrop-blur-sm">
          <span className="text-mist/50">O</span>{" "}
          <span className="text-white">{fmtTooltip(hoverOhlc.open, assetKind)}</span>
          <span className="ml-2 text-mist/50">H</span>{" "}
          <span className="text-emerald-300">{fmtTooltip(hoverOhlc.high, assetKind)}</span>
          <span className="ml-2 text-mist/50">L</span>{" "}
          <span className="text-rose-300">{fmtTooltip(hoverOhlc.low, assetKind)}</span>
          <span className="ml-2 text-mist/50">C</span>{" "}
          <span className="text-white">{fmtTooltip(hoverOhlc.close, assetKind)}{unit}</span>
        </div>
      )}
      <div ref={containerRef} className="w-full" style={{ height }} />
    </div>
  );
}

function fmtTooltip(v: number, kind: AssetKind | undefined): string {
  if (kind) return fmtAsset(v, kind);
  // Fallback (kind verilmediyse) — eski büyüklük-tabanlı davranış.
  if (v >= 1000) return v.toLocaleString("tr-TR", { maximumFractionDigits: 2 });
  if (v >= 10)   return v.toFixed(2);
  return v.toFixed(4);
}

/**
 * `assetKind` verilmediyse veri büyüklüğüne bakıp Lightweight Charts'a
 * uygun precision/minMove döner. Eskiden Y-ekseni varsayılan 2 ondalıkta
 * sabitti — bu en azından küçük fiyatlarda 4 hanyi açar.
 */
function autoPriceFormat(data: Candle[]): { type: "price"; precision: number; minMove: number } {
  const sample = data[Math.floor(data.length / 2)]?.close ?? 0;
  if (sample >= 1000) return { type: "price", precision: 2, minMove: 0.01 };
  if (sample >= 10)   return { type: "price", precision: 2, minMove: 0.01 };
  return { type: "price", precision: 4, minMove: 0.0001 };
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AdvancedChart } from "./AdvancedChart";
import { ChartToolbar } from "./ChartToolbar";
import { useLivePriceStore } from "@/lib/store/livePriceStore";
import type {
  Candle,
  ChartType,
  IndicatorKey,
  OhlcResponse,
  Timeframe,
} from "@/types/chart";

const LIVE_POLL_MS = 60_000;

export interface ChartSectionProps {
  /** Asset slug — örn. "hisse-THYAO". */
  slug:           string;
  /** Varsayılan timeframe. */
  defaultTf?:     Timeframe;
  /** Varsayılan chart tipi. */
  defaultType?:   ChartType;
  /**
   * Bu asset candle destekliyor mu (true = hisse/döviz/altın, false = fon).
   * Yanıttaki isLineOnly da kontrol edilir ama bu prop UI'da disabled state için.
   */
  supportsCandle: boolean;
  /** UI hint — tooltip fiyat birimi (örn. "₺", "$"). */
  unit?:          string;
}

export function ChartSection({
  slug,
  defaultTf = "1Y",
  defaultType = "candle",
  supportsCandle,
  unit = "",
}: ChartSectionProps) {
  const [timeframe,  setTimeframe]   = useState<Timeframe>(defaultTf);
  const [chartType,  setChartType]   = useState<ChartType>(
    supportsCandle ? defaultType : "line"
  );
  const [showVolume, setShowVolume]  = useState(false);
  const [indicators, setIndicators]  = useState<IndicatorKey[]>([]);
  const [isFullscreen, setFullscreen] = useState(false);
  const [resp,       setResp]        = useState<OhlcResponse | null>(null);
  const [loading,    setLoading]     = useState(true);
  const [error,      setError]       = useState<string | null>(null);
  const [tick,       setTick]        = useState<Candle | null>(null);
  const setLivePrice = useLivePriceStore((s) => s.set);
  const wrapRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ohlc/${slug}?tf=${timeframe}`, { cache: "no-store" });
      if (!res.ok) {
        setError("Veri yüklenemedi");
        setResp(null);
        return;
      }
      const json: OhlcResponse = await res.json();
      setResp(json);

      // İlk yüklemede de livePriceStore'a yaz — AssetHeader hemen senkronlansın
      // (yoksa 60sn ilk polling tick'i gelene kadar server-render değeri
      // gösterir ve chart ile uyuşmaz).
      if (!json.isLineOnly && json.candles.length >= 2) {
        const last = json.candles[json.candles.length - 1];
        const prev = json.candles[json.candles.length - 2];
        const changePct = prev.close ? ((last.close - prev.close) / prev.close) * 100 : null;
        setLivePrice(slug, last.close, changePct);
      }
    } catch {
      setError("Veri yüklenemedi");
      setResp(null);
    } finally {
      setLoading(false);
    }
  }, [slug, timeframe, setLivePrice]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Canlı tick polling (60sn) ────────────────────────────────────────────
  // Aynı timeframe ile refetch ediyor, ama sadece son mumu chart'a push'luyoruz.
  // Yahoo cache 60sn olduğundan polling ile cache senkron — gereksiz upstream
  // çağrı olmaz.
  useEffect(() => {
    if (!resp || resp.isLineOnly) return; // fonlarda intraday yok → polling anlamsız

    const pollTick = async () => {
      try {
        const res = await fetch(`/api/ohlc/${slug}?tf=${timeframe}`, { cache: "no-store" });
        if (!res.ok) return;
        const json: OhlcResponse = await res.json();
        const candles = json.candles;
        if (candles.length < 2) return;
        const last = candles[candles.length - 1];
        setTick(last);

        // Live price store'a yaz — AssetHeader subscribe ediyor
        const prevClose = candles[candles.length - 2].close;
        const changePct = prevClose ? ((last.close - prevClose) / prevClose) * 100 : null;
        setLivePrice(slug, last.close, changePct);
      } catch { /* sessiz */ }
    };

    const id = setInterval(pollTick, LIVE_POLL_MS);
    return () => clearInterval(id);
  }, [slug, timeframe, resp, setLivePrice]);

  // Fullscreen — sayfa scroll lock + ESC
  useEffect(() => {
    if (!isFullscreen) {
      document.body.style.overflow = "";
      return;
    }
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setFullscreen(false); };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isFullscreen]);

  const toggleIndicator = (k: IndicatorKey) => {
    setIndicators(prev =>
      prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k]
    );
  };

  const isLineOnly = resp?.isLineOnly ?? !supportsCandle;
  const candleDisabled = isLineOnly;

  return (
    <div
      ref={wrapRef}
      className={
        isFullscreen
          ? "fixed inset-0 z-50 flex flex-col gap-3 overflow-hidden bg-ink p-4"
          : "flex flex-col gap-3"
      }
    >
      <ChartToolbar
        timeframe={timeframe}
        onTimeframe={setTimeframe}
        chartType={chartType}
        onChartType={setChartType}
        showVolume={showVolume}
        onToggleVolume={() => setShowVolume(v => !v)}
        indicators={indicators}
        onToggleIndicator={toggleIndicator}
        candleDisabled={candleDisabled}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setFullscreen(v => !v)}
      />

      <div className={`relative rounded-2xl border border-white/8 bg-white/[0.02] p-4 ${
        isFullscreen ? "flex-1" : ""
      }`}>
        {loading ? (
          <div className="flex h-[480px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-300/30 border-t-emerald-300" />
          </div>
        ) : error ? (
          <div className="flex h-[480px] flex-col items-center justify-center gap-2">
            <p className="text-sm text-mist/50">{error}</p>
            <button
              onClick={fetchData}
              className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-mist/70 transition hover:bg-white/[0.08] hover:text-white"
            >
              Tekrar dene
            </button>
          </div>
        ) : resp && resp.candles.length > 0 ? (
          <AdvancedChart
            data={resp.candles}
            chartType={chartType}
            showVolume={showVolume}
            indicators={indicators}
            isLineOnly={isLineOnly}
            height={isFullscreen ? window.innerHeight - 160 : 480}
            unit={unit}
            tickUpdate={tick}
          />
        ) : (
          <div className="flex h-[480px] items-center justify-center">
            <p className="text-sm text-mist/40">Veri yok</p>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <p className="text-[11px] text-mist/35">
        {isLineOnly
          ? "TEFAS sadece günlük NAV verir; intraday mum ve hacim desteklenmez."
          : "Yahoo Finance verisi — yaklaşık 15 dk gecikmeli olabilir."}
      </p>
    </div>
  );
}

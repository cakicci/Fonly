"use client";

import { useState } from "react";
import {
  AreaChart,
  BarChart3,
  CandlestickChart,
  ChevronDown,
  LineChart,
  Maximize2,
  Minimize2,
  TrendingUp,
} from "lucide-react";
import { ALL_TIMEFRAMES, TIMEFRAME_LABELS } from "@/lib/chart/timeframe";
import type { ChartType, IndicatorKey, Timeframe } from "@/types/chart";

export interface ChartToolbarProps {
  timeframe:     Timeframe;
  onTimeframe:   (tf: Timeframe) => void;
  chartType:     ChartType;
  onChartType:   (t: ChartType) => void;
  showVolume:    boolean;
  onToggleVolume: () => void;
  indicators:    IndicatorKey[];
  onToggleIndicator: (k: IndicatorKey) => void;
  /** Fonlarda candle ve volume disabled olsun. */
  candleDisabled: boolean;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

const INDICATORS: { key: IndicatorKey; label: string; group: "MA" | "Volatility" }[] = [
  { key: "sma20",     label: "SMA 20",     group: "MA" },
  { key: "sma50",     label: "SMA 50",     group: "MA" },
  { key: "sma200",    label: "SMA 200",    group: "MA" },
  { key: "ema20",     label: "EMA 20",     group: "MA" },
  { key: "ema50",     label: "EMA 50",     group: "MA" },
  { key: "bollinger", label: "Bollinger",  group: "Volatility" },
];

export function ChartToolbar({
  timeframe, onTimeframe,
  chartType, onChartType,
  showVolume, onToggleVolume,
  indicators, onToggleIndicator,
  candleDisabled,
  isFullscreen, onToggleFullscreen,
}: ChartToolbarProps) {
  const [indMenuOpen, setIndMenuOpen] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.025] p-2">
      {/* Timeframe sekmeleri */}
      <div className="flex items-center gap-0.5 rounded-xl border border-white/8 bg-white/[0.02] p-0.5">
        {ALL_TIMEFRAMES.map(tf => (
          <button
            key={tf}
            onClick={() => onTimeframe(tf)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              timeframe === tf
                ? "bg-emerald-300/15 text-emerald-100"
                : "text-mist/55 hover:bg-white/[0.04] hover:text-white"
            }`}
          >
            {TIMEFRAME_LABELS[tf]}
          </button>
        ))}
      </div>

      <span className="hidden h-6 w-px bg-white/8 sm:inline-block" />

      {/* Chart type */}
      <div className="flex items-center gap-0.5 rounded-xl border border-white/8 bg-white/[0.02] p-0.5">
        <ChartTypeButton
          active={chartType === "candle"}
          onClick={() => onChartType("candle")}
          disabled={candleDisabled}
          icon={<CandlestickChart className="h-3.5 w-3.5" />}
          label="Mum"
        />
        <ChartTypeButton
          active={chartType === "line"}
          onClick={() => onChartType("line")}
          icon={<LineChart className="h-3.5 w-3.5" />}
          label="Çizgi"
        />
        <ChartTypeButton
          active={chartType === "area"}
          onClick={() => onChartType("area")}
          icon={<AreaChart className="h-3.5 w-3.5" />}
          label="Alan"
        />
      </div>

      <span className="hidden h-6 w-px bg-white/8 sm:inline-block" />

      {/* Volume toggle */}
      <button
        onClick={onToggleVolume}
        disabled={candleDisabled}
        aria-pressed={showVolume}
        className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
          candleDisabled
            ? "border-white/4 bg-white/[0.01] text-mist/25 cursor-not-allowed"
            : showVolume
              ? "border-emerald-300/35 bg-emerald-300/12 text-emerald-100"
              : "border-white/8 bg-white/[0.02] text-mist/55 hover:bg-white/[0.05] hover:text-white"
        }`}
      >
        <BarChart3 className="h-3.5 w-3.5" />
        Volume
      </button>

      {/* Indicators menu */}
      <div className="relative">
        <button
          onClick={() => setIndMenuOpen(o => !o)}
          aria-expanded={indMenuOpen}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
            indicators.length > 0
              ? "border-cyan-300/35 bg-cyan-300/12 text-cyan-100"
              : "border-white/8 bg-white/[0.02] text-mist/55 hover:bg-white/[0.05] hover:text-white"
          }`}
        >
          <TrendingUp className="h-3.5 w-3.5" />
          Göstergeler
          {indicators.length > 0 && (
            <span className="ml-0.5 rounded-md bg-cyan-300/20 px-1.5 py-0.5 text-[10px] font-bold leading-none">
              {indicators.length}
            </span>
          )}
          <ChevronDown className={`h-3 w-3 transition-transform ${indMenuOpen ? "rotate-180" : ""}`} />
        </button>

        {indMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={() => setIndMenuOpen(false)}
              aria-hidden
            />
            <div className="absolute right-0 top-full z-40 mt-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-ink/95 shadow-xl backdrop-blur-md">
              <div className="border-b border-white/8 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-mist/40">
                Hareketli Ortalama
              </div>
              {INDICATORS.filter(i => i.group === "MA").map(i => (
                <IndicatorRow
                  key={i.key}
                  label={i.label}
                  active={indicators.includes(i.key)}
                  onClick={() => onToggleIndicator(i.key)}
                />
              ))}
              <div className="border-y border-white/8 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-mist/40">
                Volatilite
              </div>
              {INDICATORS.filter(i => i.group === "Volatility").map(i => (
                <IndicatorRow
                  key={i.key}
                  label={i.label}
                  active={indicators.includes(i.key)}
                  onClick={() => onToggleIndicator(i.key)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Fullscreen */}
      <button
        onClick={onToggleFullscreen}
        aria-label={isFullscreen ? "Tam ekrandan çık" : "Tam ekran"}
        className="ml-auto rounded-xl border border-white/8 bg-white/[0.02] p-2 text-mist/55 transition hover:bg-white/[0.05] hover:text-white"
      >
        {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

function ChartTypeButton({
  active, onClick, disabled, icon, label,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      title={disabled ? `${label} bu varlık için desteklenmiyor` : label}
      className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
        disabled
          ? "text-mist/25 cursor-not-allowed"
          : active
            ? "bg-emerald-300/15 text-emerald-100"
            : "text-mist/55 hover:bg-white/[0.04] hover:text-white"
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function IndicatorRow({
  label, active, onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between px-3 py-2 text-xs font-medium text-mist/70 transition hover:bg-white/[0.04] hover:text-white"
    >
      {label}
      <span
        className={`h-3.5 w-3.5 rounded border ${
          active
            ? "border-emerald-300 bg-emerald-300/20"
            : "border-white/15 bg-transparent"
        }`}
      >
        {active && (
          <svg className="h-full w-full text-emerald-300" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6L5 8.5L9.5 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
    </button>
  );
}

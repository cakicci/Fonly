import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ChartType, IndicatorKey, Timeframe } from "@/types/chart";

/**
 * Chart kullanıcı tercihleri — sayfa değişimlerinde korunur.
 * localStorage'a "fonly-chart" anahtarıyla persist edilir.
 *
 * Watchlist'i ayrı tutuyoruz çünkü o DB-tabanlı; burada sadece UI tercihleri.
 */
interface ChartStore {
  timeframe:    Timeframe;
  chartType:    ChartType;
  indicators:   IndicatorKey[];
  showVolume:   boolean;
  /** Drawer açık mı? (sayfa state'i, persist edilmez) */
  drawerOpen:   boolean;

  setTimeframe:   (tf: Timeframe) => void;
  setChartType:   (t: ChartType) => void;
  toggleIndicator: (k: IndicatorKey) => void;
  clearIndicators: () => void;
  setShowVolume:  (v: boolean) => void;
  setDrawerOpen:  (open: boolean) => void;
}

export const useChartStore = create<ChartStore>()(
  persist(
    (set) => ({
      timeframe:   "1Y",
      chartType:   "candle",
      indicators:  [],
      showVolume:  false,
      drawerOpen:  false,

      setTimeframe:    (tf) => set({ timeframe: tf }),
      setChartType:    (t)  => set({ chartType: t }),
      toggleIndicator: (k)  => set((s) => ({
        indicators: s.indicators.includes(k)
          ? s.indicators.filter((x) => x !== k)
          : [...s.indicators, k],
      })),
      clearIndicators: () => set({ indicators: [] }),
      setShowVolume:   (v) => set({ showVolume: v }),
      setDrawerOpen:   (open) => set({ drawerOpen: open }),
    }),
    {
      name:    "fonly-chart",
      storage: createJSONStorage(() => localStorage),
      // drawerOpen persist edilmez — her sayfada kapalı başlar
      partialize: (state) => ({
        timeframe:  state.timeframe,
        chartType:  state.chartType,
        indicators: state.indicators,
        showVolume: state.showVolume,
      }),
    }
  )
);

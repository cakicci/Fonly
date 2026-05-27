"use client";

import { WatchlistDrawer } from "./WatchlistDrawer";
import { useChartStore } from "@/lib/store/chartStore";

/**
 * Drawer state'ini global Zustand store'dan okuyup açar/kapatır. Her detay
 * sayfasında bir kere render edilir; AssetHeaderActions içinden açılır.
 */
export function GlobalWatchlistDrawer() {
  const open    = useChartStore((s) => s.drawerOpen);
  const setOpen = useChartStore((s) => s.setDrawerOpen);
  return <WatchlistDrawer open={open} onClose={() => setOpen(false)} />;
}

"use client";

import { create } from "zustand";

/**
 * Slug bazlı canlı fiyat cache'i. ChartSection polling'inde yazar,
 * AssetHeader (ve gelecekte başka client componentler) okur.
 *
 * Persist edilmez — process içi state.
 */
interface LivePriceState {
  /** "{type}-{code}" → { price, changePct, ts(epoch sn) }. */
  prices: Record<string, { price: number; changePct: number | null; ts: number }>;
  set: (slug: string, price: number, changePct: number | null) => void;
}

export const useLivePriceStore = create<LivePriceState>((set) => ({
  prices: {},
  set: (slug, price, changePct) =>
    set((s) => ({
      prices: {
        ...s.prices,
        [slug]: { price, changePct, ts: Math.floor(Date.now() / 1000) },
      },
    })),
}));

"use client";

import { create } from "zustand";

/**
 * Watchlist — login'li kullanıcının DB'deki takip listesinin client-side
 * cache'i. İlk mount'ta /api/watchlist'ten yüklenir, sonra add/remove
 * çağrıları optimistic update + API senkronu yapar.
 *
 * Anonim (login değil) kullanıcılarda sadece in-memory tutulur, yenileyince
 * gider — DB'ye yazma denenmez (401 alır, sessiz başarısızlık).
 */
interface WatchlistStore {
  slugs:     Set<string>;
  loaded:    boolean;
  loading:   boolean;
  /** /api/watchlist'ten yükle — auth'lu user için. İlk çağrıda yüklenir. */
  load:      () => Promise<void>;
  /** Slug ekle. API'ye POST atar, başarısızsa rollback. */
  add:       (slug: string) => Promise<boolean>;
  /** Slug çıkar. API'ye DELETE atar, başarısızsa rollback. */
  remove:    (slug: string) => Promise<boolean>;
  /** Hızlı kontrol — render path'lerde kullanılır. */
  has:       (slug: string) => boolean;
}

export const useWatchlistStore = create<WatchlistStore>((set, get) => ({
  slugs:   new Set(),
  loaded:  false,
  loading: false,

  has: (slug) => get().slugs.has(slug),

  load: async () => {
    if (get().loaded || get().loading) return;
    set({ loading: true });
    try {
      const res = await fetch("/api/watchlist", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        const items: { slug: string }[] = json.items ?? [];
        set({ slugs: new Set(items.map((i) => i.slug)), loaded: true });
      } else {
        // 401 — anonim kullanıcı, sessiz geç
        set({ loaded: true });
      }
    } catch {
      set({ loaded: true });
    } finally {
      set({ loading: false });
    }
  },

  add: async (slug) => {
    const prev = new Set(get().slugs);
    // Optimistic
    set({ slugs: new Set([...prev, slug]) });
    try {
      const res = await fetch("/api/watchlist", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ slug }),
      });
      if (!res.ok) {
        set({ slugs: prev }); // rollback
        return false;
      }
      return true;
    } catch {
      set({ slugs: prev });
      return false;
    }
  },

  remove: async (slug) => {
    const prev = new Set(get().slugs);
    const next = new Set(prev);
    next.delete(slug);
    set({ slugs: next });
    try {
      const res = await fetch(`/api/watchlist?slug=${encodeURIComponent(slug)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        set({ slugs: prev });
        return false;
      }
      return true;
    } catch {
      set({ slugs: prev });
      return false;
    }
  },
}));

"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Bell, Star } from "lucide-react";
import { useWatchlistStore } from "@/lib/store/watchlistStore";
import { useChartStore } from "@/lib/store/chartStore";
import { PriceAlertModal } from "./PriceAlertModal";

/**
 * Server detail sayfalarının üzerine yerleştirilen client-side aksiyon paneli.
 * Watchlist + Alarm + İzleme listesi drawer'ı aç.
 *
 * Anonim kullanıcıda yıldız tıklandığında "giriş yap" yönlendirmesi yapar.
 */
export function AssetHeaderActions({
  slug,
  currentPrice = 0,
  unit         = "",
  assetName,
}: {
  slug: string;
  currentPrice?: number;
  unit?: string;
  assetName: string;
}) {
  const [alertOpen, setAlertOpen] = useState(false);
  const { data: session, status } = useSession();
  const slugs   = useWatchlistStore((s) => s.slugs);
  const load    = useWatchlistStore((s) => s.load);
  const addSlug = useWatchlistStore((s) => s.add);
  const remSlug = useWatchlistStore((s) => s.remove);
  const openDrawer = useChartStore((s) => s.setDrawerOpen);
  const [busy, setBusy] = useState(false);

  // Auth'lu kullanıcıda watchlist'i yükle (idempotent)
  useEffect(() => {
    if (session?.user?.id) load();
  }, [session?.user?.id, load]);

  const inWatchlist = slugs.has(slug);

  const onStarClick = async () => {
    if (status !== "authenticated") {
      // Anonim — giriş sayfasına gönder
      window.location.href = "/login";
      return;
    }
    if (busy) return;
    setBusy(true);
    if (inWatchlist) await remSlug(slug);
    else              await addSlug(slug);
    setBusy(false);
  };

  const onAlertClick = () => {
    if (status !== "authenticated") {
      window.location.href = "/login";
      return;
    }
    setAlertOpen(true);
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={onStarClick}
          disabled={busy}
          aria-label={inWatchlist ? "İzleme listesinden çıkar" : "İzleme listesine ekle"}
          className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition disabled:opacity-50 ${
            inWatchlist
              ? "border-amber-300/35 bg-amber-300/12 text-amber-100"
              : "border-white/10 bg-white/[0.04] text-mist/65 hover:bg-white/[0.07] hover:text-white"
          }`}
        >
          <Star className={`h-3.5 w-3.5 ${inWatchlist ? "fill-amber-300" : ""}`} />
          {inWatchlist ? "İzleniyor" : "İzle"}
        </button>

        <button
          onClick={onAlertClick}
          aria-label="Fiyat alarmı kur"
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-mist/65 transition hover:bg-white/[0.07] hover:text-white"
        >
          <Bell className="h-3.5 w-3.5" />
          Alarm
        </button>

        <button
          onClick={() => openDrawer(true)}
          aria-label="İzleme listesini aç"
          className="rounded-xl border border-white/10 bg-white/[0.04] p-2 text-mist/65 transition hover:bg-white/[0.07] hover:text-white"
          title="İzleme listesini aç"
        >
          <Star className="h-3.5 w-3.5" />
        </button>
      </div>

      <PriceAlertModal
        open={alertOpen}
        onClose={() => setAlertOpen(false)}
        slug={slug}
        currentPrice={currentPrice}
        unit={unit}
        assetName={assetName}
      />
    </>
  );
}

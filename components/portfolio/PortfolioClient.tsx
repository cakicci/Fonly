"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, Trash2, TrendingUp, RefreshCw, FlaskConical, Download, Lock } from "lucide-react";
import type { Position, PortfolioSummary } from "@/lib/portfolio/aggregate";
import { assetDisplayName, assetHref, assetTypeOf, ASSET_TYPE_LABELS } from "@/lib/portfolio/asset";
import { AddLotForm } from "./AddLotForm";
import { PortfolioValueChart } from "./PortfolioValueChart";
import { SectorBreakdown } from "./SectorBreakdown";
import { UpgradeModal } from "@/components/billing/UpgradeModal";

interface Lot {
  id: number;
  slug: string;
  side: "buy" | "sell" | string;
  quantity: number;
  unitCost: number;
  boughtAt: string;
}

interface PortfolioData {
  lots: Lot[];
  positions: Position[];
  summary: PortfolioSummary;
}

function tl(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function pct(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

function pnlColor(n: number | null | undefined): string {
  if (n == null) return "text-mist-3";
  if (n > 0) return "text-emerald-300";
  if (n < 0) return "text-rose-300";
  return "text-mist-2";
}

type Mode = "real" | "demo";

export function PortfolioClient() {
  const searchParams = useSearchParams();
  const { data: session, status: authStatus } = useSession();
  const isPremium = session?.user?.isPremium === true;
  const authLoading = authStatus === "loading";
  const [mode, setMode] = useState<Mode>(() => (searchParams.get("mode") === "demo" ? "demo" : "real"));
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [clearingDemo, setClearingDemo] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  function onExportClick() {
    if (!isPremium && !authLoading) {
      setUpgradeOpen(true);
      return;
    }
    window.location.href = "/api/portfolio/export";
  }

  const load = useCallback(async (currentMode: Mode) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/portfolio${currentMode === "demo" ? "?demo=1" : ""}`, { cache: "no-store" });
      if (!res.ok) {
        setError("Portföy yüklenemedi.");
        return;
      }
      setData(await res.json());
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(mode);
  }, [load, mode]);

  async function removeLot(id: number) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/portfolio?id=${id}`, { method: "DELETE" });
      if (res.ok) await load(mode);
    } finally {
      setDeletingId(null);
    }
  }

  async function clearDemo() {
    if (!data) return;
    setClearingDemo(true);
    try {
      await Promise.all(data.lots.map((l) => fetch(`/api/portfolio?id=${l.id}`, { method: "DELETE" })));
      await load(mode);
    } finally {
      setClearingDemo(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-16 text-sm text-mist-3">
        <Loader2 className="h-4 w-4 animate-spin" /> Portföy yükleniyor…
      </div>
    );
  }

  const summary = data?.summary;
  const positions = data?.positions ?? [];
  const lots = data?.lots ?? [];
  const empty = lots.length === 0;
  const openPositions = positions.filter((p) => p.quantity > 1e-9);
  const closedPositions = positions.filter(
    (p) => p.quantity <= 1e-9 && p.realizedPnl !== 0
  );
  const hasRealized = summary != null && summary.realizedPnl !== 0;

  return (
    <div className="space-y-6">
      {/* Gerçek / Deneme mod anahtarı */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-2xl border border-line bg-white/[0.03] p-1">
          <button
            type="button"
            onClick={() => setMode("real")}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              mode === "real" ? "bg-emerald-300/15 text-emerald-100" : "text-mist-3 hover:text-mist"
            }`}
          >
            Gerçek Portföy
          </button>
          <button
            type="button"
            onClick={() => setMode("demo")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition ${
              mode === "demo" ? "bg-fuchsia-300/15 text-fuchsia-100" : "text-mist-3 hover:text-mist"
            }`}
          >
            <FlaskConical className="h-3.5 w-3.5" />
            Deneme Portföyü
          </button>
        </div>
        {mode === "demo" && !empty && (
          <button
            type="button"
            onClick={clearDemo}
            disabled={clearingDemo}
            className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white/[0.03] px-3 py-2 text-xs font-medium text-mist-2 transition hover:bg-white/[0.07] disabled:opacity-50"
          >
            {clearingDemo ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            Deneme verilerini temizle
          </button>
        )}
      </div>

      {mode === "demo" && (
        <div className="flex items-start gap-3 rounded-2xl border border-fuchsia-300/20 bg-fuchsia-300/[0.05] px-4 py-3">
          <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-fuchsia-200" />
          <p className="text-xs leading-relaxed text-mist-2">
            Bu deneme portföyü gerçek para içermez ve dashboard&apos;daki gerçek portföy özetini,
            hedeflerini veya haftalık özet e-postanı hiç etkilemez — arayüzü risk almadan öğrenmek için kullan.
          </p>
        </div>
      )}

      {error && <p className="rounded-xl bg-rose-300/10 p-3 text-sm text-rose-200">{error}</p>}

      {/* Özet */}
      {summary && !empty && (
        <section className={`grid gap-3 sm:grid-cols-2 ${hasRealized ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
          <SummaryCard label="Toplam maliyet" value={`${tl(summary.costTotal)} ₺`} />
          <SummaryCard label="Güncel değer" value={`${tl(summary.value)} ₺`} />
          <SummaryCard
            label="Kâr / Zarar"
            value={`${tl(summary.pnl)} ₺`}
            sub={pct(summary.pnlPct)}
            color={pnlColor(summary.pnl)}
          />
          {hasRealized && (
            <SummaryCard
              label="Gerçekleşen K/Z"
              value={`${tl(summary.realizedPnl)} ₺`}
              sub="satışlardan"
              color={pnlColor(summary.realizedPnl)}
            />
          )}
        </section>
      )}

      {/* Değer grafiği */}
      {!empty && <PortfolioValueChart demo={mode === "demo"} />}

      {/* Sektör dağılımı — yalnızca gerçek portföyde (hisse pozisyonu varsa) */}
      {!empty && mode === "real" && <SectorBreakdown />}

      {summary && summary.missingPrices > 0 && (
        <p className="text-xs text-amber-200/80">
          {summary.missingPrices} varlığın canlı fiyatı şu an alınamadı — özet ve değer bunları hariç tutuyor.
        </p>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-mist">Pozisyonlar</h2>
        <div className="flex items-center gap-3">
          {mode === "real" && !empty && (
            <button
              onClick={onExportClick}
              title={!isPremium && !authLoading ? "Premium özellik — yükseltmek için tıkla" : "CSV indir"}
              className="inline-flex items-center gap-1.5 text-xs text-mist-3 hover:text-mist-2"
            >
              <Download className="h-3.5 w-3.5" /> CSV indir
              {!isPremium && !authLoading && <Lock className="h-3 w-3 opacity-70" />}
            </button>
          )}
          <button
            onClick={() => load(mode)}
            className="inline-flex items-center gap-1.5 text-xs text-mist-3 hover:text-mist-2"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Yenile
          </button>
        </div>
      </div>

      {upgradeOpen && (
        <UpgradeModal feature="Portföy CSV dışa aktarma" onClose={() => setUpgradeOpen(false)} />
      )}

      {/* Pozisyonlar */}
      {empty ? (
        <div className="glass-card rounded-2xl p-10 text-center">
          <TrendingUp className="mx-auto h-8 w-8 text-emerald-300/70" />
          <p className="mt-3 text-sm text-mist-2">Henüz pozisyonun yok.</p>
          <p className="text-xs text-mist-3">Aşağıdan ilk alımını ekleyerek başla.</p>
        </div>
      ) : (
        <div className="glass-card overflow-x-auto rounded-2xl">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-mist-3">
                <th className="px-4 py-3 font-medium">Varlık</th>
                <th className="px-4 py-3 text-right font-medium">Adet</th>
                <th className="px-4 py-3 text-right font-medium">Ort. maliyet</th>
                <th className="px-4 py-3 text-right font-medium">Fiyat</th>
                <th className="px-4 py-3 text-right font-medium">Değer</th>
                <th className="px-4 py-3 text-right font-medium">K/Z</th>
              </tr>
            </thead>
            <tbody>
              {openPositions.map((p) => (
                <tr key={p.slug} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <Link href={assetHref(p.slug)} className="font-medium text-mist hover:text-emerald-200">
                      {assetDisplayName(p.slug)}
                    </Link>
                    <span className="ml-2 rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-mist-3">
                      {ASSET_TYPE_LABELS[assetTypeOf(p.slug) ?? "hisse"]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-mist-2">{tl(p.quantity)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-mist-2">{tl(p.avgCost)} ₺</td>
                  <td className="px-4 py-3 text-right tabular-nums text-mist-2">{tl(p.price)} ₺</td>
                  <td className="px-4 py-3 text-right tabular-nums text-mist">{tl(p.value)} ₺</td>
                  <td className={`px-4 py-3 text-right tabular-nums ${pnlColor(p.pnl)}`}>
                    <div>{tl(p.pnl)} ₺</div>
                    <div className="text-xs">{pct(p.pnlPct)}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Kapanan pozisyonlar — gerçekleşen K/Z */}
      {closedPositions.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-mist">Kapanan pozisyonlar</h2>
          <div className="space-y-2">
            {closedPositions.map((p) => (
              <div
                key={p.slug}
                className="flex items-center justify-between rounded-xl border border-line bg-white/[0.02] px-4 py-2.5 text-sm"
              >
                <Link href={assetHref(p.slug)} className="font-medium text-mist hover:text-emerald-200">
                  {assetDisplayName(p.slug)}
                </Link>
                <span className={`tabular-nums ${pnlColor(p.realizedPnl)}`}>
                  {p.realizedPnl > 0 ? "+" : ""}{tl(p.realizedPnl)} ₺ gerçekleşen
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* İşlem ekle */}
      <AddLotForm
        onAdded={() => load(mode)}
        openPositions={mode === "real" ? openPositions : []}
        portfolioValue={mode === "real" ? (summary?.value ?? 0) : 0}
        isDemo={mode === "demo"}
      />

      {/* İşlem kayıtları */}
      {!empty && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-mist">İşlem kayıtları</h2>
          <div className="space-y-2">
            {lots.map((lot) => (
              <div
                key={lot.id}
                className="flex items-center justify-between rounded-xl border border-line bg-white/[0.02] px-4 py-2.5 text-sm"
              >
                <div className="min-w-0">
                  <span
                    className={`mr-2 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                      lot.side === "sell"
                        ? "bg-rose-300/12 text-rose-200"
                        : "bg-emerald-300/12 text-emerald-200"
                    }`}
                  >
                    {lot.side === "sell" ? "Satış" : "Alış"}
                  </span>
                  <span className="font-medium text-mist">{assetDisplayName(lot.slug)}</span>
                  <span className="ml-2 text-mist-3">
                    {tl(lot.quantity)} × {tl(lot.unitCost)} ₺
                  </span>
                  <span className="ml-2 text-xs text-mist-3">
                    {new Date(lot.boughtAt).toLocaleDateString("tr-TR")}
                  </span>
                </div>
                <button
                  onClick={() => removeLot(lot.id)}
                  disabled={deletingId === lot.id}
                  aria-label="Sil"
                  className="ml-3 shrink-0 rounded-lg p-1.5 text-mist-3 transition hover:bg-rose-300/10 hover:text-rose-300 disabled:opacity-50"
                >
                  {deletingId === lot.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="glass-card rounded-2xl p-4">
      <p className="text-xs text-mist-3">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${color ?? "text-mist"}`}>{value}</p>
      {sub && <p className={`text-xs ${color ?? "text-mist-3"}`}>{sub}</p>}
    </div>
  );
}

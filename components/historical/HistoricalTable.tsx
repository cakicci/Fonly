"use client";

import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import type { Candle, OhlcResponse, Timeframe } from "@/types/chart";

interface Props {
  slug:       string;
  /** Şirket / varlık adı — CSV dosya adında kullanılır. */
  assetName?: string;
}

const TF_TABS: { key: Timeframe; label: string }[] = [
  { key: "1A",  label: "1 Ay"  },
  { key: "3A",  label: "3 Ay"  },
  { key: "1Y",  label: "1 Yıl" },
  { key: "5Y",  label: "5 Yıl" },
  { key: "MAX", label: "Tümü"  },
];

const PAGE_SIZE = 50;

function fmtPrice(n: number): string {
  return n.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtVolume(n: number): string {
  if (n === 0) return "—";
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `${(abs / 1_000_000_000).toFixed(2)} Mr`;
  if (abs >= 1_000_000)     return `${(abs / 1_000_000).toFixed(2)} Mn`;
  if (abs >= 1_000)         return `${(abs / 1_000).toFixed(1)} B`;
  return n.toLocaleString("tr-TR");
}

function fmtDate(epoch: number): string {
  const d = new Date(epoch * 1000);
  const day   = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}.${month}.${d.getFullYear()}`;
}

function changeForRow(curr: Candle, prev: Candle | undefined): number | null {
  if (!prev || prev.close <= 0) return null;
  return ((curr.close - prev.close) / prev.close) * 100;
}

function toCsv(candles: Candle[]): string {
  const header = "Tarih,Acilis,Yuksek,Dusuk,Kapanis,Hacim";
  const rows = candles.map(c => {
    const d = new Date(c.time * 1000).toISOString().slice(0, 10);
    return [d, c.open, c.high, c.low, c.close, c.volume].join(",");
  });
  return [header, ...rows].join("\n");
}

export function HistoricalTable({ slug, assetName }: Props) {
  const [tf, setTf]           = useState<Timeframe>("1Y");
  const [resp, setResp]       = useState<OhlcResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [page, setPage]       = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setPage(0);

    fetch(`/api/ohlc/${slug}?tf=${tf}`, { cache: "no-store" })
      .then(async r => {
        if (!r.ok) throw new Error("not ok");
        return (await r.json()) as OhlcResponse;
      })
      .then(j  => { if (!cancelled) setResp(j); })
      .catch(()=> { if (!cancelled) setError("Veri yüklenemedi"); })
      .finally(()=>{ if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [slug, tf]);

  // Tarihler en yeniden eskiye
  const candlesDesc = useMemo(() => {
    if (!resp) return [];
    return [...resp.candles].sort((a, b) => b.time - a.time);
  }, [resp]);

  const totalPages = Math.max(1, Math.ceil(candlesDesc.length / PAGE_SIZE));
  const pageRows   = candlesDesc.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const downloadCsv = () => {
    if (!resp) return;
    // CSV en yeniden eskiye sıralı versiyonda — kullanıcının tabloda gördüğüyle uyumlu
    const csv  = toCsv(candlesDesc);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    const safe = (assetName ?? slug).replace(/[^a-z0-9\-]/gi, "_");
    a.download = `${safe}_${tf}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="overflow-x-auto" aria-label="Zaman dilimi">
          <div className="inline-flex gap-1 rounded-2xl border border-white/8 bg-white/[0.025] p-1">
            {TF_TABS.map(t => {
              const active = t.key === tf;
              return (
                <button
                  key={t.key}
                  onClick={() => setTf(t.key)}
                  className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                    active
                      ? "bg-emerald-300/15 text-emerald-100"
                      : "text-mist-3 hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </nav>

        <button
          onClick={downloadCsv}
          disabled={!resp || candlesDesc.length === 0}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/8 bg-white/[0.02] px-3 py-1.5 text-xs font-medium text-mist-2 transition hover:bg-white/[0.05] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download className="h-3.5 w-3.5" />
          CSV İndir
        </button>
      </div>

      {/* İçerik */}
      {loading ? (
        <div className="glass-card flex h-64 items-center justify-center rounded-2xl">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-emerald-300/30 border-t-emerald-300" />
        </div>
      ) : error ? (
        <div className="glass-card rounded-2xl p-6 text-center text-sm text-rose-200">{error}</div>
      ) : candlesDesc.length === 0 ? (
        <div className="glass-card rounded-2xl p-6 text-center text-sm text-mist-3">Bu dönem için veri yok.</div>
      ) : (
        <div className="glass-card rounded-2xl p-5">
          <div className="mb-3 text-xs text-mist-3">
            Toplam {candlesDesc.length} kayıt · Sayfa {page + 1} / {totalPages}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-mist-3">
                  <th className="pb-3 pr-4 font-medium">Tarih</th>
                  <th className="pb-3 pr-4 font-medium text-right">Açılış</th>
                  <th className="pb-3 pr-4 font-medium text-right">Yüksek</th>
                  <th className="pb-3 pr-4 font-medium text-right">Düşük</th>
                  <th className="pb-3 pr-4 font-medium text-right">Kapanış</th>
                  <th className="pb-3 pr-4 font-medium text-right">Değ. %</th>
                  <th className="pb-3 font-medium text-right">Hacim</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {pageRows.map((c, i) => {
                  const prev = candlesDesc[page * PAGE_SIZE + i + 1]; // bir sonraki (eski) gün
                  const ch   = changeForRow(c, prev);
                  const tone = ch == null ? "text-mist-3" : ch > 0 ? "text-emerald-300" : ch < 0 ? "text-rose-300" : "text-mist-3";
                  return (
                    <tr key={c.time}>
                      <td className="py-2 pr-4 whitespace-nowrap text-mist-2">{fmtDate(c.time)}</td>
                      <td className="py-2 pr-4 text-right tabular-nums text-mist-2">{fmtPrice(c.open)}</td>
                      <td className="py-2 pr-4 text-right tabular-nums text-mist-2">{fmtPrice(c.high)}</td>
                      <td className="py-2 pr-4 text-right tabular-nums text-mist-2">{fmtPrice(c.low)}</td>
                      <td className="py-2 pr-4 text-right tabular-nums font-medium text-white">{fmtPrice(c.close)}</td>
                      <td className={`py-2 pr-4 text-right tabular-nums ${tone}`}>
                        {ch == null ? "—" : `${ch > 0 ? "+" : ""}${ch.toFixed(2)}%`}
                      </td>
                      <td className="py-2 text-right tabular-nums text-mist-3">{fmtVolume(c.volume)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-xs">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded-lg border border-white/8 bg-white/[0.02] px-3 py-1.5 text-mist-2 transition hover:bg-white/[0.05] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Önceki
              </button>
              <span className="text-mist-3">{page + 1} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="rounded-lg border border-white/8 bg-white/[0.02] px-3 py-1.5 text-mist-2 transition hover:bg-white/[0.05] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Sonraki →
              </button>
            </div>
          )}
        </div>
      )}

      <p className="text-[11px] text-mist-3">
        Veri kaynağı: Yahoo Finance. Yaklaşık 15dk gecikmeli olabilir. Hacim
        forex/altın türlerinde her zaman raporlanmaz.
      </p>
    </div>
  );
}

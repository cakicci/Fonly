"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { TrendingDown, TrendingUp, Minus, Lock, LineChart } from "lucide-react";
import {
  computeTechnicalSummary,
  SIGNAL_LABEL,
  VERDICT_LABEL,
} from "@/lib/chart/technical";
import { UpgradeModal } from "@/components/billing/UpgradeModal";
import { TechnicalAISummary } from "./TechnicalAISummary";
import { TermTooltip } from "@/components/TermTooltip";
import { glossaryKeyForIndicatorLabel } from "@/data/glossary";
import type {
  OhlcResponse,
  TechnicalSignal,
  TechnicalSummary,
  Timeframe,
} from "@/types/chart";

interface TechnicalSectionProps {
  slug:       string;
  /** Varsayılan timeframe. */
  defaultTf?: Timeframe;
}

interface TfTab {
  key:      Timeframe;
  label:    string;
  /** Bu timeframe premium aboneliğe kilitli mi? */
  premium?: boolean;
}

const TF_TABS: TfTab[] = [
  { key: "1dk",  label: "1 Dakika",   premium: true },
  { key: "5dk",  label: "5 Dakika",   premium: true },
  { key: "15dk", label: "15 Dakika",  premium: true },
  { key: "30dk", label: "30 Dakika",  premium: true },
  { key: "1S",   label: "Saatlik"   },
  { key: "5S",   label: "5 Saatlik" },
  { key: "1D",   label: "Günlük"    },
  { key: "1W",   label: "Haftalık"  },
  { key: "1Mo",  label: "Aylık"     },
];

// Ton, glass-tint-* varyantlarıyla verilir — glass-card üzerinde bg-/ring-
// utility'leri render olmaz (MASTER: Gölge & Efekt, bilinen sınır).
const VERDICT_TONE: Record<TechnicalSummary["verdict"],
  { tint: string; text: string }> = {
  strong_buy:  { tint: "glass-tint-positive", text: "text-emerald-100" },
  buy:         { tint: "glass-tint-positive", text: "text-emerald-200" },
  neutral:     { tint: "glass-tint-neutral",  text: "text-amber-100"   },
  sell:        { tint: "glass-tint-negative", text: "text-rose-200"    },
  strong_sell: { tint: "glass-tint-negative", text: "text-rose-100"    },
};

const SIGNAL_TONE: Record<TechnicalSignal, string> = {
  buy:     "text-emerald-300 bg-emerald-300/10",
  sell:    "text-rose-300 bg-rose-300/10",
  neutral: "text-amber-200 bg-amber-200/8",
};

export function TechnicalSection({
  slug,
  defaultTf = "1D",
}: TechnicalSectionProps) {
  const { data: session, status: authStatus } = useSession();
  const isPremium = session?.user?.isPremium === true;
  const authLoading = authStatus === "loading";
  const anon = authStatus === "unauthenticated";

  const [tf, setTf]                   = useState<Timeframe>(defaultTf);
  const [resp, setResp]               = useState<OhlcResponse | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  // Fonlar gibi line-only varlıklarda intraday tab'larını gizle
  // (TEFAS yalnızca günlük NAV verir → sub-day tab'lar anlamsız)
  const isLineOnly = resp?.isLineOnly === true;
  const visibleTabs = useMemo(() => {
    if (!isLineOnly) return TF_TABS;
    const dailyOrLonger: Timeframe[] = ["1D", "1W", "1Mo"];
    return TF_TABS.filter(t => dailyOrLonger.includes(t.key));
  }, [isLineOnly]);

  useEffect(() => {
    // Teknik analiz girişe kilitli — anonim kullanıcı için veri çekmeye gerek yok.
    if (authLoading || anon) { setLoading(authLoading); return; }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/ohlc/${slug}?tf=${tf}`, { cache: "no-store" })
      .then(async r => {
        if (!r.ok) throw new Error("not ok");
        return (await r.json()) as OhlcResponse;
      })
      .then(json => { if (!cancelled) setResp(json); })
      .catch(()  => { if (!cancelled) setError("Veri yüklenemedi"); })
      .finally(()=> { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [slug, tf, authLoading, anon]);

  const summary = useMemo(() => {
    if (!resp) return null;
    return computeTechnicalSummary(resp.candles, tf);
  }, [resp, tf]);

  const onTabClick = (tab: TfTab) => {
    // Premium tab + free/anon kullanıcı → modal aç, timeframe'i değiştirme
    if (tab.premium && !isPremium && !authLoading) {
      setUpgradeOpen(true);
      return;
    }
    setTf(tab.key);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* AI Teknik Özet — premium kullanıcı için drawer, free için upgrade modal */}
      <TechnicalAISummary
        slug={slug}
        assetName={resp?.name ?? ""}
        timeframe={tf}
        summary={summary}
      />

      {anon ? (
        <TechnicalLoginGate />
      ) : (
        <>
          {/* Timeframe sekmeleri */}
          <nav className="overflow-x-auto" aria-label="Zaman dilimi">
            <div className="inline-flex min-w-full gap-1 rounded-2xl border border-line bg-white/[0.025] p-1">
              {visibleTabs.map(tab => {
                const active = tab.key === tf;
                const locked = tab.premium === true && !isPremium && !authLoading;
                return (
                  <button
                    key={tab.key}
                    onClick={() => onTabClick(tab)}
                    title={locked ? "Premium özellik — yükseltmek için tıkla" : tab.label}
                    className={`group inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                      active
                        ? "bg-emerald-300/15 text-emerald-100"
                        : locked
                          ? "text-mist-3 hover:bg-fuchsia-300/8 hover:text-fuchsia-200"
                          : "text-mist-3 hover:bg-white/[0.04] hover:text-mist"
                    }`}
                  >
                    <span>{tab.label}</span>
                    {locked && <Lock className="h-3 w-3 opacity-70 group-hover:opacity-100" />}
                  </button>
                );
              })}
            </div>
          </nav>

          {loading ? (
            <div className="flex h-64 items-center justify-center rounded-2xl border border-line bg-white/[0.02]">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-emerald-300/30 border-t-emerald-300" />
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-300/20 bg-rose-300/[0.04] p-6 text-center text-sm text-rose-200">
              {error}
            </div>
          ) : summary && summary.totals.buy + summary.totals.sell + summary.totals.neutral > 0 ? (
            <>
              <VerdictCard summary={summary} />
              <div className="grid gap-4 lg:grid-cols-2">
                <MovingAveragesCard summary={summary} />
                <IndicatorsCard     summary={summary} />
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-line bg-white/[0.02] p-6 text-center text-sm text-mist-3">
              Bu zaman dilimi için yeterli veri yok. Daha uzun bir aralık seçmeyi deneyin.
            </div>
          )}

          <p className="text-[11px] leading-relaxed text-mist-3">
            Teknik özet otomatik kurallarla üretilir ve yatırım tavsiyesi değildir.
            Hareketli ortalamalar (SMA & EMA: 5/10/20/50/100/200) ve klasik göstergeler
            (RSI, MACD, Stoch, Williams %R, CCI, ADX, Bollinger) sinyallerinin sayımına
            dayanır. ATR yalnızca oynaklık göstergesidir, karara dahil edilmez.
          </p>
        </>
      )}

      {upgradeOpen && (
        <UpgradeModal
          feature="Kısa vadeli teknik analiz"
          onClose={() => setUpgradeOpen(false)}
        />
      )}
    </div>
  );
}

// ── Anonim kullanıcı için giriş kilidi ────────────────────────────────────────

function TechnicalLoginGate() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-white/[0.02] p-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-300/12 text-emerald-200">
        <LineChart className="h-5 w-5" />
      </div>
      <h3 className="text-base font-semibold text-mist">Teknik analiz için giriş yap</h3>
      <p className="max-w-sm text-sm leading-6 text-mist-3">
        Hareketli ortalamalar, RSI, MACD ve diğer göstergelere dayalı teknik özet
        yalnızca giriş yapmış kullanıcılara açık. Grafik ve fiyat verisi herkese açık kalır.
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
        <Link href="/login" className="btn btn-sm btn-primary">
          <Lock className="h-3.5 w-3.5" />
          Giriş Yap
        </Link>
        <Link href="/register" className="btn btn-sm btn-secondary">
          Ücretsiz Kayıt Ol
        </Link>
      </div>
    </div>
  );
}

// ── Genel verdict kartı ───────────────────────────────────────────────────────

function VerdictCard({ summary }: { summary: TechnicalSummary }) {
  const tone = VERDICT_TONE[summary.verdict];
  const { buy, sell, neutral } = summary.totals;
  const total = buy + sell + neutral;

  return (
    <div className={`glass-card ${tone.tint} rounded-2xl p-6`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-mist-3">
            Genel Teknik Görünüm
          </p>
          <p className={`mt-1 text-3xl font-semibold ${tone.text}`}>
            {VERDICT_LABEL[summary.verdict]}
          </p>
          <p className="mt-1 text-xs text-mist-3">
            {total} göstergeye dayalı
          </p>
        </div>

        <div className="flex gap-2 sm:gap-3">
          <SignalBox count={buy}     label="Al"   tone="buy" />
          <SignalBox count={neutral} label="Nötr" tone="neutral" />
          <SignalBox count={sell}    label="Sat"  tone="sell" />
        </div>
      </div>
    </div>
  );
}

function SignalBox({
  count, label, tone,
}: {
  count: number;
  label: string;
  tone: TechnicalSignal;
}) {
  return (
    <div className={`rounded-xl px-4 py-2.5 text-center ${SIGNAL_TONE[tone]}`}>
      <p className="text-xl font-semibold">{count}</p>
      <p className="text-[10px] uppercase tracking-wider opacity-80">{label}</p>
    </div>
  );
}

// ── Hareketli Ortalamalar tablosu ────────────────────────────────────────────

function MovingAveragesCard({ summary }: { summary: TechnicalSummary }) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-mist">Hareketli Ortalamalar</h3>
        <SignalSummaryPill rows={summary.ma.flatMap(r => [r.smaSignal, r.emaSignal])} />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-mist-3">
              <th className="pb-2 font-medium">Periyod</th>
              <th className="pb-2 font-medium">SMA</th>
              <th className="pb-2 font-medium text-right">Sinyal</th>
              <th className="pb-2 font-medium">EMA</th>
              <th className="pb-2 font-medium text-right">Sinyal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {summary.ma.map(row => (
              <tr key={row.period}>
                <td className="py-2 text-mist-3">
                  <TermTooltip term="ma">MA{row.period}</TermTooltip>
                </td>
                <td className="py-2 tabular-nums text-mist-2">{row.smaValue}</td>
                <td className="py-2 text-right">
                  <SignalChip signal={row.smaSignal} />
                </td>
                <td className="py-2 tabular-nums text-mist-2">{row.emaValue}</td>
                <td className="py-2 text-right">
                  <SignalChip signal={row.emaSignal} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Teknik Göstergeler tablosu ────────────────────────────────────────────────

function IndicatorsCard({ summary }: { summary: TechnicalSummary }) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-mist">Teknik Göstergeler</h3>
        <SignalSummaryPill
          rows={summary.indicators
            .filter(i => !i.name.startsWith("ATR"))
            .map(i => i.signal)}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-mist-3">
              <th className="pb-2 font-medium">Gösterge</th>
              <th className="pb-2 font-medium">Değer</th>
              <th className="pb-2 font-medium text-right">Sinyal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {summary.indicators.map(ind => (
              <tr key={ind.name}>
                <td className="py-2 text-mist-3">
                  <TermTooltip term={glossaryKeyForIndicatorLabel(ind.name)}>{ind.name}</TermTooltip>
                </td>
                <td className="py-2 tabular-nums text-mist-2">{ind.value}</td>
                <td className="py-2 text-right">
                  {ind.name.startsWith("ATR") ? (
                    <span className="text-[11px] text-mist-3">—</span>
                  ) : (
                    <SignalChip signal={ind.signal} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Atomik UI parçaları ──────────────────────────────────────────────────────

function SignalChip({ signal }: { signal: TechnicalSignal | null }) {
  if (signal == null) {
    return <span className="text-[11px] text-mist-3">—</span>;
  }
  const Icon = signal === "buy" ? TrendingUp
            : signal === "sell" ? TrendingDown
            : Minus;
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ${SIGNAL_TONE[signal]}`}>
      <Icon className="h-3 w-3" />
      {SIGNAL_LABEL[signal]}
    </span>
  );
}

function SignalSummaryPill({ rows }: { rows: (TechnicalSignal | null)[] }) {
  const counts = { buy: 0, sell: 0, neutral: 0 };
  for (const r of rows) {
    if (r) counts[r]++;
  }
  return (
    <div className="flex gap-1.5 text-[10px] font-medium">
      <span className="rounded-md bg-emerald-300/10 px-2 py-0.5 text-emerald-200">
        Al: {counts.buy}
      </span>
      <span className="rounded-md bg-amber-200/8 px-2 py-0.5 text-amber-100">
        Nötr: {counts.neutral}
      </span>
      <span className="rounded-md bg-rose-300/10 px-2 py-0.5 text-rose-200">
        Sat: {counts.sell}
      </span>
    </div>
  );
}

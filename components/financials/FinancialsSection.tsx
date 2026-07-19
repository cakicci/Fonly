"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import type { FundamentalsResponse, IncomeYear, KeyStatistics } from "@/lib/yahoo/fundamentals";
import { TermTooltip } from "@/components/TermTooltip";
import type { GlossaryKey } from "@/data/glossary";

interface FinancialsSectionProps {
  data: FundamentalsResponse;
}

type TabKey = "income" | "ratios" | "balance";

const TABS: { key: TabKey; label: string }[] = [
  { key: "income",  label: "Gelir Tablosu"            },
  { key: "ratios",  label: "Anahtar Oranlar"          },
  { key: "balance", label: "Bilanço & Nakit Akışı"    },
];

// ── Formatlama yardımcıları ──────────────────────────────────────────────────

function fmtMoney(n: number | null): string {
  if (n == null) return "—";
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000_000_000) return `${sign}${(abs / 1_000_000_000_000).toFixed(2)} T₺`;
  if (abs >= 1_000_000_000)     return `${sign}${(abs / 1_000_000_000).toFixed(2)} Mr₺`;
  if (abs >= 1_000_000)         return `${sign}${(abs / 1_000_000).toFixed(2)} Mn₺`;
  return `${sign}${abs.toLocaleString("tr-TR")}`;
}

function fmtNum(n: number | null, digits = 2): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toLocaleString("tr-TR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function fmtPct(n: number | null, digits = 2): string {
  if (n == null) return "—";
  return `${(n * 100).toLocaleString("tr-TR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}%`;
}

function fmtYear(endDate: string): string {
  // "2024-12-31" → "2024"
  return endDate.split("-")[0] ?? endDate;
}

// ── Bileşen ──────────────────────────────────────────────────────────────────

export function FinancialsSection({ data }: FinancialsSectionProps) {
  const [tab, setTab] = useState<TabKey>("income");

  return (
    <div className="flex flex-col gap-4">
      <nav className="overflow-x-auto" aria-label="Finansal sekmeler">
        <div className="inline-flex min-w-full gap-1 rounded-2xl border border-line bg-white/[0.025] p-1">
          {TABS.map(t => {
            const active = t.key === tab;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                  active
                    ? "bg-emerald-300/15 text-emerald-100"
                    : "text-mist-3 hover:bg-white/[0.04] hover:text-mist"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </nav>

      {tab === "income"  && <IncomeTable     years={data.income} />}
      {tab === "ratios"  && <RatiosGrid      stats={data.stats}  />}
      {tab === "balance" && <BalanceSheetStub />}

      <p className="text-[11px] leading-relaxed text-mist-3">
        Veri kaynağı: Yahoo Finance. Tutarlar şirketin raporladığı para
        biriminde (TL) ve geçmiş döneme ait gerçekleşmelerdir. Yatırım
        tavsiyesi değildir.
      </p>
    </div>
  );
}

// ── Gelir Tablosu ────────────────────────────────────────────────────────────

interface IncomeRow {
  label: string;
  pick:  (y: IncomeYear) => number | null;
  /** Vurgulu satır (örn. Brüt Kâr, Net Kâr) — bold. */
  bold?: boolean;
}

const INCOME_ROWS: IncomeRow[] = [
  { label: "Hasılat",              pick: y => y.totalRevenue,     bold: true },
  { label: "Satışların Maliyeti",  pick: y => y.costOfRevenue                },
  { label: "Brüt Kâr",             pick: y => y.grossProfit,      bold: true },
  { label: "Faaliyet Kârı",        pick: y => y.operatingIncome              },
  { label: "EBIT",                 pick: y => y.ebit                         },
  { label: "Faiz Gideri",          pick: y => y.interestExpense              },
  { label: "Vergi Öncesi Kâr",     pick: y => y.incomeBeforeTax              },
  { label: "Vergi Gideri",         pick: y => y.incomeTaxExpense             },
  { label: "Net Kâr",              pick: y => y.netIncome,        bold: true },
];

function IncomeTable({ years }: { years: IncomeYear[] }) {
  if (years.length === 0) {
    return <EmptyState text="Bu hisse için gelir tablosu verisi bulunamadı." />;
  }
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-mist-3">
              <th className="pb-3 pr-4 font-medium">Hesap Kalemi</th>
              {years.map(y => (
                <th key={y.endDate} className="pb-3 pl-3 text-right font-medium tabular-nums">
                  {fmtYear(y.endDate)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {INCOME_ROWS.map(row => (
              <tr key={row.label}>
                <td className={`py-2.5 pr-4 ${row.bold ? "font-semibold text-mist" : "text-mist-3"}`}>
                  {row.label}
                </td>
                {years.map(y => {
                  const v = row.pick(y);
                  return (
                    <td
                      key={y.endDate}
                      className={`py-2.5 pl-3 text-right tabular-nums ${
                        row.bold ? "font-semibold text-mist" : "text-mist-2"
                      }`}
                    >
                      {fmtMoney(v)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Anahtar Oranlar ──────────────────────────────────────────────────────────

type Fmt = "money" | "num" | "pct" | "x";

interface RatioRow {
  label: string;
  value: (s: KeyStatistics) => number | null;
  fmt:   Fmt;
  /** Sözlük anahtarı — verilirse etiketin yanında (i) açıklama ikonu gösterilir. */
  term?: GlossaryKey;
}

interface RatioSection {
  title: string;
  rows:  RatioRow[];
}

const RATIO_SECTIONS: RatioSection[] = [
  {
    title: "Değerleme",
    rows: [
      { label: "Piyasa Değeri",       value: s => s.marketCap,           fmt: "money", term: "piyasaDegeri" },
      { label: "Firma Değeri (EV)",   value: s => s.enterpriseValue,     fmt: "money", term: "firmaDegeri" },
      { label: "F/K (TTM)",           value: s => s.trailingPE,          fmt: "num",   term: "fk" },
      { label: "İleri F/K",           value: s => s.forwardPE,           fmt: "num",   term: "fk" },
      { label: "PEG Oranı",           value: s => s.pegRatio,            fmt: "num",   term: "peg" },
      { label: "PD/DD",               value: s => s.priceToBook,         fmt: "num",   term: "pddd" },
      { label: "FD/Satışlar",         value: s => s.enterpriseToRevenue, fmt: "num",   term: "fdSatislar" },
      { label: "FD/FAVÖK",            value: s => s.enterpriseToEbitda,  fmt: "num",   term: "fdFavok" },
      { label: "Hisse Başı Kâr (TTM)",value: s => s.trailingEps,         fmt: "num",   term: "hisseBasiKar" },
      { label: "Defter Değeri / Hisse", value: s => s.bookValue,         fmt: "num",   term: "defterDegeri" },
      { label: "Beta",                value: s => s.beta,                fmt: "num",   term: "beta" },
    ],
  },
  {
    title: "Kârlılık & Büyüme",
    rows: [
      { label: "Brüt Marj",           value: s => s.grossMargins,        fmt: "pct",   term: "brutMarj" },
      { label: "Faaliyet Marjı",      value: s => s.operatingMargins,    fmt: "pct",   term: "faaliyetMarji" },
      { label: "Net Kâr Marjı",       value: s => s.profitMargins,       fmt: "pct",   term: "netKarMarji" },
      { label: "FAVÖK Marjı",         value: s => s.ebitdaMargins,       fmt: "pct",   term: "favokMarji" },
      { label: "Özkaynak Kârlılığı",  value: s => s.returnOnEquity,      fmt: "pct",   term: "ozkaynakKarliligi" },
      { label: "Aktif Kârlılığı",     value: s => s.returnOnAssets,      fmt: "pct",   term: "aktifKarliligi" },
      { label: "Hasılat Büyümesi (Y)",value: s => s.revenueGrowth,       fmt: "pct",   term: "hasilatBuyumesi" },
      { label: "Kâr Büyümesi (Y)",    value: s => s.earningsGrowth,      fmt: "pct",   term: "karBuyumesi" },
      { label: "Hasılat Büyümesi (Ç)",value: s => s.revenueQuarterlyGrowth,  fmt: "pct", term: "hasilatBuyumesi" },
      { label: "Kâr Büyümesi (Ç)",    value: s => s.earningsQuarterlyGrowth, fmt: "pct", term: "karBuyumesi" },
    ],
  },
  {
    title: "Bilanço & Likidite",
    rows: [
      { label: "Toplam Nakit",        value: s => s.totalCash,           fmt: "money" },
      { label: "Toplam Borç",         value: s => s.totalDebt,           fmt: "money" },
      { label: "Borç / Özkaynak",     value: s => s.debtToEquity,        fmt: "num",   term: "borcOzkaynak" },
      { label: "Cari Oran",           value: s => s.currentRatio,        fmt: "num",   term: "cariOran" },
      { label: "Asit-Test Oranı",     value: s => s.quickRatio,          fmt: "num",   term: "asitTestOrani" },
      { label: "Serbest Nakit Akışı (TTM)",   value: s => s.freeCashflow,      fmt: "money", term: "serbestNakitAkisi" },
      { label: "İşletme Nakit Akışı (TTM)",   value: s => s.operatingCashflow, fmt: "money", term: "isletmeNakitAkisi" },
      { label: "Dolaşımdaki Hisse",   value: s => s.sharesOutstanding,   fmt: "money" },
    ],
  },
  {
    title: "Temettü",
    rows: [
      { label: "Temettü Verimi",      value: s => s.dividendYield,       fmt: "pct",   term: "temettuVerimi" },
      { label: "5 Yıllık Ort. Verim", value: s => s.fiveYearAvgDividendYield, fmt: "pct", term: "temettuVerimi" },
      { label: "Dağıtım Oranı",       value: s => s.payoutRatio,         fmt: "pct",   term: "dagitimOrani" },
    ],
  },
];

function formatStat(value: number | null, fmt: Fmt): string {
  switch (fmt) {
    case "money": return fmtMoney(value);
    case "pct":   return fmtPct(value);
    case "num":
    case "x":
    default:      return fmtNum(value);
  }
}

function RatiosGrid({ stats }: { stats: KeyStatistics }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {RATIO_SECTIONS.map(sec => (
        <div key={sec.title} className="glass-card rounded-2xl p-5">
          <h3 className="mb-4 text-sm font-semibold text-mist">{sec.title}</h3>
          <dl className="space-y-2">
            {sec.rows.map(r => (
              <div
                key={r.label}
                className="flex items-baseline justify-between gap-3 border-b border-line pb-2 last:border-0 last:pb-0"
              >
                <dt className="text-sm text-mist-3">
                  <TermTooltip term={r.term}>{r.label}</TermTooltip>
                </dt>
                <dd className="text-sm font-medium tabular-nums text-mist">
                  {formatStat(r.value(stats), r.fmt)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}

// ── Bilanço & Nakit Akışı stub ───────────────────────────────────────────────

function BalanceSheetStub() {
  return (
    <div className="glass-card rounded-2xl p-8">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-amber-300/10 p-2">
          <Info className="h-4 w-4 text-amber-200" />
        </div>
        <div className="space-y-2">
          <h3 className="text-base font-semibold text-mist">
            Bilanço ve Nakit Akışı Detayı
          </h3>
          <p className="text-sm leading-6 text-mist-2">
            Yahoo Finance, Türk hisseleri için detaylı bilanço ve nakit akışı
            kalemlerini sağlamıyor — yalnızca özet veriler (toplam nakit, toplam
            borç, serbest nakit akışı vb.) ulaşılabiliyor; bu özetler{" "}
            <span className="font-medium text-mist">Anahtar Oranlar</span> sekmesinde gösteriliyor.
          </p>
          <p className="text-sm leading-6 text-mist-3">
            Tam dönen/duran varlık, kısa/uzun vadeli yükümlülük ve işletme/yatırım/finansman
            faaliyetlerinden nakit akışı kalemleri, ileride KAP entegrasyonuyla
            eklenecek.
          </p>
          <span className="inline-flex items-center rounded-full border border-line bg-white/[0.025] px-3 py-1 text-[11px] text-mist-3">
            Yol haritası: Faz 4.5 — KAP / İş Yatırım entegrasyonu
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Ortak boş durum kartı ────────────────────────────────────────────────────

function EmptyState({ text }: { text: string }) {
  return (
    <div className="glass-card rounded-2xl p-8 text-center text-sm text-mist-3">
      {text}
    </div>
  );
}

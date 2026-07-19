import { Calendar, Coins, TrendingUp } from "lucide-react";
import type { DividendPayment } from "@/lib/yahoo/events";
import { aggregateByYear, dividendCagr } from "@/lib/yahoo/events";

interface Props {
  payments: DividendPayment[];
}

function fmtAmount(n: number): string {
  return n.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

function fmtPct(n: number | null, digits = 2): string {
  if (n == null) return "—";
  return `${(n * 100).toLocaleString("tr-TR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}%`;
}

function fmtDateTr(iso: string): string {
  // "2024-12-31" → "31 Ara 2024"
  const [y, m, d] = iso.split("-").map(Number);
  const months = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
  return `${d} ${months[m - 1]} ${y}`;
}

export function DividendSection({ payments }: Props) {
  if (payments.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <p className="text-sm font-medium text-mist">Bu hisse için temettü kaydı yok</p>
        <p className="mt-1 text-xs text-mist-3">
          Yahoo Finance son 10 yıl içinde temettü ödemesi tespit etmedi.
        </p>
      </div>
    );
  }

  const yearly = aggregateByYear(payments);
  const cagr   = dividendCagr(yearly);
  const last   = payments[payments.length - 1];

  // Son tam yıl (içinde bulunduğumuz yıl hariç)
  const thisYear = new Date().getFullYear();
  const closedYears = yearly.filter(y => y.year < thisYear);
  const lastClosed  = closedYears[closedYears.length - 1];

  // En son ödeme yüzdesi (önceki yıla göre)
  let lastVsPrev: number | null = null;
  if (closedYears.length >= 2) {
    const a = closedYears[closedYears.length - 1];
    const b = closedYears[closedYears.length - 2];
    if (b.total > 0) lastVsPrev = (a.total - b.total) / b.total;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Özet kartları */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon={<Coins className="h-3.5 w-3.5" />}
          label="Son Ödeme Tutarı"
          value={`${fmtAmount(last.amount)} ₺`}
        />
        <SummaryCard
          icon={<Calendar className="h-3.5 w-3.5" />}
          label="Son Ödeme Tarihi"
          value={fmtDateTr(last.date)}
        />
        <SummaryCard
          icon={<TrendingUp className="h-3.5 w-3.5" />}
          label={`Yıllık Toplam (${lastClosed?.year ?? "—"})`}
          value={lastClosed ? `${fmtAmount(lastClosed.total)} ₺` : "—"}
          subValue={lastVsPrev != null ? `Önceki yıla göre ${fmtPct(lastVsPrev)}` : null}
          subTone={lastVsPrev != null && lastVsPrev > 0 ? "buy" : lastVsPrev != null && lastVsPrev < 0 ? "sell" : null}
        />
        <SummaryCard
          icon={<TrendingUp className="h-3.5 w-3.5" />}
          label="5 Yıllık CAGR"
          value={fmtPct(cagr)}
          subValue="Yıllık ortalama büyüme"
        />
      </div>

      {/* Yıllık özet tablo */}
      <div className="glass-card rounded-2xl p-5">
        <h3 className="mb-4 text-sm font-semibold text-mist">Yıllık Temettü</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-mist-3">
                <th className="pb-3 pr-4 font-medium">Yıl</th>
                <th className="pb-3 pr-4 font-medium text-right">Ödeme Sayısı</th>
                <th className="pb-3 font-medium text-right">Toplam (₺)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[...yearly].reverse().map(y => (
                <tr key={y.year}>
                  <td className="py-2.5 pr-4 font-medium text-mist">{y.year}</td>
                  <td className="py-2.5 pr-4 text-right tabular-nums text-mist-3">{y.count}</td>
                  <td className="py-2.5 text-right tabular-nums text-mist">{fmtAmount(y.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detaylı tablo */}
      <div className="glass-card rounded-2xl p-5">
        <h3 className="mb-4 text-sm font-semibold text-mist">Tüm Ödemeler</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-mist-3">
                <th className="pb-3 pr-4 font-medium">Tarih</th>
                <th className="pb-3 font-medium text-right">Tutar (₺/Hisse)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[...payments].reverse().map(p => (
                <tr key={p.epoch}>
                  <td className="py-2 pr-4 text-mist-2">{fmtDateTr(p.date)}</td>
                  <td className="py-2 text-right tabular-nums text-mist-2">{fmtAmount(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[11px] text-mist-3">
        Veri kaynağı: Yahoo Finance · v8 chart events. Geçmiş ödemeler, gelecekteki temettüleri garanti etmez.
      </p>
    </div>
  );
}

function SummaryCard({
  icon, label, value, subValue = null, subTone = null,
}: {
  icon:  React.ReactNode;
  label: string;
  value: string;
  subValue?: string | null;
  subTone?:  "buy" | "sell" | null;
}) {
  const subCls = subTone === "buy" ? "text-emerald-200"
              : subTone === "sell" ? "text-rose-200"
              : "text-mist-3";
  return (
    <div className="glass-card rounded-2xl p-4">
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-mist-3">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-lg font-semibold tabular-nums text-mist">{value}</p>
      {subValue && <p className={`mt-1 text-[11px] ${subCls}`}>{subValue}</p>}
    </div>
  );
}

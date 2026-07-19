import { Info, TrendingUp, Users } from "lucide-react";
import type { OwnershipBreakdown } from "@/lib/yahoo/ownership";

interface Props {
  data: OwnershipBreakdown;
}

function fmtPct(n: number | null, digits = 2): string {
  if (n == null) return "—";
  return `${(n * 100).toLocaleString("tr-TR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}%`;
}

function fmtShares(n: number | null): string {
  if (n == null) return "—";
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(2)} Mr`;
  if (abs >= 1_000_000)     return `${sign}${(abs / 1_000_000).toFixed(2)} Mn`;
  if (abs >= 1_000)         return `${sign}${(abs / 1_000).toFixed(0)} B`;
  return `${sign}${abs.toLocaleString("tr-TR")}`;
}

function fmtCount(n: number | null): string {
  if (n == null) return "—";
  return n.toLocaleString("tr-TR");
}

export function OwnershipSection({ data }: Props) {
  return (
    <div className="flex flex-col gap-4">
      {/* Kompozisyon bar */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="mb-4 text-sm font-semibold text-mist">Sahiplik Kompozisyonu</h3>
        <CompositionBar
          insiders={data.insidersPercent}
          institutions={data.institutionsPercent}
          float={data.floatPercent}
        />

        <dl className="mt-5 grid gap-3 sm:grid-cols-3">
          <CompositionLegend
            color="bg-fuchsia-300"
            label="İçeriden Sahipler"
            value={fmtPct(data.insidersPercent)}
            hint="Yönetim, ana ortak, devlet/fon vb."
          />
          <CompositionLegend
            color="bg-emerald-300"
            label="Kurumsal Yatırımcı"
            value={fmtPct(data.institutionsPercent)}
            hint="Yatırım fonları, sigorta, portföy şirketleri."
          />
          <CompositionLegend
            color="bg-cyan-300"
            label="Halka Açık Pay"
            value={fmtPct(data.floatPercent)}
            hint="Borsada serbest dolaşımdaki paylar."
          />
        </dl>
      </div>

      {/* Kurum aktivitesi */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="mb-4 text-sm font-semibold text-mist">Kurum Aktivitesi</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<Users className="h-3.5 w-3.5" />}
            label="Hissedar Kurum Sayısı"
            value={fmtCount(data.institutionsCount)}
          />
          <StatCard
            icon={<TrendingUp className="h-3.5 w-3.5" />}
            label={`Net Kurumsal Alış${data.netActivityPeriod ? ` (${data.netActivityPeriod})` : ""}`}
            value={fmtShares(data.netInstSharesBuying)}
            tone={data.netInstSharesBuying != null && data.netInstSharesBuying > 0 ? "buy" : data.netInstSharesBuying != null && data.netInstSharesBuying < 0 ? "sell" : null}
          />
          <StatCard
            icon={<TrendingUp className="h-3.5 w-3.5" />}
            label="Net Alış Oranı"
            value={fmtPct(data.netInstBuyingPercent)}
            tone={data.netInstBuyingPercent != null && data.netInstBuyingPercent > 0 ? "buy" : data.netInstBuyingPercent != null && data.netInstBuyingPercent < 0 ? "sell" : null}
          />
          <StatCard
            icon={<Users className="h-3.5 w-3.5" />}
            label="İçeriden Toplam Pay"
            value={fmtShares(data.totalInsiderShares)}
          />
        </div>
      </div>

      {/* Detaylı liste yok bilgilendirmesi */}
      <div className="glass-card flex items-start gap-3 rounded-2xl p-5">
        <div className="rounded-lg bg-amber-300/10 p-2">
          <Info className="h-4 w-4 text-amber-200" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-sm font-semibold text-mist">Detaylı kurum listesi</h3>
          <p className="text-sm leading-6 text-mist-2">
            Yahoo Finance, Türk hisselerinde tek tek kurumların ve fonların listesini
            sağlamıyor — sadece yukarıdaki toplu yüzdeler ve sayım veriliyor.
            En büyük hissedar tablosu KAP&apos;tan ortaklık yapısı bildirimlerinin
            entegrasyonuyla gelecek.
          </p>
          <span className="inline-flex items-center rounded-full border border-line bg-white/[0.025] px-3 py-1 text-[11px] text-mist-3">
            Yol haritası: Faz 6.5 — KAP ortaklık yapısı
          </span>
        </div>
      </div>

      <p className="text-[11px] text-mist-3">
        Veri kaynağı: Yahoo Finance · majorHoldersBreakdown + netSharePurchaseActivity.
      </p>
    </div>
  );
}

// ── Atomik UI ────────────────────────────────────────────────────────────────

function CompositionBar({
  insiders, institutions, float: floatPct,
}: { insiders: number | null; institutions: number | null; float: number | null }) {
  const segs = [
    { value: insiders     ?? 0, color: "bg-fuchsia-300" },
    { value: institutions ?? 0, color: "bg-emerald-300" },
    { value: floatPct     ?? 0, color: "bg-cyan-300"    },
  ];
  const total = segs.reduce((a, s) => a + s.value, 0);
  if (total === 0) return null;

  // Toplam %100'e ölçekle (Yahoo'nun yüzdeleri %100'ü geçmeyebilir — geri kalan
  // "diğer" olarak gri kalır).
  const others = Math.max(0, 1 - total);

  return (
    <div className="space-y-2">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-white/5">
        {segs.map((s, i) => (
          s.value > 0
            ? <div key={i} className={s.color} style={{ width: `${s.value * 100}%` }} />
            : null
        ))}
        {others > 0 && (
          <div className="bg-white/10" style={{ width: `${others * 100}%` }} />
        )}
      </div>
      {others > 0 && (
        <p className="text-[11px] text-mist-3">
          Diğer / kategorize edilemeyen: {(others * 100).toFixed(2)}%
        </p>
      )}
    </div>
  );
}

function CompositionLegend({
  color, label, value, hint,
}: { color: string; label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border border-line bg-white/[0.015] p-3">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${color}`} />
        <p className="text-[11px] font-medium uppercase tracking-wider text-mist-3">{label}</p>
      </div>
      <p className="mt-1 text-lg font-semibold tabular-nums text-mist">{value}</p>
      <p className="mt-1 text-[11px] leading-relaxed text-mist-3">{hint}</p>
    </div>
  );
}

function StatCard({
  icon, label, value, tone = null,
}: {
  icon:  React.ReactNode;
  label: string;
  value: string;
  tone?: "buy" | "sell" | null;
}) {
  const valueCls = tone === "buy"
    ? "text-emerald-200"
    : tone === "sell"
      ? "text-rose-200"
      : "text-mist";
  return (
    <div className="rounded-xl border border-line bg-white/[0.015] p-3">
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-mist-3">
        {icon}
        {label}
      </div>
      <p className={`mt-2 text-lg font-semibold tabular-nums ${valueCls}`}>{value}</p>
    </div>
  );
}

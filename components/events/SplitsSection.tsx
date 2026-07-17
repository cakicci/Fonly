import { GitBranch } from "lucide-react";
import type { StockSplit } from "@/lib/yahoo/events";

interface Props {
  splits: StockSplit[];
}

function fmtDateTr(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const months = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
  return `${d} ${months[m - 1]} ${y}`;
}

function describeSplit(s: StockSplit): string {
  // 2:1 → "1 hisse 2'ye bölündü"
  // 1:2 → "2 hisse 1'e birleştirildi" (reverse)
  if (s.numerator > s.denominator) {
    const multiplier = s.numerator / s.denominator;
    return `Bedelsiz / forward split — 1 pay ${multiplier.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} paya bölündü.`;
  }
  if (s.numerator < s.denominator) {
    const divisor = s.denominator / s.numerator;
    return `Ters split — ${divisor.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} pay 1 paya birleştirildi.`;
  }
  return "Tip belirsiz işlem.";
}

export function SplitsSection({ splits }: Props) {
  if (splits.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <p className="text-sm font-medium text-white">Bu hisse için kayıtlı bölünme yok</p>
        <p className="mt-1 text-xs text-mist-3">
          Yahoo Finance geçmişte stock split / bedelsiz işlemi tespit etmedi.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="glass-card rounded-2xl p-5">
        <div className="mb-4 flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-emerald-200" />
          <h3 className="text-sm font-semibold text-white">
            Bölünme Geçmişi ({splits.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-mist-3">
                <th className="pb-3 pr-4 font-medium">Tarih</th>
                <th className="pb-3 pr-4 font-medium">Oran</th>
                <th className="pb-3 font-medium">Açıklama</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[...splits].reverse().map(s => (
                <tr key={s.epoch}>
                  <td className="py-3 pr-4 whitespace-nowrap text-mist-2">{fmtDateTr(s.date)}</td>
                  <td className="py-3 pr-4 whitespace-nowrap font-medium text-white">{s.ratio}</td>
                  <td className="py-3 text-mist-3">{describeSplit(s)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[11px] text-mist-3">
        Veri kaynağı: Yahoo Finance · v8 chart events. Bölünme tarihleri kayıt tarihidir, dağıtım tarihi farklı olabilir.
      </p>
    </div>
  );
}

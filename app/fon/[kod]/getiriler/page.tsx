import { notFound } from "next/navigation";
import { fetchAllFundReturns } from "@/lib/tefas";

type Params = { kod: string };

function fmtPct(v: number | null | undefined): string {
  if (v == null) return "—";
  const sign = v >= 0 ? "+" : "";
  return `${sign}${v.toFixed(2)}%`;
}

export default async function FonGetirilerPage({ params }: { params: Params }) {
  const kod = params.kod.toUpperCase();
  const all = await fetchAllFundReturns("YAT").catch(() => []);
  const row = all.find(r => r.fonKodu === kod);
  if (!row) notFound();

  const periods: Array<{ label: string; description: string; value: number | null }> = [
    { label: "1 Ay",   description: "Son 1 ay",                   value: row.getiri1a ?? null },
    { label: "3 Ay",   description: "Son 3 ay",                   value: row.getiri3a ?? null },
    { label: "6 Ay",   description: "Son 6 ay",                   value: row.getiri6a ?? null },
    { label: "YBI",    description: "Yıl başından itibaren",      value: row.getiriyb ?? null },
    { label: "1 Yıl",  description: "Son 12 ay",                  value: row.getiri1y ?? null },
    { label: "3 Yıl",  description: "Son 36 ay (toplam)",         value: row.getiri3y ?? null },
    { label: "5 Yıl",  description: "Son 60 ay (toplam)",         value: row.getiri5y ?? null },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="glass-card rounded-2xl p-5">
        <h3 className="mb-4 text-sm font-semibold text-mist">Dönem Bazlı Getiri</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-mist-3">
                <th className="pb-3 pr-4 font-medium">Dönem</th>
                <th className="pb-3 pr-4 font-medium">Açıklama</th>
                <th className="pb-3 font-medium text-right">Getiri</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {periods.map(p => {
                const tone = p.value == null
                  ? "text-mist-3"
                  : p.value >= 0
                    ? "text-emerald-300"
                    : "text-rose-300";
                return (
                  <tr key={p.label}>
                    <td className="py-2.5 pr-4 font-medium text-mist">{p.label}</td>
                    <td className="py-2.5 pr-4 text-mist-3">{p.description}</td>
                    <td className={`py-2.5 text-right tabular-nums font-semibold ${tone}`}>
                      {fmtPct(p.value)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[11px] leading-relaxed text-mist-3">
        Veri kaynağı: TEFAS · fonGetiriBazliBilgiGetir. Getiriler nominal TL bazındadır; enflasyondan arındırılmamıştır.
        3 ve 5 yıllık değerler kümülatif (yıllıklandırılmamış) getiridir.
      </p>
    </div>
  );
}

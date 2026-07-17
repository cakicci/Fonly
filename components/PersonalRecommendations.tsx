import Link from "next/link";
import { Layers3, Shield, TrendingUp, Waves, ArrowUpRight } from "lucide-react";

export interface RecommendedFund {
  kod: string;
  ad: string;
  getiri1y: number;
}

const recommendations: Record<
  string,
  {
    title: string;
    description: string;
    funds: { name: string; reason: string }[];
    tip: string;
    icon: React.ElementType;
    color: string;
  }
> = {
  low: {
    title: "Düşük riskli seçenekler sana daha uygun",
    description:
      "Büyük iniş çıkışlardan uzak durmak istiyorsun. Para piyasası fonları ve sabit getirili ürünler başlangıç için daha sakin bir yol sunar.",
    funds: [
      { name: "Para Piyasası Fonu", reason: "Günlük dalgalanması azdır, kısa vadeli birikim için uygundur." },
      { name: "Tahvil & Bono Fonu", reason: "Düzenli getiri hedefler, fiyat hareketi daha öngörülüdür." },
      { name: "Altın Fonu", reason: "Enflasyona karşı koruma sağlar, uzun vadede değer korur." }
    ],
    tip: "Yatırıma başlamadan önce en az 3 aylık giderin kadar acil durum birikimini tamamla.",
    icon: Shield,
    color: "text-cyan-200"
  },
  medium: {
    title: "Dengeli bir yaklaşım sana uygun",
    description:
      "Biraz dalgalanmayı kabul ediyorsun ama tüm paranı tek yere koymak istemiyorsun. Karma fonlar iyi bir başlangıç noktasıdır.",
    funds: [
      { name: "Dengeli Karma Fon", reason: "Hisse ve tahvili birlikte taşır, riski dağıtır." },
      { name: "Teknoloji Büyüme Fonu", reason: "Büyüme potansiyeli yüksek, ama sabır ister." },
      { name: "Borsa Endeks Fonu", reason: "Tek tek hisse seçmek yerine piyasanın genelini takip eder." }
    ],
    tip: "Portföyünü çeşitlendir. Tüm parayı tek bir fon ya da hisseye yatırmaktan kaçın.",
    icon: Layers3,
    color: "text-emerald-200"
  },
  high: {
    title: "Büyüme odaklı seçenekler sana uygun",
    description:
      "Düşüşlerde paniğe kapılmadan bekleyebiliyorsun. Büyüme potansiyeli yüksek ama dalgalanması fazla seçenekler uzun vadede fırsat sunabilir.",
    funds: [
      { name: "Teknoloji Büyüme Fonu", reason: "Yüksek potansiyel, yüksek dalgalanma. Sabır gerektirir." },
      { name: "Küresel Hisse Fonu", reason: "Yurt dışı büyüme hikayelerine ortak olur." },
      { name: "Bireysel Hisse (BIST)", reason: "Araştırarak seçilmiş hisseler yüksek getiri sağlayabilir." }
    ],
    tip: "Yüksek risk yüksek getiri demek değildir. Kısa vadeli düşüşlere hazırlıklı ol.",
    icon: Waves,
    color: "text-amber-200"
  }
};

interface PersonalRecommendationsProps {
  riskProfile: "low" | "medium" | "high";
  /** TEFAS'tan risk profiline uygun gerçek fonlar (1y getiriye göre). Boşsa statik kategoriler gösterilir. */
  liveFunds?: RecommendedFund[];
}

export function PersonalRecommendations({ riskProfile, liveFunds = [] }: PersonalRecommendationsProps) {
  const rec = recommendations[riskProfile];
  const Icon = rec.icon;
  const hasLive = liveFunds.length > 0;

  return (
    <div className="rounded-section border border-white/8 bg-white/[0.025] p-5 sm:p-6">
      <div className="mb-6 flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/8">
          <Icon className={`h-5 w-5 ${rec.color}`} />
        </div>
        <div>
          <p className="text-sm font-medium text-emerald-200">Kişisel öneriler</p>
          <h2 className="mt-1 text-xl font-semibold text-white sm:text-2xl">{rec.title}</h2>
          <p className="mt-2 text-sm leading-6 text-mist-2">{rec.description}</p>
        </div>
      </div>

      {hasLive ? (
        <>
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-mist-3">
            Risk profiline uygun fonlar · son 1 yıl getirisi
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {liveFunds.map((fund) => (
              <Link
                key={fund.kod}
                href={`/fon/${fund.kod}`}
                className="group flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.04] p-4 transition hover:border-emerald-300/30"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{fund.kod}</span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-mist-3 transition group-hover:text-emerald-200" />
                  </div>
                  <p className="mt-1 truncate text-xs text-mist-3">{fund.ad}</p>
                </div>
                <span
                  className={`shrink-0 rounded-lg px-2 py-1 text-sm font-semibold tabular-nums ${
                    fund.getiri1y >= 0
                      ? "bg-emerald-300/12 text-emerald-300"
                      : "bg-rose-300/12 text-rose-300"
                  }`}
                >
                  {fund.getiri1y >= 0 ? "+" : ""}
                  {fund.getiri1y.toFixed(1)}%
                </span>
              </Link>
            ))}
          </div>
          <p className="mt-3 text-[11px] leading-5 text-mist-3">
            Geçmiş getiri gelecekteki performansı garanti etmez. Yatırım tavsiyesi değildir.
          </p>
        </>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          {rec.funds.map((fund) => (
            <div
              key={fund.name}
              className="rounded-2xl border border-white/8 bg-white/[0.04] p-4"
            >
              <div className="mb-2 flex items-center gap-2">
                <TrendingUp className={`h-4 w-4 ${rec.color}`} />
                <span className="text-sm font-semibold text-white">{fund.name}</span>
              </div>
              <p className="text-xs leading-5 text-mist-3">{fund.reason}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 rounded-2xl border border-amber-200/14 bg-amber-300/8 px-4 py-3 text-xs leading-5 text-amber-50/80">
        💡 {rec.tip}
      </div>
    </div>
  );
}

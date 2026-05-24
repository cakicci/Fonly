import {
  BadgeHelp,
  BarChart4,
  Calculator,
  Clock3,
  Compass,
  Layers3,
  Landmark,
  Percent,
  Scale,
  Shield,
  Sprout,
  Target,
  TimerReset,
  Waves
} from "lucide-react";
import Image from "next/image";
import { CategoryCard } from "@/components/CategoryCard";
import { FundCard } from "@/components/FundCard";
import { GuideCard } from "@/components/GuideCard";
import { Hero } from "@/components/Hero";
import { RiskPlanner } from "@/components/RiskPlanner";
import { Sidebar } from "@/components/Sidebar";
import { StockCard } from "@/components/StockCard";
import { funds } from "@/data/funds";
import { stocks } from "@/data/stocks";

const categories = [
  {
    title: "Düşük Riskli",
    description:
      "Daha sakin ilerleyen seçeneklerdir. Amaç, büyük iniş çıkışlardan uzak durup birikimi korumaya yakın kalmaktır.",
    icon: Shield
  },
  {
    title: "Orta Riskli",
    description:
      "Hem güvenli kalmak hem de büyüme şansı aramak isteyenler için dengeli bir yol sunar.",
    icon: Scale
  },
  {
    title: "Yüksek Riskli",
    description:
      "Fiyatı daha hızlı değişebilir. Daha yüksek kazanç ihtimali vardır, fakat kısa vadede düşüşler de yaşanabilir.",
    icon: Waves
  },
  {
    title: "Uzun Vadeli",
    description:
      "Bugünden yarına değil, yıllar içinde büyümeyi hedefler. Sabır bu yaklaşımın en önemli parçasıdır.",
    icon: Sprout
  },
  {
    title: "Kısa Vadeli",
    description:
      "Paranı yakın zamanda kullanma ihtimalin varsa daha esnek ve kolay anlaşılır seçeneklere odaklanır.",
    icon: TimerReset
  }
];

const guides = [
  {
    title: "Yatırıma Nereden Başlamalıyım?",
    description:
      "Önce ne kadar para ayırabileceğini ve bu paraya ne zaman ihtiyaç duyabileceğini belirle.",
    icon: Compass
  },
  {
    title: "Risk Nedir?",
    description:
      "Risk, paran değer kazanırken veya düşerken yaşayabileceğin belirsizliktir. Her yatırımda az ya da çok bulunur.",
    icon: BadgeHelp
  },
  {
    title: "Fon ve Hisse Arasındaki Fark",
    description:
      "Hisse tek bir şirkete ortak olmak gibidir. Fon ise paranı birçok farklı yere bölen hazır bir sepet gibidir.",
    icon: Layers3
  },
  {
    title: "Uzun Vadeli Yatırım Nedir?",
    description:
      "Kısa süreli fiyat hareketlerine fazla takılmadan, zaman içinde düzenli büyümeyi bekleme yaklaşımıdır.",
    icon: Clock3
  }
];

const financialParameters = [
  {
    title: "Getiri",
    description:
      "Paranın belirli sürede ne kadar arttığını gösterir. %20 getiri, 100 TL'nin 120 TL olması gibi düşünülebilir.",
    icon: Percent
  },
  {
    title: "Günlük değişim",
    description:
      "Bugün fiyatın düne göre ne kadar oynadığını anlatır. Tek başına karar vermek için yeterli değildir.",
    icon: BarChart4
  },
  {
    title: "Risk seviyesi",
    description:
      "Paranın kısa sürede ne kadar dalgalanabileceğini anlatır. Risk yükseldikçe sabır ihtiyacı da artar.",
    icon: Shield
  },
  {
    title: "Altın kıyası",
    description:
      "Hissenin artışını herkesin bildiği gram altınla karşılaştırır. Böylece sayıların ne ifade ettiği daha kolay anlaşılır.",
    icon: Landmark
  },
  {
    title: "1 yıl / 5 yıl",
    description:
      "Fiyatın kısa ve uzun sürede nasıl davrandığını gösterir. Uzun dönem, günlük hareketlerden daha anlamlı olabilir.",
    icon: Clock3
  },
  {
    title: "Ayrılabilir tutar",
    description:
      "Kira, fatura, borç ve temel ihtiyaçlardan sonra zorlamadan kenara koyabileceğin paradır.",
    icon: Calculator
  }
];

export default function Home() {
  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between pb-5">
        <a href="#" className="flex items-center gap-3" aria-label="Fonly ana sayfa">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/8 p-1 shadow-glow">
            <Image
              src="/fonly-logo.png"
              alt="Fonly logosu"
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
              priority
            />
          </span>
          <span className="text-xl font-semibold text-white">Fonly</span>
        </a>
        <nav className="hidden items-center gap-6 text-sm text-mist/62 md:flex">
          <a className="transition hover:text-white" href="#categories">
            Kategoriler
          </a>
          <a className="transition hover:text-white" href="#funds">
            Fonlar
          </a>
          <a className="transition hover:text-white" href="#guide">
            Rehber
          </a>
        </nav>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[minmax(0,1fr)_330px]">
        <div className="space-y-6">
          <Hero />

          <section id="categories" className="rounded-[1.75rem] border border-line bg-white/[0.025] p-5 sm:p-6">
            <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-medium text-emerald-200">Yatırım tarzını seç</p>
                <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
                  Karar vermeyi kolaylaştıran kategoriler
                </h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-mist/60">
                Her kategori, paranın nasıl hareket edebileceğini basitçe anlatır.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {categories.map((category) => (
                <CategoryCard key={category.title} {...category} />
              ))}
            </div>
          </section>

          <section id="funds" className="rounded-[1.75rem] border border-line bg-white/[0.025] p-5 sm:p-6">
            <div className="mb-6">
              <p className="text-sm font-medium text-emerald-200">Popüler fonlar</p>
              <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
                Hazır sepetleri sade dille incele
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {funds.map((fund) => (
                <FundCard key={fund.name} fund={fund} />
              ))}
            </div>
          </section>

          <section id="stocks" className="rounded-[1.75rem] border border-line bg-white/[0.025] p-5 sm:p-6">
            <div className="mb-6">
              <p className="text-sm font-medium text-cyan-200">Popüler hisseler</p>
              <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
                Geçmiş artışı altınla karşılaştır
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-mist/60">
                Hisse kartları şirketin ne yaptığından çok, geçmişte ne kadar arttığını ve gram altına göre nasıl kaldığını sade dille gösterir.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {stocks.map((stock) => (
                <StockCard key={stock.symbol} stock={stock} />
              ))}
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-line bg-white/[0.025] p-5 sm:p-6">
            <div className="mb-6">
              <p className="text-sm font-medium text-emerald-200">Parametreleri sadeleştir</p>
              <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
                Finansal ekrandaki sayılar ne anlama geliyor?
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-mist/60">
                Bu bölüm, sitede gördüğün her temel finansal ifadeyi günlük Türkçe ile açıklar.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {financialParameters.map((parameter) => (
                <GuideCard key={parameter.title} {...parameter} />
              ))}
            </div>
          </section>

          <section id="guide" className="glass-card rounded-[1.75rem] p-5 sm:p-6">
            <div className="mb-6">
              <p className="text-sm font-medium text-cyan-200">Finans rehberi</p>
              <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
                Kafa karıştırmadan temel bilgiler
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {guides.map((guide) => (
                <GuideCard key={guide.title} {...guide} />
              ))}
            </div>
          </section>

          <RiskPlanner />

          <section className="relative overflow-hidden rounded-[1.75rem] border border-emerald-200/18 bg-[linear-gradient(135deg,rgba(45,227,168,0.18),rgba(12,24,22,0.9))] p-6 shadow-glow sm:p-8">
            <div className="absolute right-8 top-6 h-32 w-32 rounded-full bg-cyan-300/12 blur-3xl" />
            <div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-300 text-ink">
                  <Target className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-semibold text-white sm:text-3xl">
                  Sana uygun risk profilini keşfet
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-mist/70">
                  Birkaç basit soruyla ne kadar dalgalanma seni rahatsız eder, paranı ne kadar süre ayırabilirsin ve hangi seçenekler daha uygun olabilir birlikte anlayalım.
                </p>
              </div>
              <button className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-emerald-300 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-emerald-200">
                Risk Testine Başla
              </button>
            </div>
          </section>
        </div>

        <Sidebar />
      </div>
    </main>
  );
}

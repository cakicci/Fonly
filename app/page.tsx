import { Target } from "lucide-react";
import { CategoryFilter } from "@/components/CategoryFilter";
import { FundCard } from "@/components/FundCard";
import { StockCard } from "@/components/StockCard";
import { GuideTeaser } from "@/components/GuideTeaser";
import { Hero } from "@/components/Hero";
import { RiskPlanner } from "@/components/RiskPlanner";
import { BistPanel } from "@/components/BistPanel";
import { LiveMarketPanels } from "@/components/LiveMarketPanels";
import { MarketSidebar } from "@/components/MarketSidebar";
import { funds } from "@/data/funds";
import { stocks } from "@/data/stocks";




export default function Home() {
  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1600px] gap-6 lg:grid-cols-[256px_minmax(0,1fr)_300px]">
        <BistPanel />
        <div className="space-y-6">
          <Hero />

          <LiveMarketPanels />

          <section id="categories" className="rounded-[1.75rem] border border-line bg-white/[0.025] p-5 sm:p-6">
            <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-medium text-emerald-200">Yatırım tarzını seç</p>
                <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
                  Karar vermeyi kolaylaştıran kategoriler
                </h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-mist/60">
                Bir kategoriye tıkla — aşağıdaki hisseler otomatik filtrelenir.
              </p>
            </div>
            <CategoryFilter />
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
            <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-medium text-cyan-200">BIST hisseleri</p>
                <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
                  Geçmiş artışı altınla karşılaştır
                </h2>
              </div>
              <p className="max-w-sm text-sm leading-6 text-mist/55">
                Kategori kartından bir grup seç — o gruba ait tüm hisseler ayrı sayfada açılır.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {stocks.map((stock) => (
                <StockCard key={stock.symbol} stock={stock} />
              ))}
            </div>
          </section>

<GuideTeaser />

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
              <a href="/risk-test" className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-emerald-300 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-emerald-200">
                Risk Testine Başla
              </a>
            </div>
          </section>
        </div>

        <MarketSidebar />
      </div>
    </main>
  );
}
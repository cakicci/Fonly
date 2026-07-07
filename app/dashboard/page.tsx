import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LineChart,
  ShieldCheck,
  WalletCards,
  Star,
  BellRing,
  Settings,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
} from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isPremium } from "@/lib/auth/premium";
import { getQuotesForSlugs, type Quote } from "@/lib/portfolio/price";
import {
  aggregatePositions,
  portfolioSummary,
  portfolioDailyChange,
} from "@/lib/portfolio/aggregate";
import {
  assetDisplayName,
  assetHref,
  assetTypeOf,
  ASSET_TYPE_LABELS,
  type AssetType,
} from "@/lib/portfolio/asset";
import { fetchAllFundReturns, tefasRiskToCategory } from "@/lib/tefas";
import { IncomeForm } from "@/components/IncomeForm";
import { RiskBadge } from "@/components/RiskBadge";
import {
  PersonalRecommendations,
  type RecommendedFund,
} from "@/components/PersonalRecommendations";
import { OnboardingChecklist, type OnboardingStep } from "@/components/OnboardingChecklist";
import { GoalsCard } from "@/components/GoalsCard";
import { DashboardCustomizer } from "@/components/DashboardCustomizer";
import { parseDashboardLayout, widgetLabel, type WidgetKey } from "@/lib/dashboard/widgets";

export const metadata: Metadata = {
  title: "Genel Bakış",
  robots: { index: false },
};

function formatLira(value: number, maximumFractionDigits = 0) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits,
  }).format(value);
}

/** Varlık tipi başına dağılım çubuğu/lejant renkleri. */
const TYPE_STYLE: Record<AssetType, { bar: string; dot: string }> = {
  hisse: { bar: "bg-emerald-300", dot: "bg-emerald-300" },
  doviz: { bar: "bg-cyan-300", dot: "bg-cyan-300" },
  altin: { bar: "bg-amber-300", dot: "bg-amber-300" },
  fon: { bar: "bg-violet-300", dot: "bg-violet-300" },
};

function conditionLabel(condition: string): string {
  return condition === "above" ? "≥" : "≤";
}

/** Varlık fiyatı için büyüklüğe göre ondalık seçer (fon ~0.45, döviz ~32, altın ~4000). */
function formatPrice(value: number): string {
  const decimals = value >= 1 ? 2 : 4;
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/** Geçmiş bir an için kısa Türkçe göreli zaman ("3 saat önce"). */
function timeAgo(date: Date): string {
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return "az önce";
  if (mins < 60) return `${mins} dk önce`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} saat önce`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} gün önce`;
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" }).format(date);
}

/** Türkiye saatine göre zaman duyarlı selamlama. */
function greeting(): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Europe/Istanbul",
      hour: "numeric",
      hourCycle: "h23",
    }).format(new Date())
  );
  if (hour < 6) return "İyi geceler";
  if (hour < 12) return "Günaydın";
  if (hour < 18) return "İyi günler";
  return "İyi akşamlar";
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const [user, lots, watchlist, alerts, premium, goals, triggered] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { riskProfile: true, monthlyIncome: true, dashboardLayout: true },
    }),
    prisma.portfolioLot.findMany({
      where: { userId },
      select: { slug: true, side: true, quantity: true, unitCost: true, boughtAt: true },
    }),
    prisma.watchlist.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, select: { slug: true } }),
    prisma.priceAlert.findMany({
      where: { userId, active: true },
      orderBy: { createdAt: "desc" },
      select: { id: true, slug: true, condition: true, threshold: true },
    }),
    isPremium(userId),
    prisma.goal.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.priceAlert.findMany({
      where: { userId, triggeredAt: { not: null } },
      orderBy: { triggeredAt: "desc" },
      take: 5,
      select: { id: true, slug: true, condition: true, threshold: true, triggeredAt: true },
    }),
  ]);

  const riskProfile = (user?.riskProfile ?? null) as "low" | "medium" | "high" | null;
  const monthlyIncome = user?.monthlyIncome ?? null;

  const riskShare: Record<string, number> = { low: 0.08, medium: 0.12, high: 0.16 };
  const suggestedAmount =
    riskProfile && monthlyIncome ? Math.round(monthlyIncome * riskShare[riskProfile]) : null;

  // İzleme listesinde fiyatlı gösterilecek ilk varlıklar.
  const watchTop = watchlist.slice(0, 8);

  // Portföy + alarm + izleme listesi fiyatları tek çağrıda (fiyat + günlük değişim).
  const quoteSlugs = Array.from(
    new Set([
      ...lots.map((l) => l.slug),
      ...alerts.map((a) => a.slug),
      ...watchTop.map((w) => w.slug),
    ])
  );
  // Fiyatlar + (risk profili varsa) tüm fon getirileri paralel — waterfall yok.
  const [quotes, allFunds] = await Promise.all([
    quoteSlugs.length
      ? getQuotesForSlugs(quoteSlugs)
      : Promise.resolve(new Map<string, Quote | null>()),
    riskProfile ? fetchAllFundReturns().catch(() => []) : Promise.resolve([]),
  ]);
  const priceMap = new Map<string, number | null>();
  const changeMap = new Map<string, number | null>();
  for (const [slug, q] of quotes) {
    priceMap.set(slug, q?.price ?? null);
    changeMap.set(slug, q?.changePercent ?? null);
  }

  const positions = aggregatePositions(
    lots.map((l) => ({ ...l, at: l.boughtAt })),
    priceMap
  );
  const summary = portfolioSummary(positions);
  const daily = portfolioDailyChange(positions, changeMap);
  const hasPortfolio = lots.length > 0;

  const pnlColor =
    summary.pnl > 0 ? "text-emerald-300" : summary.pnl < 0 ? "text-rose-300" : "text-mist/70";
  const dailyColor =
    daily.changeValue > 0
      ? "text-emerald-300"
      : daily.changeValue < 0
        ? "text-rose-300"
        : "text-mist/70";

  // Alarm satırları: canlı fiyat + eşiğe kalan yüzde.
  const alertItems = alerts.map((a) => {
    const current = priceMap.get(a.slug) ?? null;
    let distancePct: number | null = null;
    if (current != null && current > 0) {
      const raw = a.condition === "above" ? a.threshold - current : current - a.threshold;
      distancePct = (raw / current) * 100;
    }
    return { ...a, current, distancePct };
  });

  // İzleme listesi satırları: canlı fiyat + günlük değişim.
  const watchItems = watchTop.map((w) => ({
    slug: w.slug,
    name: assetDisplayName(w.slug),
    quote: quotes.get(w.slug) ?? null,
  }));

  // Portföy dağılımı (varlık tipine göre, fiyatı bilinen pozisyonlar üzerinden).
  const allocTotals = new Map<AssetType, number>();
  let allocTotal = 0;
  for (const p of positions) {
    if (p.value == null) continue;
    const t = assetTypeOf(p.slug);
    if (!t) continue;
    allocTotals.set(t, (allocTotals.get(t) ?? 0) + p.value);
    allocTotal += p.value;
  }
  const allocEntries = [...allocTotals.entries()].sort((a, b) => b[1] - a[1]);

  // En çok kazandıran / kaybettiren pozisyon (yüzde K/Z'ye göre).
  const pricedPositions = positions.filter((p) => p.pnlPct != null);
  const bestPosition = pricedPositions.reduce<typeof pricedPositions[number] | null>(
    (best, p) => (best == null || p.pnlPct! > best.pnlPct! ? p : best),
    null
  );
  const worstPosition = pricedPositions.reduce<typeof pricedPositions[number] | null>(
    (worst, p) => (worst == null || p.pnlPct! < worst.pnlPct! ? p : worst),
    null
  );

  // Risk profiline uygun gerçek fonlar (son 1y getirisine göre, en iyi 4).
  const recommendedFunds: RecommendedFund[] = riskProfile
    ? allFunds
        .filter(
          (f) =>
            f.tefasDurum &&
            f.getiri1y != null &&
            tefasRiskToCategory(f.riskDegeri) === riskProfile
        )
        .sort((a, b) => (b.getiri1y ?? 0) - (a.getiri1y ?? 0))
        .slice(0, 4)
        .map((f) => ({ kod: f.fonKodu, ad: f.fonUnvan, getiri1y: f.getiri1y! }))
    : [];

  // Kuruluma yön veren ilerleme adımları.
  const onboardingSteps: OnboardingStep[] = [
    { label: "Risk profilini belirle", href: "/risk-test", cta: "Teste başla", done: riskProfile != null },
    { label: "Aylık gelirini gir", href: "#gelir", cta: "Gir", done: monthlyIncome != null },
    { label: "İlk varlığını ekle", href: "/portfoy", cta: "Ekle", done: lots.length > 0 },
    { label: "İzleme listesi oluştur", href: "/doviz", cta: "Keşfet", done: watchlist.length > 0 },
    { label: "Fiyat alarmı kur", href: "/doviz", cta: "Kur", done: alerts.length > 0 },
  ];
  const onboardingComplete = onboardingSteps.every((s) => s.done);

  // Hedefleri client bileşenine taşımak için serileştir (Date → ISO string).
  const goalItems = goals.map((g) => ({
    id: g.id,
    title: g.title,
    target: g.target,
    targetDate: g.targetDate ? g.targetDate.toISOString() : null,
  }));

  // Kullanıcı yerleşimi: widget sırası + gizlenenler.
  const layout = parseDashboardLayout(user?.dashboardLayout ?? null);
  const customizerWidgets = layout.order.map((k) => ({
    key: k,
    label: widgetLabel(k),
    visible: !layout.hidden.includes(k),
  }));

  // Her widget bir kayıt değeri — kullanıcı yerleşimine göre sıralanıp süzülür.
  // Veri koşulu sağlanmayan widget'lar (ör. dağılım/öneriler) null olur ve atlanır.
  const widgetNodes: Record<WidgetKey, ReactNode> = {
    // Hero — Portföy özeti
    portfolio: (
      <section key="portfolio">
        {hasPortfolio ? (
            <div className="glass-card rounded-[1.75rem] p-6 sm:p-7">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm text-mist/58">
                    <WalletCards className="h-4 w-4 text-emerald-200" />
                    Toplam portföy değeri
                  </div>
                  <div className="mt-2 flex flex-wrap items-baseline gap-3">
                    <h2 className="text-4xl font-semibold tabular-nums text-white sm:text-5xl">
                      {formatLira(summary.value)}
                    </h2>
                    {daily.changePct != null && (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold ${
                          daily.changeValue >= 0
                            ? "bg-emerald-300/12 text-emerald-300"
                            : "bg-rose-300/12 text-rose-300"
                        }`}
                      >
                        {daily.changeValue >= 0 ? (
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowDownRight className="h-3.5 w-3.5" />
                        )}
                        {daily.changePct >= 0 ? "+" : ""}
                        {daily.changePct.toFixed(2)}% bugün
                      </span>
                    )}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-x-8 gap-y-3">
                    <div>
                      <p className="text-xs text-mist/50">Bugün</p>
                      <p className={`mt-0.5 text-sm font-semibold tabular-nums ${dailyColor}`}>
                        {daily.changeValue >= 0 ? "+" : ""}
                        {formatLira(daily.changeValue)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-mist/50">Toplam kâr/zarar</p>
                      <p className={`mt-0.5 text-sm font-semibold tabular-nums ${pnlColor}`}>
                        {summary.pnl >= 0 ? "+" : ""}
                        {formatLira(summary.pnl)}
                        {summary.pnlPct != null &&
                          ` (${summary.pnlPct >= 0 ? "+" : ""}${summary.pnlPct.toFixed(2)}%)`}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-mist/50">Maliyet</p>
                      <p className="mt-0.5 text-sm font-semibold tabular-nums text-mist/80">
                        {formatLira(summary.costTotal)}
                      </p>
                    </div>
                  </div>

                  {summary.missingPrices > 0 && (
                    <p className="mt-3 text-xs text-amber-200/70">
                      {summary.missingPrices} varlığın canlı fiyatı şu an alınamadı; değere katılmadı.
                    </p>
                  )}
                </div>

                <Link
                  href="/portfoy"
                  className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-emerald-300 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-emerald-200"
                >
                  Portföyü aç <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ) : (
            <Link
              href="/portfoy"
              className="glass-card group flex flex-col gap-4 rounded-[1.75rem] p-6 transition hover:ring-1 hover:ring-emerald-300/20 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-300/12 text-emerald-200">
                  <WalletCards className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Portföyün boş</h2>
                  <p className="mt-1 text-sm text-mist/58">
                    İlk alımını ekle, kâr/zararını canlı fiyatlarla takip et.
                  </p>
                </div>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-emerald-200 group-hover:text-emerald-100">
                Alım ekle <ArrowUpRight className="h-4 w-4" />
              </span>
            </Link>
          )}
        </section>
    ),

    // Varlık dağılımı + pozisyon performansı
    allocation:
      hasPortfolio && allocTotal > 0 ? (
        <section key="allocation" className="grid gap-4 md:grid-cols-2">
            {/* Varlık dağılımı */}
            <article className="glass-card rounded-[1.5rem] p-5">
              <h3 className="text-sm font-semibold text-white">Varlık dağılımı</h3>
              <div className="mt-4 flex h-2.5 w-full overflow-hidden rounded-full bg-white/[0.04]">
                {allocEntries.map(([type, value]) => (
                  <div
                    key={type}
                    className={TYPE_STYLE[type].bar}
                    style={{ width: `${(value / allocTotal) * 100}%` }}
                    title={`${ASSET_TYPE_LABELS[type]} ${((value / allocTotal) * 100).toFixed(1)}%`}
                  />
                ))}
              </div>
              <ul className="mt-4 space-y-2">
                {allocEntries.map(([type, value]) => (
                  <li key={type} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-mist/75">
                      <span className={`h-2.5 w-2.5 rounded-full ${TYPE_STYLE[type].dot}`} />
                      {ASSET_TYPE_LABELS[type]}
                    </span>
                    <span className="tabular-nums text-mist/55">
                      {((value / allocTotal) * 100).toFixed(1)}% · {formatLira(value)}
                    </span>
                  </li>
                ))}
              </ul>
            </article>

            {/* En iyi / en kötü pozisyon */}
            <article className="glass-card rounded-[1.5rem] p-5">
              <h3 className="text-sm font-semibold text-white">Pozisyon performansı</h3>
              <div className="mt-4 space-y-3">
                {bestPosition && (
                  <Link
                    href={assetHref(bestPosition.slug)}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-300/12 bg-emerald-300/[0.06] px-3 py-2.5 transition hover:border-emerald-300/30"
                  >
                    <div className="min-w-0">
                      <p className="text-[11px] text-mist/45">En çok kazandıran</p>
                      <p className="truncate text-sm font-medium text-white">
                        {assetDisplayName(bestPosition.slug)}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-emerald-300">
                      +{bestPosition.pnlPct!.toFixed(2)}%
                    </span>
                  </Link>
                )}
                {worstPosition && worstPosition.slug !== bestPosition?.slug && (
                  <Link
                    href={assetHref(worstPosition.slug)}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-rose-300/12 bg-rose-300/[0.06] px-3 py-2.5 transition hover:border-rose-300/30"
                  >
                    <div className="min-w-0">
                      <p className="text-[11px] text-mist/45">En çok kaybettiren</p>
                      <p className="truncate text-sm font-medium text-white">
                        {assetDisplayName(worstPosition.slug)}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-rose-300">
                      {worstPosition.pnlPct!.toFixed(2)}%
                    </span>
                  </Link>
                )}
              </div>
            </article>
        </section>
      ) : null,

    // Hedefler + Senin için gelişmeler
    goals: (
      <section key="goals" className={`grid gap-4 ${triggered.length > 0 ? "md:grid-cols-2" : ""}`}>
        <GoalsCard
          initialGoals={goalItems}
          portfolioValue={summary.value}
          monthlySuggested={suggestedAmount}
        />

          {triggered.length > 0 && (
            <article className="glass-card rounded-[1.5rem] p-5">
              <div className="mb-4 flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-200" />
                <h3 className="text-sm font-semibold text-white">Senin için gelişmeler</h3>
              </div>
              <ul className="space-y-2.5">
                {triggered.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-300/12 text-emerald-200">
                        <BellRing className="h-3.5 w-3.5" />
                      </span>
                      <Link href={assetHref(t.slug)} className="truncate text-mist/75 hover:text-white">
                        <span className="font-medium text-white">{assetDisplayName(t.slug)}</span>{" "}
                        {conditionLabel(t.condition)} {formatPrice(t.threshold)} eşiğini geçti
                      </Link>
                    </div>
                    <span className="shrink-0 tabular-nums text-mist/40">
                      {t.triggeredAt ? timeAgo(t.triggeredAt) : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </article>
          )}
      </section>
    ),

    // Risk profili + Aylık bütçe
    riskBudget: (
      <section key="riskBudget" className="grid gap-4 md:grid-cols-2">
          {/* Risk Profili */}
          <article className="glass-card rounded-[1.5rem] p-5">
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-300/12 text-emerald-200">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <p className="text-sm text-mist/58">Risk profilin</p>
            <RiskBadge riskProfile={riskProfile} />
            <Link
              href="/risk-test"
              className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-emerald-200 hover:text-emerald-100"
            >
              {riskProfile ? "Testi yenile →" : "Testi başlat →"}
            </Link>
          </article>

          {/* Aylık Bütçe */}
          <article className="glass-card rounded-[1.5rem] p-5">
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-300/12 text-emerald-200">
              <LineChart className="h-5 w-5" />
            </div>
            <p className="text-sm text-mist/58">Aylık ayrılabilir tutar</p>
            {suggestedAmount ? (
              <h2 className="mt-2 text-2xl font-semibold text-white">{formatLira(suggestedAmount)}</h2>
            ) : (
              <h2 className="mt-2 text-2xl font-semibold text-mist/40">Belirlenmedi</h2>
            )}
            <p className="mt-2 text-xs leading-5 text-mist/50">
              {suggestedAmount ? "Gelirin ve risk profiline göre." : "Gelirini gir, tutarı hesaplayalım."}
            </p>
          </article>
      </section>
    ),

    // İzleme listesi + Aktif alarmlar
    watchlistAlerts: (
      <section key="watchlistAlerts" className="grid gap-4 md:grid-cols-2">
          {/* İzleme Listem */}
          <article className="glass-card rounded-[1.5rem] p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-200" />
                <h3 className="text-sm font-semibold text-white">İzleme Listem</h3>
                <span className="text-xs text-mist/40">({watchlist.length})</span>
              </div>
            </div>
            {watchItems.length > 0 ? (
              <ul className="space-y-2">
                {watchItems.map((w) => {
                  const pct = w.quote?.changePercent ?? null;
                  return (
                    <li key={w.slug} className="flex items-center justify-between gap-3 text-xs">
                      <Link
                        href={assetHref(w.slug)}
                        className="truncate text-mist/85 hover:text-white"
                      >
                        {w.name}
                      </Link>
                      <div className="flex shrink-0 items-center gap-2 tabular-nums">
                        {w.quote ? (
                          <>
                            <span className="text-mist/70">{formatPrice(w.quote.price)}</span>
                            {pct != null && (
                              <span
                                className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${
                                  pct >= 0
                                    ? "bg-emerald-300/12 text-emerald-300"
                                    : "bg-rose-300/12 text-rose-300"
                                }`}
                              >
                                {pct >= 0 ? "+" : ""}
                                {pct.toFixed(2)}%
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-mist/40">—</span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-xs text-mist/50">
                Henüz takip ettiğin varlık yok. Varlık sayfalarındaki yıldıza tıklayarak ekle.
              </p>
            )}
          </article>

          {/* Aktif Alarmlar */}
          <article className="glass-card rounded-[1.5rem] p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BellRing className="h-4 w-4 text-cyan-200" />
                <h3 className="text-sm font-semibold text-white">Aktif Alarmlar</h3>
                <span className="text-xs text-mist/40">({alerts.length})</span>
              </div>
              {alerts.length > 0 && (
                <Link href="/alarmlar" className="text-xs text-emerald-200 hover:text-emerald-100">
                  Yönet →
                </Link>
              )}
            </div>
            {alertItems.length > 0 ? (
              <ul className="space-y-2.5">
                {alertItems.slice(0, 4).map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <Link href={assetHref(a.slug)} className="text-mist/85 hover:text-white">
                        {assetDisplayName(a.slug)}
                      </Link>
                      <p className="mt-0.5 text-[11px] tabular-nums text-mist/45">
                        Hedef {conditionLabel(a.condition)} {formatPrice(a.threshold)}
                        {a.current != null && ` · şu an ${formatPrice(a.current)}`}
                      </p>
                    </div>
                    {a.distancePct != null ? (
                      <span className="shrink-0 rounded-full border border-white/8 bg-white/[0.04] px-2 py-0.5 tabular-nums text-mist/65">
                        %{Math.abs(a.distancePct).toFixed(1)} kaldı
                      </span>
                    ) : (
                      <span className="shrink-0 tabular-nums text-mist/40">—</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-mist/50">
                Alarm kurmadın. Varlık sayfalarından fiyat alarmı ekleyebilirsin.
              </p>
            )}
          </article>
      </section>
    ),

    // Gelir girişi
    income: (
      <section key="income" id="gelir" className="scroll-mt-6">
        <IncomeForm currentIncome={monthlyIncome} />
      </section>
    ),

    // Kişisel öneriler
    recommendations: riskProfile ? (
      <section key="recommendations">
        <PersonalRecommendations riskProfile={riskProfile} liveFunds={recommendedFunds} />
      </section>
    ) : null,
  };

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-emerald-200">Fonly panelin</p>
              {premium ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-fuchsia-300/25 bg-fuchsia-300/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-fuchsia-200">
                  <Sparkles className="h-3 w-3" /> Premium
                </span>
              ) : null}
            </div>
            <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
              {greeting()}, {session.user.name ?? "Fonly kullanıcısı"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <DashboardCustomizer widgets={customizerWidgets} />
            <Link
              href="/hesap"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-mist/14 bg-white/5 px-4 py-3 text-sm font-semibold text-mist transition hover:bg-white/10"
            >
              <Settings className="h-4 w-4" /> Hesap ayarları
            </Link>
          </div>
        </header>

        <div className="space-y-4">
          {!onboardingComplete && <OnboardingChecklist steps={onboardingSteps} />}
          {layout.order
            .filter((k) => !layout.hidden.includes(k))
            .map((k) => widgetNodes[k])}
        </div>
      </div>
    </main>
  );
}

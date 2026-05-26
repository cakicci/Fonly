import Link from "next/link";
import { redirect } from "next/navigation";
import { LineChart, ShieldCheck, Target, WalletCards } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { IncomeForm } from "@/components/IncomeForm";
import { RiskBadge } from "@/components/RiskBadge";
import { PersonalRecommendations } from "@/components/PersonalRecommendations";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { riskProfile: true, monthlyIncome: true }
  });

  const riskProfile = user?.riskProfile as "low" | "medium" | "high" | null;
  const monthlyIncome = user?.monthlyIncome ?? null;

  const riskShare: Record<string, number> = { low: 0.08, medium: 0.12, high: 0.16 };
  const suggestedAmount =
    riskProfile && monthlyIncome
      ? Math.round(monthlyIncome * riskShare[riskProfile])
      : null;

  function formatLira(value: number) {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      maximumFractionDigits: 0
    }).format(value);
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-emerald-200">Fonly panelin</p>
            <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
              Hoş geldin, {session.user.name ?? "Fonly kullanıcısı"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-mist/64">
              Risk profilin, bütçe tercihlerini ve kişisel finans rehberini burada bulacaksın.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-mist/14 bg-white/5 px-4 py-3 text-sm font-semibold text-mist transition hover:bg-white/10"
          >
            Ana sayfaya dön
          </Link>
        </header>

        {/* Stat Cards */}
        <section className="grid gap-4 md:grid-cols-3">
          {/* Risk Profili */}
          <article className="glass-card rounded-[1.5rem] p-5">
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-300/12 text-emerald-200">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <p className="text-sm text-mist/58">Risk profilin</p>
            <RiskBadge riskProfile={riskProfile} />
            {!riskProfile && (
              <Link
                href="/risk-test"
                className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-emerald-200 hover:text-emerald-100"
              >
                Testi başlat →
              </Link>
            )}
          </article>

          {/* Aylık Bütçe */}
          <article className="glass-card rounded-[1.5rem] p-5">
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-300/12 text-emerald-200">
              <WalletCards className="h-5 w-5" />
            </div>
            <p className="text-sm text-mist/58">Aylık ayrılabilir tutar</p>
            {suggestedAmount ? (
              <h2 className="mt-2 text-2xl font-semibold text-white">{formatLira(suggestedAmount)}</h2>
            ) : (
              <h2 className="mt-2 text-2xl font-semibold text-mist/40">Belirlenmedi</h2>
            )}
            <p className="mt-2 text-xs leading-5 text-mist/50">
              {suggestedAmount
                ? "Gelirin ve risk profiline göre hesaplandı."
                : "Gelirini girerek tutarı hesapla."}
            </p>
          </article>

          {/* Karşılaştırma */}
          <article className="glass-card rounded-[1.5rem] p-5">
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-300/12 text-emerald-200">
              <LineChart className="h-5 w-5" />
            </div>
            <p className="text-sm text-mist/58">Takip edilen karşılaştırma</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Altın kıyası</h2>
            <p className="mt-2 text-xs leading-5 text-mist/50">
              Hisse artışlarını gram altınla kıyaslayarak sayıları daha anlaşılır hale getiririz.
            </p>
          </article>
        </section>

        {/* Gelir Girişi */}
        <section className="mt-6">
          <IncomeForm currentIncome={monthlyIncome} />
        </section>

        {/* Kişisel Öneriler */}
        {riskProfile && (
          <section className="mt-6">
            <PersonalRecommendations riskProfile={riskProfile} />
          </section>
        )}

        {/* Risk Testi CTA - sadece test yapılmadıysa göster */}
        {!riskProfile && (
          <section className="mt-6 relative overflow-hidden rounded-[1.75rem] border border-emerald-200/18 bg-[linear-gradient(135deg,rgba(45,227,168,0.16),rgba(12,24,22,0.9))] p-6 sm:p-8">
            <div className="absolute right-8 top-6 h-32 w-32 rounded-full bg-cyan-300/12 blur-3xl" />
            <div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-300 text-ink">
                  <Target className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-semibold text-white sm:text-3xl">
                  Risk profilini henüz belirlemdin
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-mist/70">
                  5 kısa soruyla sana uygun risk grubunu bulalım. Böylece hangi fonların ve hisselerin daha uygun olabileceğini görebilirsin.
                </p>
              </div>
              <Link
                href="/risk-test"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-emerald-300 px-6 py-3 text-sm font-semibold text-ink transition hover:bg-emerald-200"
              >
                Testi Başlat
              </Link>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

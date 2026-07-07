import {
  Sparkles,
  Check,
  Brain,
  LineChart,
  Newspaper,
  MessageSquare,
  TrendingUp,
  Shield,
} from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isPremium } from "@/lib/auth/premium";
import { PLANS, PLAN_MAP } from "@/lib/billing/plans";
import { CheckoutButton } from "@/components/billing/CheckoutButton";
import { ManageSubscription } from "@/components/billing/ManageSubscription";

export const metadata = {
  title: { absolute: "FonlyPro · Yapay zekâ destekli yatırım analizi" },
  description:
    "FonlyPro ile her varlık için AI destekli teknik analiz, kısa vadeli zaman dilimleri, şirket özetleri ve daha fazlasına erişin.",
};

// `comingSoon: true` → AI motoru bağlanana kadar kartta "Yakında" rozeti
// gösterilir. Motor devreye girdikçe ilgili bayraklar kaldırılacak.
const FEATURES = [
  {
    icon: Brain,
    title: "AI destekli teknik analiz",
    desc:  "Hareketli ortalama, momentum ve trend göstergelerinin birleşimini Türkçe yorumlu özet halinde sunar.",
    comingSoon: true,
  },
  {
    icon: LineChart,
    title: "Kısa vadeli zaman dilimleri",
    desc:  "1 dakika, 5 dakika, 15 dakika ve 30 dakikalık teknik analiz sekmelerinin tamamına erişim.",
  },
  {
    icon: TrendingUp,
    title: "Şirket profili ve büyüme özeti",
    desc:  "Bir hissenin temel finansallarını ve büyüme görünümünü saniyeler içinde anla.",
    comingSoon: true,
  },
  {
    icon: Newspaper,
    title: "AI haber özetleri",
    desc:  "İlgili varlıkların haber akışını tek paragrafta toparlayan AI özetler.",
    comingSoon: true,
  },
  {
    icon: MessageSquare,
    title: "Anlık soru-cevap (chat)",
    desc:  "Her varlık için yapay zekâ asistanına sorular sor, yorum iste.",
    comingSoon: true,
  },
  {
    icon: Shield,
    title: "Temettü sürdürülebilirliği",
    desc:  "Bir hissenin temettü politikası ve karşılama oranını AI ile değerlendir.",
    comingSoon: true,
  },
];

export default async function PremiumPage() {
  const session = await auth();
  const premium = session?.user?.id ? await isPremium(session.user.id) : false;

  const sub =
    premium && session?.user?.id
      ? await prisma.subscription.findUnique({
          where: { userId: session.user.id },
          select: { plan: true, currentPeriodEnd: true, cancelAtPeriodEnd: true },
        })
      : null;

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      {/* Hero */}
      <section className="mx-auto mt-12 max-w-3xl text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-fuchsia-300/25 bg-gradient-to-r from-fuchsia-300/10 to-emerald-300/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-fuchsia-200">
          <Sparkles className="h-3.5 w-3.5" />
          FonlyPro
        </div>
        <h1 className="text-balance text-4xl font-semibold leading-tight text-white sm:text-5xl">
          Yapay zekâ destekli yatırım analizini{" "}
          <span className="bg-gradient-to-r from-fuchsia-200 to-emerald-200 bg-clip-text text-transparent">
            FonlyPro
          </span>{" "}
          ile kullan
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-balance text-sm leading-relaxed text-mist/65 sm:text-base">
          Teknik göstergeleri saniyelerde Türkçe yoruma çevir, kısa vadeli zaman dilimlerini aç,
          haberleri tek paragrafta oku. Tüm varlıklarda — döviz, altın, hisse, fon.
        </p>
      </section>

      {/* Pricing / Yönetim */}
      {premium && sub ? (
        <ManageSubscription
          planName={PLAN_MAP[sub.plan as keyof typeof PLAN_MAP]?.name ?? sub.plan}
          periodEnd={sub.currentPeriodEnd.toISOString()}
          cancelAtPeriodEnd={sub.cancelAtPeriodEnd}
        />
      ) : (
        <section className="mx-auto mt-12 grid max-w-3xl gap-4 sm:grid-cols-2">
          {PLANS.map(plan => (
            <div
              key={plan.id}
              className={`glass-card relative overflow-hidden rounded-3xl p-6 ring-1 ${
                plan.highlight
                  ? "bg-gradient-to-br from-fuchsia-300/12 via-purple-300/4 to-emerald-300/10 ring-fuchsia-300/30"
                  : "bg-white/[0.02] ring-white/8"
              }`}
            >
              {plan.highlight && (
                <span className="absolute right-4 top-4 rounded-full bg-fuchsia-300/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-fuchsia-100">
                  En popüler
                </span>
              )}
              <p className="text-sm font-semibold text-mist/65">{plan.name}</p>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-4xl font-semibold text-white">{plan.priceLabel}</span>
                <span className="text-sm text-mist/45">{plan.period}</span>
              </div>
              <p className="mt-1 text-xs text-mist/45">{plan.sub}</p>

              <CheckoutButton
                planId={plan.id}
                highlight={plan.highlight}
                label={`${plan.name} abone ol`}
              />
            </div>
          ))}
        </section>
      )}

      {/* Features */}
      <section className="mx-auto mt-16 max-w-5xl">
        <h2 className="text-center text-xl font-semibold text-white sm:text-2xl">
          FonlyPro ile gelen özellikler
        </h2>
        <p className="mt-2 text-center text-sm text-mist/55">
          Tek abonelik, tüm varlıklar. &quot;Yakında&quot; işaretli AI özellikleri kademeli olarak
          devreye alınıyor — aktifleştiklerinde ek ücret olmadan aboneliğine dahil.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(f => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="glass-card relative rounded-2xl bg-white/[0.02] p-5 ring-1 ring-white/8"
              >
                {f.comingSoon && (
                  <span className="absolute right-4 top-4 rounded-full border border-amber-200/25 bg-amber-300/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-200">
                    Yakında
                  </span>
                )}
                <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-300/20 to-emerald-300/15">
                  <Icon className="h-4 w-4 text-fuchsia-200" />
                </div>
                <h3 className="text-sm font-semibold text-white">{f.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-mist/55">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ teaser */}
      <section className="mx-auto mt-16 max-w-3xl">
        <div className="rounded-3xl border border-white/8 bg-white/[0.02] p-6">
          <h3 className="text-base font-semibold text-white">Sıkça sorulan sorular</h3>
          <div className="mt-4 space-y-4 text-sm">
            <Faq
              q="Aboneliği istediğim zaman iptal edebilir miyim?"
              a="Evet. Aboneliğini hesap ayarlarından tek tıkla iptal edebilirsin; dönem sonuna kadar erişimin devam eder."
            />
            <Faq
              q="Ücretsiz plan ne sunuyor?"
              a="Tüm varlıklarda anlık fiyat, klasik teknik analiz (saatlik ve üzeri), watchlist ve fiyat alarmları ücretsiz."
            />
            <Faq
              q="AI ne zaman aktif olacak?"
              a="AI motoru entegrasyonu son aşamada. Abone olduktan sonra özellik aktifleştiğinde otomatik kullanabileceksin."
            />
          </div>
        </div>
      </section>

      <footer className="mx-auto mt-16 max-w-3xl pb-12 text-center text-xs text-mist/35">
        <p>
          Fonly bilgilendirme amaçlıdır ve yatırım tavsiyesi vermez. Tüm yatırım kararları kullanıcının sorumluluğundadır.
        </p>
      </footer>
    </main>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <div className="rounded-2xl bg-white/[0.02] p-4">
      <p className="flex items-start gap-2 text-mist/85">
        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
        <span className="font-medium">{q}</span>
      </p>
      <p className="mt-1.5 pl-6 text-xs leading-relaxed text-mist/55">{a}</p>
    </div>
  );
}

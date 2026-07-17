import Image from "next/image";
import {
  ArrowRight,
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

const HERO_FEATS = [
  "Her varlık için AI teknik analiz ve yorum",
  "Haber akışını tek paragrafa indiren özetler",
  "Portföyüne özel anlık soru-cevap",
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
      {/* Hero — "Data Stream" banner varyantı (assets/banners/fonlypro-ai) responsive hero olarak */}
      <section
        className="relative mx-auto mt-6 max-w-6xl overflow-hidden rounded-3xl border border-white/8"
        style={{
          background:
            "radial-gradient(circle at 100% 0%, rgba(232,121,249,0.13), transparent 30rem)," +
            "radial-gradient(circle at 0% 100%, rgba(103,232,249,0.10), transparent 28rem)," +
            "radial-gradient(circle at 70% 80%, rgba(45,227,168,0.10), transparent 26rem)," +
            "linear-gradient(160deg, #070b1d 0%, #0b1026 55%, #101a3a 100%)",
        }}
      >
        <HeroCandles />
        <div className="relative z-[1] flex flex-col gap-10 px-6 py-10 sm:px-10 lg:flex-row lg:items-center lg:gap-14 lg:px-14 lg:py-14">
          <div className="max-w-xl flex-1">
            <div className="mb-5 flex items-center gap-3">
              <Image
                src="/Fonly_Logo.png"
                alt="Fonly logosu"
                width={40}
                height={40}
                className="rounded-xl drop-shadow-[0_0_18px_rgba(34,211,238,0.45)]"
              />
              <span className="text-lg font-bold text-white">
                Fonly
                <span className="bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
                  Pro
                </span>
              </span>
            </div>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
              Veriyi herkes görür,{" "}
              <span className="block bg-gradient-to-r from-fuchsia-400 via-purple-400 to-cyan-300 bg-clip-text text-transparent">
                anlamı FonlyPro çıkarır
              </span>
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-mist-2 sm:text-base">
              Yapay zekâ; grafiklerin, bilançoların ve haber akışının içinden senin için sonuç
              çıkarır.
            </p>
            <ul className="mt-6 space-y-3">
              {HERO_FEATS.map(f => (
                <li
                  key={f}
                  className="flex items-center gap-3 text-sm font-medium text-mist-2 sm:text-[15px]"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-emerald-300/35 bg-emerald-300/15">
                    <Check className="h-3.5 w-3.5 text-emerald-300" strokeWidth={3} />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <a
                href="#planlar"
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-emerald-300 to-emerald-400 px-7 py-3.5 text-sm font-bold text-emerald-950 shadow-[0_0_44px_rgba(40,230,164,0.3)] transition hover:brightness-105"
              >
                {premium ? "Aboneliğini yönet" : "Premium'a Geç"}
                <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
              </a>
              <span className="text-sm text-mist-3">Tek abonelik · tüm varlıklar</span>
            </div>
          </div>

          {/* AI Analiz Motoru örnek paneli */}
          <div className="w-full max-w-md shrink-0 rounded-3xl bg-gradient-to-br from-fuchsia-400/40 via-white/5 to-emerald-300/35 p-px lg:w-[420px]">
            <div className="rounded-[calc(1.5rem-1px)] bg-gradient-to-br from-[#131c37]/95 to-[#0a1024]/90 p-6 shadow-2xl backdrop-blur-xl sm:p-7">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-sm font-bold text-white">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-fuchsia-300/35 bg-fuchsia-300/15 text-xs text-fuchsia-200">
                    ✦
                  </span>
                  AI Analiz Motoru
                </div>
                <span className="rounded-full border border-amber-200/30 bg-amber-300/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-200">
                  Yakında
                </span>
              </div>
              <svg className="mb-4 w-full" viewBox="0 0 456 130" fill="none" aria-hidden="true">
                <defs>
                  <linearGradient id="hero-spark" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#e879f9" stopOpacity="0.22" />
                    <stop offset="1" stopColor="#e879f9" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,100 C40,96 60,76 100,80 C140,84 160,58 200,62 C240,66 260,42 300,46 C340,50 360,26 400,22 C424,20 440,14 456,10 L456,130 L0,130 Z"
                  fill="url(#hero-spark)"
                />
                <path
                  d="M0,100 C40,96 60,76 100,80 C140,84 160,58 200,62 C240,66 260,42 300,46 C340,50 360,26 400,22 C424,20 440,14 456,10"
                  stroke="#e879f9"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d="M0,100 C40,90 70,86 110,92 C150,98 180,74 220,78 C260,82 290,60 330,58 C370,56 420,44 456,40"
                  stroke="#67e8f9"
                  strokeWidth="2"
                  strokeDasharray="6 7"
                  opacity="0.7"
                />
                <circle cx="456" cy="10" r="4.5" fill="#e879f9" />
                <circle cx="456" cy="10" r="9" fill="#e879f9" opacity="0.25" />
              </svg>
              <div className="space-y-2.5">
                <PanelRow k="Trend gücü" v="Güçlü yükseliş" cls="text-emerald-300" />
                <PanelRow k="RSI (14)" v="58,3 — nötr üstü" cls="text-cyan-300" />
                <PanelRow k="AI güven skoru" v="%84" cls="text-fuchsia-300" />
              </div>
              <p className="mt-4 text-xs leading-relaxed text-mist-3">
                <strong className="font-semibold text-emerald-200">Örnek çıktı:</strong> AI motoru
                bağlandığında analizler her varlık sayfasında otomatik görünecek.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing / Yönetim */}
      <div id="planlar" className="scroll-mt-32">
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
              className={`glass-card relative overflow-hidden rounded-3xl p-6 ${
                plan.highlight ? "glass-tint-premium glass-sheen" : ""
              }`}
            >
              {plan.highlight && (
                <span className="absolute right-4 top-4 rounded-full bg-fuchsia-300/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-fuchsia-100">
                  En popüler
                </span>
              )}
              <p className="text-sm font-semibold text-mist-2">{plan.name}</p>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-4xl font-semibold text-white">{plan.priceLabel}</span>
                <span className="text-sm text-mist-3">{plan.period}</span>
              </div>
              <p className="mt-1 text-xs text-mist-3">{plan.sub}</p>

              <CheckoutButton
                planId={plan.id}
                highlight={plan.highlight}
                label={`${plan.name} abone ol`}
              />
            </div>
          ))}
        </section>
      )}
      </div>

      {/* Features */}
      <section className="mx-auto mt-16 max-w-5xl">
        <h2 className="text-center text-xl font-semibold text-white sm:text-2xl">
          FonlyPro ile gelen özellikler
        </h2>
        <p className="mt-2 text-center text-sm text-mist-3">
          Tek abonelik, tüm varlıklar. &quot;Yakında&quot; işaretli AI özellikleri kademeli olarak
          devreye alınıyor — aktifleştiklerinde ek ücret olmadan aboneliğine dahil.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(f => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="glass-card relative rounded-2xl bg-white/[0.02] p-5"
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
                <p className="mt-1.5 text-xs leading-relaxed text-mist-3">{f.desc}</p>
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

      <footer className="mx-auto mt-16 max-w-3xl pb-12 text-center text-xs text-mist-3">
        <p>
          Fonly bilgilendirme amaçlıdır ve yatırım tavsiyesi vermez. Tüm yatırım kararları kullanıcının sorumluluğundadır.
        </p>
      </footer>
    </main>
  );
}

function PanelRow({ k, v, cls }: { k: string; v: string; cls: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm">
      <span className="font-medium text-mist-3">{k}</span>
      <span className={`font-bold tabular-nums ${cls}`}>{v}</span>
    </div>
  );
}

// Hero arka planındaki mum silüeti — dekoratif, küçük ekranlarda gizli
function HeroCandles() {
  const candles = [
    { x: 70,  y1: 120, y2: 360, ry: 170, h: 130, up: true },
    { x: 150, y1: 200, y2: 430, ry: 250, h: 120, up: false },
    { x: 230, y1: 150, y2: 400, ry: 190, h: 150, up: true },
    { x: 310, y1: 90,  y2: 330, ry: 130, h: 140, up: true },
    { x: 390, y1: 180, y2: 420, ry: 220, h: 130, up: false },
    { x: 470, y1: 110, y2: 350, ry: 150, h: 140, up: true },
    { x: 550, y1: 60,  y2: 290, ry: 95,  h: 130, up: true },
    { x: 630, y1: 130, y2: 370, ry: 170, h: 120, up: false },
    { x: 710, y1: 40,  y2: 260, ry: 70,  h: 125, up: true },
  ];
  return (
    <svg
      className="absolute right-0 top-0 hidden h-full opacity-50 md:block"
      width="760"
      viewBox="0 0 760 600"
      fill="none"
      aria-hidden="true"
    >
      <g opacity="0.16">
        {candles.map(c => {
          const color = c.up ? "#6ee7b7" : "#fda4af";
          return (
            <g key={c.x}>
              <line x1={c.x} y1={c.y1} x2={c.x} y2={c.y2} stroke={color} strokeWidth="2" />
              <rect x={c.x - 14} y={c.ry} width="28" height={c.h} rx="4" fill={color} />
            </g>
          );
        })}
      </g>
    </svg>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <div className="rounded-2xl bg-white/[0.02] p-4">
      <p className="flex items-start gap-2 text-mist-2">
        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
        <span className="font-medium">{q}</span>
      </p>
      <p className="mt-1.5 pl-6 text-xs leading-relaxed text-mist-3">{a}</p>
    </div>
  );
}

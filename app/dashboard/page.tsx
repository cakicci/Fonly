import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck, WalletCards, LineChart, Target } from "lucide-react";
import { auth } from "@/auth";

const dashboardCards = [
  {
    title: "Risk profilin",
    value: "Henüz seçilmedi",
    description: "Risk testini tamamladığında sana daha uygun bir başlangıç çerçevesi göstereceğiz.",
    icon: ShieldCheck
  },
  {
    title: "Aylık ayrılabilir tutar",
    value: "Belirlenmedi",
    description: "Gelirini ve temel giderlerini girdikten sonra daha sağlıklı bir tutar önerisi oluşur.",
    icon: WalletCards
  },
  {
    title: "Takip edilen karşılaştırma",
    value: "Altın kıyası",
    description: "Hisse artışlarını gram altınla kıyaslayarak sayıları daha anlaşılır hale getiririz.",
    icon: LineChart
  }
];

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-emerald-200">Fonly panelin</p>
            <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
              Hoş geldin, {session.user.name ?? "Fonly kullanıcısı"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-mist/64">
              Burası zamanla risk profilini, bütçe tercihlerini ve takip etmek istediğin sade finans rehberlerini toplayacak kişisel alanın.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-mist/14 bg-white/5 px-4 py-3 text-sm font-semibold text-mist transition hover:bg-white/10"
          >
            Ana sayfaya dön
          </Link>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {dashboardCards.map((card) => {
            const Icon = card.icon;

            return (
              <article key={card.title} className="glass-card rounded-[1.5rem] p-5">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-300/12 text-emerald-200">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-sm text-mist/58">{card.title}</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">{card.value}</h2>
                <p className="mt-3 text-sm leading-6 text-mist/64">{card.description}</p>
              </article>
            );
          })}
        </section>

        <section className="mt-6 rounded-[1.75rem] border border-emerald-200/18 bg-[linear-gradient(135deg,rgba(45,227,168,0.16),rgba(255,255,255,0.035))] p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-300 text-ink">
            <Target className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-semibold text-white">Sıradaki adım</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-mist/70">
            İlk sürümde hesabın güvenli şekilde oluşturuldu. Bir sonraki adımda risk testi sonuçlarını ve gelir-bütçe tercihlerini bu hesaba kaydedebiliriz.
          </p>
        </section>
      </div>
    </main>
  );
}

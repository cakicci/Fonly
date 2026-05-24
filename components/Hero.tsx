import { ArrowRight, BarChart3, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-line bg-[linear-gradient(135deg,rgba(16,35,31,0.96),rgba(6,18,16,0.88))] px-5 py-8 shadow-card sm:px-8 lg:px-10 lg:py-12">
      <div className="absolute left-8 top-8 h-40 w-40 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="absolute bottom-8 right-12 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />

      <div className="relative grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
        <div className="max-w-2xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-sm text-emerald-100">
            <Sparkles className="h-4 w-4" />
            Yeni başlayanlar için sade yatırım rehberi
          </div>
          <h1 className="text-4xl font-semibold leading-tight tracking-normal text-white sm:text-5xl lg:text-6xl">
            Finans bilmeden yatırım dünyasını keşfet.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-mist/76 sm:text-lg">
            Fonları ve hisseleri herkesin anlayacağı şekilde analiz et.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#funds"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-300 px-5 py-3 text-sm font-semibold text-ink shadow-glow transition hover:bg-emerald-200"
            >
              Fonları Keşfet
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#stocks"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-mist/14 bg-white/5 px-5 py-3 text-sm font-semibold text-mist transition hover:bg-white/10"
            >
              Hisseleri İncele
              <TrendingUp className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="relative min-h-[320px]">
          <div className="glass-card absolute right-0 top-0 w-full rounded-[1.5rem] p-5 sm:w-[88%]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-mist/50">Bugünkü görünüm</p>
                <p className="mt-1 text-2xl font-semibold text-white">Daha anlaşılır</p>
              </div>
              <div className="rounded-2xl bg-emerald-300/12 p-3 text-emerald-200">
                <BarChart3 className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-8 flex h-24 items-end gap-2">
              {[38, 54, 44, 72, 62, 88, 76, 96].map((height, index) => (
                <div
                  key={height + index}
                  className="flex-1 rounded-t-xl bg-gradient-to-t from-emerald-400/18 to-emerald-200"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-3">
                <p className="text-xs text-mist/54">Risk dili</p>
                <p className="mt-1 text-sm font-medium text-white">Sade ve net</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-3">
                <p className="text-xs text-mist/54">Veri yoğunluğu</p>
                <p className="mt-1 text-sm font-medium text-white">Kontrollü</p>
              </div>
            </div>
          </div>

          <div className="glass-card absolute bottom-0 left-0 w-[82%] rounded-[1.5rem] p-4 sm:w-[70%]">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-cyan-300/12 p-3 text-cyan-200">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Önce anlam, sonra karar</p>
                <p className="mt-2 text-sm leading-6 text-mist/64">
                  Her kart, yatırım fikrini günlük hayattan örneklerle açıklar.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

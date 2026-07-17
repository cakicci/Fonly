import Link from "next/link";
import { ArrowRight, BookOpen, Clock } from "lucide-react";
import type { Metadata } from "next";
import { GUIDE_CHAPTERS, TOTAL_READ_MIN } from "@/data/guide";

export const metadata: Metadata = {
  title: "Yatırım Rehberi",
  description:
    "Sıfırdan yatırıma: finansal okuryazarlığa yeni başlayanlar için 6 bölümlük Türkçe rehber.",
};

// Bölüm kart renkleri
const CHAPTER_ACCENTS = [
  { border: "border-emerald-200/18", num: "bg-emerald-300/12 text-emerald-300", dot: "bg-emerald-300" },
  { border: "border-rose-200/18",    num: "bg-rose-300/12 text-rose-300",       dot: "bg-rose-300"    },
  { border: "border-amber-200/18",   num: "bg-amber-300/12 text-amber-300",     dot: "bg-amber-300"   },
  { border: "border-cyan-200/18",    num: "bg-cyan-300/12 text-cyan-300",       dot: "bg-cyan-300"    },
  { border: "border-violet-200/18",  num: "bg-violet-300/12 text-violet-300",   dot: "bg-violet-300"  },
  { border: "border-sky-200/18",     num: "bg-sky-300/12 text-sky-300",         dot: "bg-sky-300"     },
];

export default function RehberPage() {
  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-6">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-mist-3">
          <Link href="/" className="transition hover:text-white">Ana Sayfa</Link>
          <span>/</span>
          <span className="text-white">Yatırım Rehberi</span>
        </nav>

        {/* Hero */}
        <div className="rounded-section border border-cyan-200/14
                        bg-[linear-gradient(135deg,rgba(165,243,252,0.07),rgba(11,16,38,0.98))] p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-300/12 text-cyan-200">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-cyan-200">Ücretsiz eğitim</p>
              <h1 className="mt-1 text-3xl font-semibold text-white sm:text-4xl">
                Yatırım Rehberi
              </h1>
              <p className="mt-3 max-w-xl text-base leading-7 text-mist-2">
                Finansal okuryazarlığa yeni başlayanlar için sade Türkçe ile yazılmış,
                adım adım yatırım izlencesi. Teknik jargon yok, abartılı vaat yok.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs text-mist-3">
                  <BookOpen className="h-3.5 w-3.5" />
                  6 bölüm
                </span>
                <span className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs text-mist-3">
                  <Clock className="h-3.5 w-3.5" />
                  ~{TOTAL_READ_MIN} dk toplam
                </span>
                <span className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs text-mist-3">
                  Türkiye&apos;ye özgü örnekler
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bölüm kartları */}
        <div className="space-y-3">
          {GUIDE_CHAPTERS.map((chapter, i) => {
            const accent = CHAPTER_ACCENTS[i];
            return (
              <Link
                key={chapter.slug}
                href={`/rehber/${chapter.slug}`}
                className={`group flex items-start gap-4 rounded-2xl border bg-white/[0.025] p-5
                            transition hover:bg-white/[0.05] ${accent.border}`}
              >
                {/* Numara + bağlantı çizgisi */}
                <div className="relative flex flex-col items-center">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${accent.num}`}>
                    {chapter.num}
                  </span>
                  {i < GUIDE_CHAPTERS.length - 1 && (
                    <span className={`mt-2 h-full w-px ${accent.dot} opacity-20`} style={{ minHeight: "1rem" }} />
                  )}
                </div>

                {/* İçerik */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-base font-semibold text-white">{chapter.title}</p>
                      <p className="mt-0.5 text-sm text-mist-3">{chapter.subtitle}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="flex items-center gap-1 text-xs text-mist-3">
                        <Clock className="h-3 w-3" />
                        {chapter.readingMin} dk
                      </span>
                      <ArrowRight className="h-4 w-4 text-mist-3 transition group-hover:translate-x-0.5 group-hover:text-mist-3" />
                    </div>
                  </div>

                  {/* Öğrenilecekler */}
                  <ul className="mt-3 space-y-1">
                    {chapter.objectives.map((obj) => (
                      <li key={obj} className="flex items-start gap-2 text-xs text-mist-3">
                        <span className={`mt-1.5 h-1 w-1 shrink-0 rounded-full ${accent.dot}`} />
                        {obj}
                      </li>
                    ))}
                  </ul>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Alt not */}
        <div className="rounded-2xl border border-white/6 bg-white/[0.02] p-5 text-center">
          <p className="text-sm leading-6 text-mist-3">
            Bu rehber eğitim amaçlıdır. Yatırım tavsiyesi değildir.
            Kararlarınızı vermeden önce mali danışmanlık almanız önerilir.
          </p>
        </div>

      </div>
    </main>
  );
}

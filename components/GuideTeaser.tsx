import Link from "next/link";
import { ArrowRight, BookOpen, Clock } from "lucide-react";
import { GUIDE_CHAPTERS, TOTAL_READ_MIN } from "@/data/guide";

export function GuideTeaser() {
  return (
    <section className="rounded-[1.75rem] border border-cyan-200/14
                        bg-[linear-gradient(135deg,rgba(165,243,252,0.05),rgba(11,16,38,0.98))] p-5 sm:p-6">

      {/* Başlık */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-300/12 text-cyan-200">
              <BookOpen className="h-4 w-4" />
            </div>
            <p className="text-sm font-medium text-cyan-200">Finans rehberi</p>
          </div>
          <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">
            Sıfırdan yatırıma:<br className="hidden sm:block" /> adım adım rehber
          </h2>
          <p className="mt-2 max-w-lg text-sm leading-6 text-mist/60">
            Finansal okuryazarlığa yeni başlayanlar için 6 bölümlük, sade Türkçe ile yazılmış ücretsiz yatırım izlencesi.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-2 text-xs text-mist/50 self-start sm:self-auto">
          <Clock className="h-3.5 w-3.5" />
          <span>Toplam ~{TOTAL_READ_MIN} dk okuma</span>
        </div>
      </div>

      {/* Bölüm adımları */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {GUIDE_CHAPTERS.map((chapter, i) => (
          <Link
            key={chapter.slug}
            href={`/rehber/${chapter.slug}`}
            className="group relative flex items-start gap-3 rounded-2xl border border-white/8
                       bg-white/[0.03] p-4 transition hover:border-cyan-200/25 hover:bg-white/[0.06]"
          >
            {/* Numara */}
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg
                             bg-cyan-300/10 text-xs font-bold text-cyan-300">
              {chapter.num}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white">{chapter.title}</p>
              <p className="mt-0.5 text-xs leading-4 text-mist/50">{chapter.tagline}</p>
              <div className="mt-2 flex items-center gap-1 text-[11px] text-mist/35">
                <Clock className="h-3 w-3" />
                {chapter.readingMin} dk
              </div>
            </div>
            {/* Hover ok */}
            <ArrowRight className="h-4 w-4 shrink-0 text-mist/20 transition group-hover:translate-x-0.5 group-hover:text-cyan-300/60 mt-0.5" />

            {/* İlk bölüme "Başla" etiketi */}
            {i === 0 && (
              <span className="absolute -top-2 -right-2 rounded-full bg-cyan-300 px-2 py-0.5 text-[10px] font-bold text-ink">
                Buradan başla
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* Alt CTA */}
      <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-white/6 bg-white/[0.025] px-4 py-3">
        <p className="text-sm text-mist/55">
          Tüm bölümleri görmek veya istediğin konudan başlamak için rehber ana sayfasına git.
        </p>
        <Link
          href="/rehber"
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-cyan-300/10 px-4 py-2
                     text-sm font-medium text-cyan-200 transition hover:bg-cyan-300/18"
        >
          Tüm rehber <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  );
}

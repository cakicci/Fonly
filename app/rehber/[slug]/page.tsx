import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, ExternalLink, Lightbulb, MapPin } from "lucide-react";
import type { Metadata } from "next";
import { GUIDE_CHAPTERS } from "@/data/guide";

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const chapter = GUIDE_CHAPTERS.find(c => c.slug === params.slug);
  if (!chapter) return { title: "Rehber — Fonly" };
  return {
    title: `${chapter.num}. ${chapter.title} — Yatırım Rehberi — Fonly`,
    description: chapter.subtitle,
  };
}

export function generateStaticParams() {
  return GUIDE_CHAPTERS.map(c => ({ slug: c.slug }));
}

// Bölüme özgü accent renkleri
const ACCENTS = [
  { border: "border-emerald-200/16", bg: "bg-[linear-gradient(135deg,rgba(45,227,168,0.07),rgba(11,16,38,0.98))]", text: "text-emerald-200", num: "bg-emerald-300/12 text-emerald-300", dot: "bg-emerald-300", takeaway: "border-emerald-200/20 bg-emerald-300/[0.05]", example: "border-amber-200/16 bg-amber-300/[0.04]", action: "border-cyan-200/18 bg-cyan-300/[0.05] text-cyan-200 hover:bg-cyan-300/[0.09]" },
  { border: "border-rose-200/16",    bg: "bg-[linear-gradient(135deg,rgba(253,164,175,0.07),rgba(11,16,38,0.98))]", text: "text-rose-200",    num: "bg-rose-300/12 text-rose-300",    dot: "bg-rose-300",    takeaway: "border-rose-200/20 bg-rose-300/[0.05]",    example: "border-amber-200/16 bg-amber-300/[0.04]", action: "border-cyan-200/18 bg-cyan-300/[0.05] text-cyan-200 hover:bg-cyan-300/[0.09]" },
  { border: "border-amber-200/16",   bg: "bg-[linear-gradient(135deg,rgba(251,191,36,0.07),rgba(11,16,38,0.98))]",  text: "text-amber-200",   num: "bg-amber-300/12 text-amber-300",   dot: "bg-amber-300",   takeaway: "border-amber-200/20 bg-amber-300/[0.05]",   example: "border-amber-200/16 bg-amber-300/[0.04]", action: "border-cyan-200/18 bg-cyan-300/[0.05] text-cyan-200 hover:bg-cyan-300/[0.09]" },
  { border: "border-cyan-200/16",    bg: "bg-[linear-gradient(135deg,rgba(165,243,252,0.07),rgba(11,16,38,0.98))]", text: "text-cyan-200",    num: "bg-cyan-300/12 text-cyan-300",    dot: "bg-cyan-300",    takeaway: "border-cyan-200/20 bg-cyan-300/[0.05]",    example: "border-amber-200/16 bg-amber-300/[0.04]", action: "border-cyan-200/18 bg-cyan-300/[0.05] text-cyan-200 hover:bg-cyan-300/[0.09]" },
  { border: "border-violet-200/16",  bg: "bg-[linear-gradient(135deg,rgba(196,181,253,0.07),rgba(11,16,38,0.98))]", text: "text-violet-200",  num: "bg-violet-300/12 text-violet-300",  dot: "bg-violet-300",  takeaway: "border-violet-200/20 bg-violet-300/[0.05]",  example: "border-amber-200/16 bg-amber-300/[0.04]", action: "border-cyan-200/18 bg-cyan-300/[0.05] text-cyan-200 hover:bg-cyan-300/[0.09]" },
  { border: "border-sky-200/16",     bg: "bg-[linear-gradient(135deg,rgba(186,230,253,0.07),rgba(11,16,38,0.98))]", text: "text-sky-200",     num: "bg-sky-300/12 text-sky-300",      dot: "bg-sky-300",     takeaway: "border-sky-200/20 bg-sky-300/[0.05]",      example: "border-amber-200/16 bg-amber-300/[0.04]", action: "border-cyan-200/18 bg-cyan-300/[0.05] text-cyan-200 hover:bg-cyan-300/[0.09]" },
];

export default function RehberChapterPage({ params }: { params: Params }) {
  const chapter = GUIDE_CHAPTERS.find(c => c.slug === params.slug);
  if (!chapter) notFound();

  const idx    = GUIDE_CHAPTERS.indexOf(chapter);
  const prev   = GUIDE_CHAPTERS[idx - 1] ?? null;
  const next   = GUIDE_CHAPTERS[idx + 1] ?? null;
  const accent = ACCENTS[idx] ?? ACCENTS[0];

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">

        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-mist/45">
          <Link href="/" className="transition hover:text-white">Ana Sayfa</Link>
          <span>/</span>
          <Link href="/rehber" className="transition hover:text-white">Yatırım Rehberi</Link>
          <span>/</span>
          <span className="text-white">{chapter.num}. {chapter.title}</span>
        </nav>

        {/* İlerleme göstergesi */}
        <div className="mb-6 flex items-center gap-2">
          {GUIDE_CHAPTERS.map((c, i) => (
            <Link
              key={c.slug}
              href={`/rehber/${c.slug}`}
              title={c.title}
              className={`h-1.5 flex-1 rounded-full transition ${
                i < idx   ? "bg-white/30" :
                i === idx ? (ACCENTS[i]?.dot ?? "bg-white") :
                            "bg-white/10"
              }`}
            />
          ))}
        </div>

        {/* Hero */}
        <div className={`mb-6 rounded-[1.75rem] border p-6 sm:p-8 ${accent.border} ${accent.bg}`}>
          <div className="flex items-start gap-4">
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl font-bold ${accent.num}`}>
              {chapter.num}
            </span>
            <div>
              <p className={`text-sm font-medium ${accent.text}`}>
                Bölüm {chapter.num} / {GUIDE_CHAPTERS.length}
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-white sm:text-3xl">
                {chapter.title}
              </h1>
              <p className="mt-2 text-base text-mist/64">{chapter.subtitle}</p>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-mist/40">
                <Clock className="h-3.5 w-3.5" />
                {chapter.readingMin} dakika okuma
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">

          {/* Bu bölümde öğreneceklerin */}
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-mist/40">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Bu bölümde öğreneceklerin
            </p>
            <ul className="space-y-2">
              {chapter.objectives.map((obj) => (
                <li key={obj} className="flex items-start gap-2.5 text-sm text-mist/70">
                  <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${accent.dot}`} />
                  {obj}
                </li>
              ))}
            </ul>
          </div>

          {/* Ana içerik bölümleri */}
          {chapter.sections.map((section, sIdx) => (
            <div key={sIdx} className="rounded-2xl border border-white/8 bg-white/[0.025] p-5">
              <h2 className="mb-4 text-base font-semibold text-white">{section.heading}</h2>
              <ul className="space-y-3">
                {section.items.map((item, iIdx) => (
                  <li key={iIdx} className="flex items-start gap-3 text-sm leading-6 text-mist/68">
                    <span className={`mt-2 h-1 w-4 shrink-0 rounded-full ${accent.dot} opacity-60`} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Türkiye pratiği */}
          <div className={`rounded-2xl border p-5 ${accent.example}`}>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-200/60">
              <MapPin className="h-3.5 w-3.5" />
              {chapter.turkeyExample.title}
            </p>
            <p className="text-sm leading-6 text-mist/68">{chapter.turkeyExample.body}</p>
          </div>

          {/* Aklında kalsın */}
          <div className={`rounded-2xl border p-5 ${accent.takeaway}`}>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-mist/40">
              <Lightbulb className="h-3.5 w-3.5" />
              Aklında kalsın
            </p>
            <p className="text-base font-semibold leading-7 text-white">
              {chapter.keyTakeaway}
            </p>
          </div>

          {/* Bunu dene — app aksiyonu */}
          <Link
            href={chapter.appAction.href}
            className={`flex items-start justify-between gap-4 rounded-2xl border p-5 transition ${accent.action}`}
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider opacity-60">
                Bunu şimdi dene
              </p>
              <p className="mt-1 text-base font-semibold">{chapter.appAction.label}</p>
              <p className="mt-1 text-sm opacity-70">{chapter.appAction.description}</p>
            </div>
            <ExternalLink className="h-5 w-5 shrink-0 opacity-50 mt-1" />
          </Link>

          {/* Önceki / Sonraki navigasyon */}
          <div className="grid gap-3 sm:grid-cols-2 pt-2">
            {prev ? (
              <Link
                href={`/rehber/${prev.slug}`}
                className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-4
                           transition hover:bg-white/[0.06]"
              >
                <ArrowLeft className="h-5 w-5 shrink-0 text-mist/40" />
                <div className="min-w-0">
                  <p className="text-xs text-mist/40">Önceki bölüm</p>
                  <p className="mt-0.5 truncate text-sm font-medium text-white">{prev.title}</p>
                </div>
              </Link>
            ) : (
              <Link
                href="/rehber"
                className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-4
                           transition hover:bg-white/[0.06]"
              >
                <ArrowLeft className="h-5 w-5 shrink-0 text-mist/40" />
                <div>
                  <p className="text-xs text-mist/40">Geri dön</p>
                  <p className="mt-0.5 text-sm font-medium text-white">Rehber ana sayfası</p>
                </div>
              </Link>
            )}

            {next ? (
              <Link
                href={`/rehber/${next.slug}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-white/8
                           bg-white/[0.03] p-4 transition hover:bg-white/[0.06]"
              >
                <div className="min-w-0">
                  <p className="text-xs text-mist/40">Sonraki bölüm</p>
                  <p className="mt-0.5 truncate text-sm font-medium text-white">{next.title}</p>
                </div>
                <ArrowRight className="h-5 w-5 shrink-0 text-mist/40" />
              </Link>
            ) : (
              <Link
                href="/rehber"
                className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-200/20
                           bg-emerald-300/[0.05] p-4 transition hover:bg-emerald-300/[0.09]"
              >
                <div>
                  <p className="text-xs text-emerald-200/60">Tebrikler, tamamladın!</p>
                  <p className="mt-0.5 text-sm font-medium text-white">Tüm rehberi gör</p>
                </div>
                <ArrowRight className="h-5 w-5 shrink-0 text-emerald-200/50" />
              </Link>
            )}
          </div>

          {/* Yasal not */}
          <div className="rounded-2xl border border-white/6 bg-white/[0.015] p-4 text-center">
            <p className="text-xs leading-5 text-mist/35">
              Bu içerik yalnızca eğitim amaçlıdır, yatırım tavsiyesi değildir.
              Yatırım kararı vermeden önce mali danışmanlık almanız önerilir.
            </p>
          </div>

        </div>
      </div>
    </main>
  );
}

import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";
import { LEGAL_PAGES, LEGAL_PAGE_MAP } from "@/data/legal";

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const page = LEGAL_PAGE_MAP[params.slug];
  if (!page) return { title: "Yasal" };
  return {
    title: page.title,
    description: page.description,
  };
}

export function generateStaticParams() {
  return LEGAL_PAGES.map((p) => ({ slug: p.slug }));
}

export default function LegalPage({ params }: { params: Params }) {
  const page = LEGAL_PAGE_MAP[params.slug];
  if (!page) notFound();

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <nav className="mb-6 flex items-center gap-2 text-sm text-mist-3">
          <Link href="/" className="transition hover:text-mist">Ana Sayfa</Link>
          <span>/</span>
          <Link href="/yasal" className="transition hover:text-mist">Yasal</Link>
          <span>/</span>
          <span className="text-mist">{page.shortTitle}</span>
        </nav>

        <div className="glass-card rounded-section p-6 sm:p-8">
          <h1 className="text-2xl font-semibold text-mist sm:text-3xl">{page.title}</h1>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-mist-3">
            <CalendarDays className="h-3.5 w-3.5" />
            Son güncelleme: {page.updatedAt}
          </p>

          <div className="mt-6 space-y-6">
            {page.sections.map((section, idx) => (
              <section key={idx}>
                {section.heading ? (
                  <h2 className="mb-2 text-base font-semibold text-mist">{section.heading}</h2>
                ) : null}
                {section.paragraphs?.map((p, pIdx) => (
                  <p key={pIdx} className="mb-2 text-sm leading-6 text-mist-2">{p}</p>
                ))}
                {section.bullets ? (
                  <ul className="space-y-2">
                    {section.bullets.map((item, iIdx) => (
                      <li key={iIdx} className="flex items-start gap-2.5 text-sm leading-6 text-mist-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-300/60" />
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {LEGAL_PAGES.filter((p) => p.slug !== page.slug).map((p) => (
            <Link
              key={p.slug}
              href={`/yasal/${p.slug}`}
              className="rounded-full border border-line bg-white/[0.04] px-4 py-2 text-xs font-medium text-mist-2 transition hover:bg-white/[0.08] hover:text-mist"
            >
              {p.shortTitle}
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

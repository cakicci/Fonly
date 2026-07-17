import Link from "next/link";
import type { Metadata } from "next";
import { ScrollText, ChevronRight } from "lucide-react";
import { LEGAL_PAGES } from "@/data/legal";

export const metadata: Metadata = {
  title: "Yasal Bilgiler",
  description:
    "Fonly'nin kullanım şartları, gizlilik ve KVKK politikaları, çerezler ve abonelik sözleşmeleri.",
};

export default function LegalIndexPage() {
  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <nav className="mb-6 flex items-center gap-2 text-sm text-mist-3">
          <Link href="/" className="transition hover:text-white">Ana Sayfa</Link>
          <span>/</span>
          <span className="text-white">Yasal</span>
        </nav>

        <div className="mb-6">
          <p className="flex items-center gap-2 text-sm font-medium text-emerald-200">
            <ScrollText className="h-4 w-4" />
            Yasal Bilgiler
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Politikalar ve sözleşmeler</h1>
          <p className="mt-3 text-sm leading-6 text-mist-2">
            Fonly&apos;yi kullanırken haklarını ve yükümlülüklerini düzenleyen tüm belgeler.
          </p>
        </div>

        <div className="space-y-3">
          {LEGAL_PAGES.map((page) => (
            <Link
              key={page.slug}
              href={`/yasal/${page.slug}`}
              className="glass-card glass-card-interactive flex items-center justify-between gap-4 rounded-2xl p-5"
            >
              <div>
                <p className="text-base font-semibold text-white">{page.title}</p>
                <p className="mt-1 text-sm text-mist-3">{page.description}</p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-mist-3" />
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

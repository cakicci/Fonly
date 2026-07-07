import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Search } from "lucide-react";

export const metadata: Metadata = {
  title: "Sayfa Bulunamadı",
};

const POPULAR = [
  { href: "/doviz", label: "Döviz Kurları" },
  { href: "/altin", label: "Altın & Gümüş" },
  { href: "/hisseler", label: "BIST Hisseleri" },
  { href: "/fonlar", label: "TEFAS Fonları" },
];

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="glass-card w-full max-w-lg rounded-[1.75rem] p-8 text-center">
        <p className="text-6xl font-bold text-emerald-300/40">404</p>
        <h1 className="mt-4 text-2xl font-semibold text-white">Sayfa bulunamadı</h1>
        <p className="mt-3 text-sm leading-6 text-mist/64">
          Aradığın sayfa taşınmış, kaldırılmış ya da hiç var olmamış olabilir.
          Bir varlık kodu yazdıysan doğru yazıldığından emin ol.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {POPULAR.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-mist/70 transition hover:bg-white/[0.08] hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-300 px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-emerald-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Ana sayfaya dön
          </Link>
          <p className="flex items-center gap-1.5 text-xs text-mist/40">
            <Search className="h-3.5 w-3.5" />
            Üst bardaki aramayla varlık bulabilirsin
          </p>
        </div>
      </div>
    </main>
  );
}

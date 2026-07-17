import Link from "next/link";
import Image from "next/image";
import { LEGAL_PAGES } from "@/data/legal";

const MARKET_LINKS = [
  { href: "/doviz", label: "Döviz Kurları" },
  { href: "/altin", label: "Altın & Gümüş" },
  { href: "/hisseler", label: "BIST Hisseleri" },
  { href: "/fonlar", label: "TEFAS Fonları" },
];

const APP_LINKS = [
  { href: "/rehber", label: "Yatırım Rehberi" },
  { href: "/risk-test", label: "Risk Testi" },
  { href: "/portfoy", label: "Portföyüm" },
  { href: "/premium", label: "Premium" },
];

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-white/8 bg-black/20">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="inline-flex items-center gap-2">
              <Image src="/Fonly_Logo.png" alt="Fonly" width={28} height={28} className="rounded-lg" />
              <span className="text-lg font-semibold text-white">Fonly</span>
            </Link>
            <p className="mt-3 text-xs leading-5 text-mist-3">
              Fonları, hisseleri ve piyasaları finans bilgisi az olan kullanıcılar
              için sade Türkçe ile açıklayan yatırım rehberi.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-mist-3">Piyasalar</p>
            <ul className="mt-3 space-y-2">
              {MARKET_LINKS.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-mist-3 transition hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-mist-3">Fonly</p>
            <ul className="mt-3 space-y-2">
              {APP_LINKS.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-mist-3 transition hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-mist-3">Yasal</p>
            <ul className="mt-3 space-y-2">
              {LEGAL_PAGES.map((page) => (
                <li key={page.slug}>
                  <Link
                    href={`/yasal/${page.slug}`}
                    className="text-sm text-mist-3 transition hover:text-white"
                  >
                    {page.shortTitle}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/6 pt-6">
          <p className="text-xs leading-5 text-mist-3">
            Fonly&apos;deki veriler ve analizler yalnızca bilgilendirme amaçlıdır,{" "}
            <Link href="/yasal/yasal-uyari" className="underline decoration-mist/25 underline-offset-2 transition hover:text-mist-3">
              yatırım tavsiyesi değildir
            </Link>
            . Fiyat verileri gecikmeli olabilir; doğruluğu garanti edilmez. Yatırım
            kararı vermeden önce yetkili bir kuruluştan profesyonel destek almanız önerilir.
          </p>
          <p className="mt-3 text-xs text-mist-3">
            © {new Date().getFullYear()} Fonly. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </footer>
  );
}

import Link from "next/link";
import Image from "next/image";
import { AuthNav } from "@/components/AuthNav";
import { HeaderSearch } from "./HeaderSearch";
import { MainNav } from "./MainNav";
import { SiteSubNav } from "./SiteSubNav";
import { MobileMenu } from "./MobileMenu";
import { ThemeToggle } from "./ThemeToggle";

/**
 * Global investing.com tarzı üst bar. Tüm sayfalarda render edilir
 * (app/layout.tsx içinden). İki satır:
 *   1) Logo + Arama + Ana menü + Auth + Mobil hamburger
 *   2) Hızlı kategori linkleri (SiteSubNav)
 *
 * Sticky — sayfa scroll edilirken üstte sabit kalır.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/85 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center gap-3 px-4 sm:gap-4 sm:px-6 lg:gap-6 lg:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5"
          aria-label="Fonly ana sayfa"
        >
          <Image
            src="/Fonly_Logo.png"
            alt="Fonly logosu"
            width={60}
            height={60}
            className="h-[60px] w-[60px] object-contain"
            priority
          />
          <span className="hidden text-2xl font-semibold tracking-tight text-mist sm:inline">
            Fonly
          </span>
        </Link>

        <div className="flex-1">
          <HeaderSearch />
        </div>

        <MainNav />

        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          <AuthNav />
          <MobileMenu />
        </div>
      </div>

      <SiteSubNav />
    </header>
  );
}

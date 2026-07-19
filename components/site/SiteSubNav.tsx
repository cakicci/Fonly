"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SUB_NAV_ITEMS } from "@/lib/site-nav";

/**
 * Alt sıra — hızlı kategori atlamaları. Investing.com'daki "Türkiye | Döviz |
 * Hisse..." satırının Fonly karşılığı. Yatay scroll, aktif segment highlight.
 *
 * Aktiflik: pathname tam eşit veya segment-prefix ile başlıyorsa.
 */
export function SiteSubNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "#") return false;
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav
      aria-label="Hızlı kategoriler"
      className="border-t border-line bg-ink/40"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-x-auto">
          <ul className="flex min-w-max items-center gap-1 py-2 text-xs">
            <li className="shrink-0">
              <Link
                href="/"
                className={`inline-flex items-center rounded-lg px-2.5 py-1 font-semibold transition ${
                  pathname === "/"
                    ? "bg-emerald-300/15 text-emerald-100"
                    : "text-mist-2 hover:bg-white/[0.04] hover:text-mist"
                }`}
              >
                Ana Sayfa
              </Link>
            </li>
            <li className="text-mist-3">|</li>
            {SUB_NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.label} className="shrink-0">
                  {item.comingSoon ? (
                    <span className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg px-2.5 py-1 text-mist-3">
                      {item.label}
                      <span className="rounded-md border border-line bg-white/[0.03] px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-mist-3">
                        Yakında
                      </span>
                    </span>
                  ) : (
                    <Link
                      href={item.href}
                      className={`inline-flex items-center rounded-lg px-2.5 py-1 transition ${
                        active
                          ? "text-emerald-200"
                          : "text-mist-2 hover:bg-white/[0.04] hover:text-mist"
                      }`}
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </nav>
  );
}

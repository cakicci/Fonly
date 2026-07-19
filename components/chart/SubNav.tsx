"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock } from "lucide-react";
import type { SubNavTab } from "@/lib/chart/subnav";

export interface SubNavProps {
  /** Asset base path, örn. "/hisse/ASELS". Sonunda slash yok. */
  basePath: string;
  tabs:     SubNavTab[];
}

/**
 * Investing.com benzeri yatay alt-sekme barı. Mobilde horizontal scroll.
 * Aktif sekme `usePathname()` ile belirlenir — segment match ile.
 */
export function SubNav({ basePath, tabs }: SubNavProps) {
  const pathname = usePathname();

  const isActive = (tabHref: string) => {
    const full = tabHref ? `${basePath}/${tabHref}` : basePath;
    // pathname asset root'una eşit + tab kök tab ise aktif
    if (tabHref === "") return pathname === basePath;
    return pathname === full || pathname.startsWith(`${full}/`);
  };

  return (
    <nav className="overflow-x-auto" aria-label="Sayfa sekmeleri">
      <div className="inline-flex min-w-full gap-1 rounded-2xl border border-line bg-white/[0.025] p-1">
        {tabs.map(tab => {
          const href = tab.href ? `${basePath}/${tab.href}` : basePath;
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.href || "root"}
              href={href}
              className={`shrink-0 whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                active
                  ? "bg-emerald-300/15 text-emerald-100"
                  : "text-mist-3 hover:bg-white/[0.04] hover:text-mist"
              }`}
            >
              <span className="inline-flex items-center gap-1">
                {tab.label}
                {tab.premium && <Lock className="h-2.5 w-2.5 opacity-60" />}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

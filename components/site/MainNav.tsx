"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { ChevronDown, Star } from "lucide-react";
import { MAIN_NAV_ITEMS, type MainNavItem } from "@/lib/site-nav";
import { useChartStore } from "@/lib/store/chartStore";
import { useMounted } from "@/lib/hooks/useMounted";

/**
 * Üst sıradaki ana menü:
 *   Piyasalar (mega) | İzleme Listem | Rehber | Risk Testi | Premium
 *
 * Hover veya click ile mega-menü açılır. Click-outside ile kapanır.
 * İzleme Listem global Watchlist drawer'ını açar (chartStore.drawerOpen).
 */
export function MainNav() {
  const [openMega, setOpenMega] = useState<string | null>(null);
  const setDrawerOpen = useChartStore((s) => s.setDrawerOpen);
  const ref = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();
  const isLight = mounted && resolvedTheme === "light";

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpenMega(null);
    }
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  const handleClick = (item: MainNavItem, e: React.MouseEvent) => {
    if (item.href === "#watchlist") {
      e.preventDefault();
      setDrawerOpen(true);
      setOpenMega(null);
    }
  };

  return (
    <div ref={ref} className="hidden items-center gap-1 lg:flex">
      {MAIN_NAV_ITEMS.map((item) => {
        const isMega = !!item.mega;
        const isOpen = openMega === item.label;
        const baseClasses =
          "inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-medium transition";
        const idleClasses = item.highlight
          ? isLight
            ? "bg-gradient-to-r from-fuchsia-500/10 to-emerald-500/10 ring-1 ring-fuchsia-500/25 hover:from-fuchsia-500/20 hover:to-emerald-500/20"
            : "bg-gradient-to-r from-fuchsia-300/10 to-emerald-300/10 ring-1 ring-fuchsia-300/25 hover:from-fuchsia-300/20 hover:to-emerald-300/20"
          : "text-mist-2 hover:bg-white/[0.04] hover:text-mist";

        const renderLabel = (label: string) =>
          item.highlight ? (
            <span className="bg-gradient-to-r from-fuchsia-200 to-emerald-200 bg-clip-text font-semibold text-transparent">
              {label}
            </span>
          ) : (
            label
          );

        if (isMega) {
          return (
            <div
              key={item.label}
              className="relative"
              onMouseEnter={() => setOpenMega(item.label)}
              onMouseLeave={() => setOpenMega(null)}
            >
              <button
                type="button"
                onClick={() => setOpenMega(isOpen ? null : item.label)}
                className={`${baseClasses} ${idleClasses}`}
                aria-expanded={isOpen}
                aria-haspopup="true"
              >
                {item.label}
                <ChevronDown
                  className={`h-3.5 w-3.5 transition ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {isOpen && (
                <div className="absolute left-1/2 top-full z-50 w-80 -translate-x-1/2 pt-2">
                  <div className="glass-card rounded-2xl p-2">
                    {item.mega!.map((sub) => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        onClick={() => setOpenMega(null)}
                        className="flex items-start gap-3 rounded-xl px-3 py-2.5 text-sm text-mist-2 transition hover:bg-white/[0.04] hover:text-mist"
                      >
                        <div>
                          <div className="font-medium text-mist">
                            {sub.label}
                          </div>
                          <div className="mt-0.5 text-xs text-mist-3">
                            {sub.description}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        }

        if (item.href === "#watchlist") {
          return (
            <button
              key={item.label}
              type="button"
              onClick={(e) => handleClick(item, e)}
              className={`${baseClasses} ${idleClasses}`}
            >
              <Star className="h-3.5 w-3.5" />
              {item.label}
            </button>
          );
        }

        return (
          <Link
            key={item.label}
            href={item.href ?? "#"}
            className={`${baseClasses} ${idleClasses}`}
          >
            {renderLabel(item.label)}
          </Link>
        );
      })}
    </div>
  );
}

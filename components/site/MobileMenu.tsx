"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { MAIN_NAV_ITEMS, SUB_NAV_ITEMS } from "@/lib/site-nav";
import { useChartStore } from "@/lib/store/chartStore";

/**
 * Mobil hamburger menü — lg breakpoint altında görünür.
 * Tüm ana ve alt menü öğelerini dikey listede sunar.
 */
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const setDrawerOpen = useChartStore((s) => s.setDrawerOpen);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-mist/80 transition hover:bg-white/[0.08] lg:hidden"
        aria-label="Menüyü aç"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="glass-card absolute right-0 top-0 flex h-full w-[85vw] max-w-sm flex-col overflow-y-auto rounded-l-3xl p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-mist/72">Menü</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-mist/65 transition hover:bg-white/[0.06] hover:text-white"
                aria-label="Kapat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-1">
              {MAIN_NAV_ITEMS.map((item) => {
                if (item.mega) {
                  return (
                    <div key={item.label} className="pt-2">
                      <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-mist/45">
                        {item.label}
                      </div>
                      {item.mega.map((sub) => (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className="block rounded-xl px-3 py-2 text-sm text-mist/80 transition hover:bg-white/[0.04] hover:text-white"
                        >
                          {sub.label}
                          <span className="block text-xs text-mist/45">
                            {sub.description}
                          </span>
                        </Link>
                      ))}
                    </div>
                  );
                }

                if (item.href === "#watchlist") {
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        setDrawerOpen(true);
                        setOpen(false);
                      }}
                      className="block w-full rounded-xl px-3 py-2 text-left text-sm text-mist/80 transition hover:bg-white/[0.04] hover:text-white"
                    >
                      {item.label}
                    </button>
                  );
                }

                return (
                  <Link
                    key={item.label}
                    href={item.href ?? "#"}
                    className={`block rounded-xl px-3 py-2 text-sm transition ${
                      item.highlight
                        ? "bg-emerald-300/15 text-emerald-100 hover:bg-emerald-300/25"
                        : "text-mist/80 hover:bg-white/[0.04] hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="mt-6 border-t border-white/8 pt-4">
              <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-mist/45">
                Hızlı bağlantılar
              </div>
              <div className="space-y-1">
                {SUB_NAV_ITEMS.map((item) =>
                  item.comingSoon ? (
                    <span
                      key={item.label}
                      className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-mist/35"
                    >
                      {item.label}
                      <span className="rounded-md border border-white/8 bg-white/[0.03] px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-mist/50">
                        Yakında
                      </span>
                    </span>
                  ) : (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="block rounded-xl px-3 py-2 text-sm text-mist/72 transition hover:bg-white/[0.04] hover:text-white"
                    >
                      {item.label}
                    </Link>
                  )
                )}
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

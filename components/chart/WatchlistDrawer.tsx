"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Star, Trash2, X } from "lucide-react";
import { useWatchlistStore } from "@/lib/store/watchlistStore";
import { parseAssetSlug } from "@/lib/chart/timeframe";

export function WatchlistDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { data: session } = useSession();
  const slugs   = useWatchlistStore((s) => s.slugs);
  const load    = useWatchlistStore((s) => s.load);
  const remove  = useWatchlistStore((s) => s.remove);

  useEffect(() => {
    if (open && session?.user?.id) load();
  }, [open, session?.user?.id, load]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const items = Array.from(slugs);

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <aside
        role="dialog"
        aria-label="İzleme listesi"
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col border-l border-white/10 bg-ink shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-white/8 px-5 py-4">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 fill-amber-300 text-amber-300" />
            <h2 className="text-lg font-semibold text-white">İzleme Listesi</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Kapat"
            className="rounded-lg p-1.5 text-mist/55 transition hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-3">
          {!session?.user?.id ? (
            <EmptyState
              title="Giriş yapmalısın"
              hint="İzleme listesi kullanıcılara özel — listenin DB'de saklanması için giriş yap."
              cta={{ href: "/login", label: "Giriş yap", onClick: onClose }}
            />
          ) : items.length === 0 ? (
            <EmptyState
              title="Henüz takip ettiğin yok"
              hint="Bir varlık sayfasına gidip yıldız ikonuna tıklayarak ekleyebilirsin."
            />
          ) : (
            <ul className="space-y-1.5">
              {items.map((slug) => {
                const { type, code } = parseAssetSlug(slug);
                const href = type === "fon" ? `/fon/${code.toLowerCase()}`
                  : type === "hisse" ? `/hisse/${code.toLowerCase()}`
                  : type === "altin" ? `/altin/${code.toLowerCase()}`
                  : type === "doviz" ? `/doviz/${code.toLowerCase()}`
                  : "/";

                return (
                  <li
                    key={slug}
                    className="group flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.025] px-3 py-2.5 transition hover:bg-white/[0.05]"
                  >
                    <Link href={href} onClick={onClose} className="flex-1 truncate text-sm font-medium text-white">
                      <span className="text-xs text-mist/40 uppercase tracking-wider mr-2">{type}</span>
                      {code.toUpperCase()}
                    </Link>
                    <button
                      onClick={() => remove(slug)}
                      aria-label={`${code} listeden çıkar`}
                      className="rounded-lg p-1.5 text-mist/35 opacity-0 transition group-hover:opacity-100 hover:bg-white/8 hover:text-rose-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
}

function EmptyState({
  title, hint, cta,
}: {
  title: string;
  hint: string;
  cta?: { href: string; label: string; onClick?: () => void };
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-10 text-center">
      <Star className="mb-4 h-10 w-10 text-mist/20" />
      <p className="text-base font-medium text-white">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-mist/45">{hint}</p>
      {cta && (
        <Link
          href={cta.href}
          onClick={cta.onClick}
          className="mt-5 rounded-xl bg-emerald-300 px-4 py-2 text-sm font-semibold text-ink shadow-glow transition hover:bg-emerald-200"
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}

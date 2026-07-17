"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { BIST_TICKERS } from "@/data/bist-tickers";
import { CURRENCIES } from "@/data/currencies";
import { GOLD_TYPES } from "@/data/gold-types";
import { normalizeTurkish } from "@/lib/tefas";
import type { FundListItem, FonlarResponse } from "@/app/api/fonlar/route";

interface ResultItem {
  href: string;
  primary: string;
  secondary: string;
  group: "Hisse" | "Fon" | "Döviz" | "Altın";
}

const GROUP_ORDER: ResultItem["group"][] = ["Hisse", "Fon", "Döviz", "Altın"];

const GROUP_COLORS: Record<ResultItem["group"], string> = {
  Hisse: "text-cyan-200",
  Fon: "text-emerald-200",
  Döviz: "text-mist-2",
  Altın: "text-amber-200",
};

const MAX_PER_GROUP = 5;

export function HeaderSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const [funds, setFunds] = useState<FundListItem[]>([]);
  const [fundsLoaded, setFundsLoaded] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = setTimeout(() => setDebounced(query.trim()), 150);
    return () => clearTimeout(handler);
  }, [query]);

  useEffect(() => {
    if (!open || fundsLoaded) return;
    let cancelled = false;
    fetch("/api/fonlar")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
      .then((data: FonlarResponse) => {
        if (cancelled) return;
        setFunds(data.funds ?? []);
        setFundsLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setFundsLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [open, fundsLoaded]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const typingInField =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (typingInField) {
        if (e.key === "Escape") {
          setOpen(false);
          inputRef.current?.blur();
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      } else if (e.key === "/") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  const results: ResultItem[] = useMemo(() => {
    if (!debounced) return [];
    const needle = normalizeTurkish(debounced);

    const hisse: ResultItem[] = BIST_TICKERS
      .filter(
        (t) =>
          normalizeTurkish(t.symbol).includes(needle) ||
          normalizeTurkish(t.name).includes(needle)
      )
      .slice(0, MAX_PER_GROUP)
      .map((t) => ({
        href: `/hisse/${t.symbol}`,
        primary: t.symbol,
        secondary: t.name,
        group: "Hisse",
      }));

    const fon: ResultItem[] = funds
      .filter(
        (f) =>
          normalizeTurkish(f.kod).includes(needle) ||
          normalizeTurkish(f.ad).includes(needle)
      )
      .slice(0, MAX_PER_GROUP)
      .map((f) => ({
        href: `/fon/${f.kod}`,
        primary: f.kod,
        secondary: f.ad,
        group: "Fon",
      }));

    const doviz: ResultItem[] = CURRENCIES
      .filter(
        (c) =>
          normalizeTurkish(c.code).includes(needle) ||
          normalizeTurkish(c.name).includes(needle) ||
          normalizeTurkish(c.shortName).includes(needle)
      )
      .slice(0, MAX_PER_GROUP)
      .map((c) => ({
        href: `/doviz/${c.code}`,
        primary: `${c.flag} ${c.code}`,
        secondary: c.name,
        group: "Döviz",
      }));

    const altin: ResultItem[] = GOLD_TYPES
      .filter(
        (g) =>
          normalizeTurkish(g.type).includes(needle) ||
          normalizeTurkish(g.name).includes(needle) ||
          normalizeTurkish(g.nameShort).includes(needle)
      )
      .slice(0, MAX_PER_GROUP)
      .map((g) => ({
        href: `/altin/${g.type}`,
        primary: g.name,
        secondary: g.nameShort,
        group: "Altın",
      }));

    return [...hisse, ...fon, ...doviz, ...altin];
  }, [debounced, funds]);

  useEffect(() => {
    setActiveIdx(0);
  }, [debounced]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      const item = results[activeIdx];
      if (item) {
        router.push(item.href);
        setOpen(false);
        setQuery("");
        inputRef.current?.blur();
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  const grouped = useMemo(() => {
    const map = new Map<ResultItem["group"], ResultItem[]>();
    for (const r of results) {
      if (!map.has(r.group)) map.set(r.group, []);
      map.get(r.group)!.push(r);
    }
    return GROUP_ORDER
      .map((g) => ({ group: g, items: map.get(g) ?? [] }))
      .filter((x) => x.items.length > 0);
  }, [results]);

  const showDropdown = open && debounced.length > 0;
  const flatIndexByItem = (target: ResultItem) =>
    results.findIndex((r) => r.href === target.href);

  return (
    <div ref={wrapperRef} className="relative w-full max-w-xl">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mist-3" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Hisse, fon, döviz veya altın ara..."
          className="w-full rounded-2xl border border-white/8 bg-white/[0.04] py-2 pl-9 pr-9 text-sm text-white placeholder:text-mist-3 outline-none transition focus:border-emerald-200/40 focus:bg-white/[0.07]"
          aria-label="Site içi arama"
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-mist-3 transition hover:bg-white/[0.06] hover:text-white"
            aria-label="Temizle"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        {!query && (
          <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-medium text-mist-3 sm:block">
            Ctrl K
          </kbd>
        )}
      </div>

      {showDropdown && (
        <div className="glass-card absolute left-0 right-0 top-full z-50 mt-2 max-h-[28rem] overflow-y-auto rounded-2xl p-2">
          {grouped.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-mist-3">
              {fundsLoaded
                ? `"${debounced}" için sonuç bulunamadı.`
                : "Sonuçlar yükleniyor..."}
            </div>
          ) : (
            grouped.map(({ group, items }) => (
              <div key={group} className="mb-1 last:mb-0">
                <div
                  className={`px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider ${GROUP_COLORS[group]}`}
                >
                  {group}
                </div>
                {items.map((item) => {
                  const idx = flatIndexByItem(item);
                  const active = idx === activeIdx;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => {
                        setOpen(false);
                        setQuery("");
                      }}
                      onMouseEnter={() => setActiveIdx(idx)}
                      className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm transition ${
                        active
                          ? "bg-white/[0.06] text-white"
                          : "text-mist-2 hover:bg-white/[0.04] hover:text-white"
                      }`}
                    >
                      <span className="font-medium">{item.primary}</span>
                      <span className="truncate text-xs text-mist-3">
                        {item.secondary}
                      </span>
                    </Link>
                  );
                })}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

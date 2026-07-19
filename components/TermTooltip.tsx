"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";
import { GLOSSARY, type GlossaryKey } from "@/data/glossary";

interface TermTooltipProps {
  /** Sözlük anahtarı — bulunamazsa (ör. dinamik etiket eşleşmedi) çocuklar düz metin olarak render edilir. */
  term: GlossaryKey | null | undefined;
  children: ReactNode;
}

const POPOVER_WIDTH = 224; // px — tailwind w-56
const GAP = 8;

/**
 * Bir terimin yanına (i) ikonu koyar; hover'da (masaüstü) veya tıklamada
 * (dokunmatik) 1 cümlelik sade açıklama gösterir.
 *
 * Popover `document.body`'ye portallanır ve `position: fixed` ile
 * konumlandırılır — `overflow-x-auto` tablo sarmalayıcıları içinde
 * kullanıldığında (teknik gösterge tabloları gibi) CSS'in overflow-x set
 * edilince overflow-y'yi de örtük olarak "auto" yapması yüzünden kırpılmasın diye.
 */
export function TermTooltip({ term, children }: TermTooltipProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const entry = term ? GLOSSARY[term] : null;

  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onScroll() {
      setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onOutside);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    let left = rect.left;
    if (left + POPOVER_WIDTH > window.innerWidth - GAP) {
      left = window.innerWidth - POPOVER_WIDTH - GAP;
    }
    if (left < GAP) left = GAP;
    setPos({ top: rect.bottom + GAP, left });
  }, [open]);

  if (!entry) return <>{children}</>;

  return (
    <span
      ref={wrapRef}
      className="relative inline-flex items-center gap-1"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {children}
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(true)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        aria-label={`${entry.term} nedir?`}
        aria-expanded={open}
        className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full text-mist-3 transition hover:text-emerald-200 focus-visible:text-emerald-200 focus-visible:outline-none"
      >
        <Info className="h-3 w-3" />
      </button>
      {open && pos &&
        createPortal(
          <span
            role="tooltip"
            style={{ top: pos.top, left: pos.left, width: POPOVER_WIDTH }}
            className="fixed z-50 rounded-xl border border-line bg-[#0d1430] p-3 text-left text-[11px] font-normal normal-case leading-relaxed text-mist-2 shadow-2xl"
          >
            <span className="mb-1 block text-[11px] font-semibold text-mist">{entry.term}</span>
            {entry.explanation}
          </span>,
          document.body
        )}
    </span>
  );
}

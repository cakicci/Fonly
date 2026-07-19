"use client";

import { useEffect, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { SubNav } from "./SubNav";
import type { SubNavTab } from "@/lib/chart/subnav";

const STORAGE_KEY = "fonly:gelismisGorunum";

interface SubNavWithToggleProps {
  basePath: string;
  tabs:     SubNavTab[];
}

/**
 * SubNav'ı "Basit görünüm" (varsayılan — sadece jargon içermeyen sekmeler) /
 * "Gelişmiş görünüm" (tüm sekmeler) ayrımıyla sarar. Tercih tüm varlık
 * sayfaları arasında paylaşılan tek bir localStorage bayrağıdır — kullanıcı
 * bir kez ayarlayınca her fon/hisse/döviz/altın sayfasında geçerli olur.
 */
export function SubNavWithToggle({ basePath, tabs }: SubNavWithToggleProps) {
  const [advanced, setAdvanced] = useState(false);
  const hasAdvancedTabs = tabs.some(t => t.advanced);

  useEffect(() => {
    try {
      setAdvanced(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      /* sessiz */
    }
  }, []);

  function toggle() {
    const next = !advanced;
    setAdvanced(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      /* sessiz — sadece bu oturumda hatırlanmaz */
    }
  }

  const visibleTabs = advanced ? tabs : tabs.filter(t => !t.advanced);

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <SubNav basePath={basePath} tabs={visibleTabs} />
      {hasAdvancedTabs && (
        <button
          type="button"
          onClick={toggle}
          aria-pressed={advanced}
          className={`inline-flex shrink-0 items-center gap-1.5 self-start rounded-xl border px-3 py-1.5 text-xs font-medium transition sm:self-auto ${
            advanced
              ? "border-fuchsia-300/30 bg-fuchsia-300/10 text-fuchsia-200"
              : "border-line bg-white/[0.03] text-mist-3 hover:text-mist"
          }`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          {advanced ? "Gelişmiş görünüm açık" : "Gelişmiş görünüm"}
        </button>
      )}
    </div>
  );
}

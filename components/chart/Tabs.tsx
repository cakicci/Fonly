"use client";

import { useState, type ReactNode } from "react";

export interface TabDef {
  key:   string;
  label: string;
  /** Görüntülenecek içerik. */
  content: ReactNode;
}

export function Tabs({
  tabs,
  defaultKey,
}: {
  tabs:        TabDef[];
  defaultKey?: string;
}) {
  const [active, setActive] = useState(defaultKey ?? tabs[0]?.key);

  if (tabs.length === 0) return null;
  const current = tabs.find(t => t.key === active) ?? tabs[0];

  return (
    <div className="space-y-4">
      <div
        className="inline-flex max-w-full overflow-x-auto rounded-2xl border border-white/8 bg-white/[0.025] p-1"
        role="tablist"
      >
        {tabs.map(t => (
          <button
            key={t.key}
            role="tab"
            aria-selected={t.key === current.key}
            onClick={() => setActive(t.key)}
            className={`shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition ${
              t.key === current.key
                ? "bg-emerald-300/15 text-emerald-100"
                : "text-mist/55 hover:bg-white/[0.04] hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel">{current.content}</div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { generateAnalysis, type AnalysisParams } from "@/lib/analysis";
import type { HistoryResponse } from "@/app/api/history/[slug]/route";

interface Props {
  slug: string
  type: AnalysisParams["type"]
  assetName: string
}

export function AnalysisCard({ slug, type, assetName }: Props) {
  const [lines, setLines] = useState<string[] | null>(null);

  useEffect(() => {
    fetch(`/api/history/${slug}?range=1y`)
      .then(r => (r.ok ? r.json() : null))
      .then((d: HistoryResponse | null) => {
        if (!d) return;
        setLines(
          generateAnalysis({
            type,
            assetName,
            changePercent:     d.summary.changePercent,
            compChangePercent: d.summary.compChangePercent,
            compName:          d.comp.name
          })
        );
      })
      .catch(() => {});
  }, [slug, type, assetName]);

  if (!lines) return null;

  return (
    <div className="rounded-panel border border-emerald-200/12 bg-emerald-300/[0.03] p-5">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-emerald-300" />
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-200">
          Basit Analiz (Son 1 Yıl)
        </p>
      </div>
      <div className="space-y-2">
        {lines.map((line, i) => (
          <p key={i} className="text-sm leading-6 text-mist-2">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

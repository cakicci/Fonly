"use client";

import { Sparkles } from "lucide-react";
import { AIButton } from "@/components/ai/AIButton";
import { parseAssetSlug } from "@/lib/chart/timeframe";
import { TIMEFRAME_LABELS } from "@/lib/chart/timeframe";
import type { TechnicalSummary, Timeframe } from "@/types/chart";

interface TechnicalAISummaryProps {
  slug:       string;
  assetName:  string;
  timeframe:  Timeframe;
  summary:    TechnicalSummary | null;
}

/**
 * Teknik analiz sayfasının üst kısmındaki AI özet banner'ı.
 *
 * Davranış (mevcut AIButton içinde):
 *   - Anonim   → /login
 *   - Free     → UpgradeModal
 *   - Premium  → AIDrawer → /api/ai/technical-summary (stub şimdilik)
 */
export function TechnicalAISummary({
  slug, assetName, timeframe, summary,
}: TechnicalAISummaryProps) {
  const { type } = parseAssetSlug(slug);
  if (!type) return null;

  const tfLabel = TIMEFRAME_LABELS[timeframe];
  const displayName = assetName || slug;

  return (
    <div className="glass-card relative overflow-hidden rounded-2xl bg-gradient-to-br from-fuchsia-300/10 via-purple-300/5 to-emerald-300/8 p-5">
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-fuchsia-300/10 blur-3xl" aria-hidden />
      <div className="absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-emerald-300/8 blur-3xl" aria-hidden />

      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-gradient-to-br from-fuchsia-300/25 to-emerald-300/20 p-2">
            <Sparkles className="h-4 w-4 text-fuchsia-200" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-fuchsia-200/80">
              FonlyPro · AI Teknik Özet
            </p>
            <h3 className="mt-0.5 text-sm font-semibold text-mist">
              {displayName} {tfLabel ? `· ${tfLabel}` : ""} sinyallerini Türkçe yorumlat
            </h3>
            <p className="mt-1 max-w-xl text-xs leading-relaxed text-mist-3">
              Hareketli ortalamalar, momentum ve trend göstergelerinin birleşimini saniyeler içinde
              okunur bir özete dönüştürür. Saniyelik veriye değil, seçtiğin zaman dilimine göre çalışır.
            </p>
          </div>
        </div>

        <AIButton
          type="technical-summary"
          label="AI Teknik Özet"
          size="md"
          variant="primary"
          context={{
            slug,
            assetType: type,
            assetName: displayName,
            extra: {
              timeframe,
              timeframeLabel: tfLabel,
              verdict:        summary?.verdict ?? null,
              totals:         summary?.totals  ?? null,
              lastPrice:      summary?.lastPrice ?? null,
              ma:             summary?.ma ?? null,
              indicators:     summary?.indicators ?? null,
            },
          }}
        />
      </div>
    </div>
  );
}

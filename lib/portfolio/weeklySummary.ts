import { prisma } from "@/lib/prisma";
import { fetchDailySeries } from "@/lib/history/series";
import { portfolioValueSeries } from "@/lib/portfolio/aggregate";
import { assetDisplayName } from "@/lib/portfolio/asset";

export interface PerformerInfo {
  name: string;
  pct: number;
}

export interface GoalProgress {
  title: string;
  pct: number;
  reached: boolean;
}

export interface WeeklySummary {
  changeValue:  number;
  changePct:    number | null;
  currentValue: number;
  bestPerformer:  PerformerInfo | null;
  worstPerformer: PerformerInfo | null;
  goals: GoalProgress[];
}

/**
 * Bir kullanıcının haftalık portföy özetini hesaplar — /api/portfolio/history
 * ile aynı altyapıyı ("1h" aralığı ≈ son 5 iş günü, bkz. lib/history/series.ts
 * RANGE_CFG) kullanır, ek bir canlı fiyat çağrısı gerektirmez (son gün
 * değeri "currentValue" olarak kullanılır).
 *
 * Portföyü boş olan veya yeterli fiyat geçmişi olmayan kullanıcı için null döner
 * — bu durumda özet e-postası hiç gönderilmez (boş/anlamsız mail atılmasın).
 */
export async function computeWeeklySummary(userId: string): Promise<WeeklySummary | null> {
  const lots = await prisma.portfolioLot.findMany({
    where: { userId, isDemo: false },
    select: { slug: true, side: true, quantity: true, unitCost: true, boughtAt: true },
  });
  if (lots.length === 0) return null;

  const slugs = Array.from(new Set(lots.map((l) => l.slug)));
  const seriesEntries = await Promise.all(
    slugs.map(async (slug) => [slug, await fetchDailySeries(slug, "1h")] as const)
  );
  const seriesBySlug = new Map(seriesEntries);

  const { points } = portfolioValueSeries(
    lots.map((l) => ({ ...l, at: l.boughtAt })),
    seriesBySlug
  );
  if (points.length < 2) return null;

  const first = points[0];
  const last  = points[points.length - 1];
  const changeValue = last.value - first.value;
  const changePct   = first.value > 0 ? (changeValue / first.value) * 100 : null;

  // Slug bazında haftalık % değişim — en çok yükselen/gerileyen için.
  const slugChanges: Array<{ slug: string; pct: number }> = [];
  for (const [slug, series] of seriesBySlug) {
    if (!series || series.size < 2) continue;
    const sorted = [...series.entries()].sort(([a], [b]) => a.localeCompare(b));
    const firstV = sorted[0][1];
    const lastV  = sorted[sorted.length - 1][1];
    if (firstV > 0) slugChanges.push({ slug, pct: ((lastV - firstV) / firstV) * 100 });
  }
  slugChanges.sort((a, b) => b.pct - a.pct);

  const bestPerformer = slugChanges.length > 0
    ? { name: assetDisplayName(slugChanges[0].slug), pct: slugChanges[0].pct }
    : null;
  const worstEntry = slugChanges.length > 1 ? slugChanges[slugChanges.length - 1] : null;
  const worstPerformer = worstEntry && worstEntry.slug !== slugChanges[0]?.slug
    ? { name: assetDisplayName(worstEntry.slug), pct: worstEntry.pct }
    : null;

  const goalRows = await prisma.goal.findMany({ where: { userId } });
  const goals: GoalProgress[] = goalRows.map((g) => ({
    title: g.title,
    pct: g.target > 0 ? Math.min((last.value / g.target) * 100, 100) : 0,
    reached: last.value >= g.target,
  }));

  return {
    changeValue,
    changePct,
    currentValue: last.value,
    bestPerformer,
    worstPerformer,
    goals,
  };
}

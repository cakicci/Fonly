import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { fetchDailySeries } from "@/lib/history/series";
import { portfolioValueSeries, type ValuePoint } from "@/lib/portfolio/aggregate";

export interface PortfolioHistoryResponse {
  points: ValuePoint[];
  /** Fiyat serisi bulunamadığı için grafikten hariç tutulan varlıklar. */
  missingSlugs: string[];
  range: string;
}

/**
 * GET /api/portfolio/history?range=3a|1y
 *
 * Kullanıcının portföy değerinin zaman serisi: her varlığın günlük fiyat
 * serisi (lib/history/series.ts) × o tarihte elde tutulan adet. Maliyet
 * çizgisi de döner (değer vs maliyet karşılaştırması). Seri üretilemeyen
 * varlıklar (antika altın vb.) hariç tutulur ve raporlanır.
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Giriş gerekli." }, { status: 401 });
  }

  const range = request.nextUrl.searchParams.get("range") ?? "1y";
  if (range !== "3a" && range !== "1y") {
    return NextResponse.json({ message: "Geçersiz aralık." }, { status: 400 });
  }
  const isDemo = request.nextUrl.searchParams.get("demo") === "1";

  const lots = await prisma.portfolioLot.findMany({
    where: { userId: session.user.id, isDemo },
    select: { slug: true, side: true, quantity: true, unitCost: true, boughtAt: true },
  });

  if (lots.length === 0) {
    return NextResponse.json<PortfolioHistoryResponse>({
      points: [],
      missingSlugs: [],
      range,
    });
  }

  const slugs = Array.from(new Set(lots.map((l) => l.slug)));
  const seriesEntries = await Promise.all(
    slugs.map(async (slug) => [slug, await fetchDailySeries(slug, range)] as const)
  );
  const seriesBySlug = new Map<string, Map<string, number> | null>(seriesEntries);

  const { points, missingSlugs } = portfolioValueSeries(
    lots.map((l) => ({ ...l, at: l.boughtAt })),
    seriesBySlug
  );

  return NextResponse.json<PortfolioHistoryResponse>({ points, missingSlugs, range });
}

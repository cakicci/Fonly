import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPricesForSlugs } from "@/lib/portfolio/price";
import { aggregatePositions } from "@/lib/portfolio/aggregate";
import { assetTypeOf } from "@/lib/portfolio/asset";
import { fetchCompanyProfile } from "@/lib/yahoo/profile";
import { isPremium } from "@/lib/auth/premium";

/**
 * Portföy X-Ray — açık hisse pozisyonlarının sektör kırılımı.
 * Sadece "hisse" tipindeki pozisyonlar dahil edilir (fon/döviz/altın için
 * sektör kavramı yok). Sektör verisi Yahoo profil endpoint'inden (bkz.
 * lib/yahoo/profile.ts), benzersiz semboller için paralel çekilir.
 */

export interface SectorBreakdownItem {
  sector: string;
  value:  number;
  pct:    number;
}

export interface SectorBreakdownResponse {
  items:      SectorBreakdownItem[];
  hisseValue: number;
  totalValue: number;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Giriş gerekli." }, { status: 401 });
  }

  // JWT'deki cache'lenmiş değere değil, DB'ye gerçek bakış.
  const premium = await isPremium(session.user.id);
  if (!premium) {
    return NextResponse.json({ message: "Bu özellik Premium aboneliğe özeldir." }, { status: 403 });
  }

  const lots = await prisma.portfolioLot.findMany({ where: { userId: session.user.id, isDemo: false } });
  const prices = await getPricesForSlugs(lots.map((l) => l.slug));
  const positions = aggregatePositions(
    lots.map((l) => ({ ...l, at: l.boughtAt })),
    prices
  );

  const totalValue = positions.reduce((sum, p) => sum + (p.value ?? 0), 0);
  const hissePositions = positions.filter(
    (p) => p.quantity > 1e-9 && p.value != null && assetTypeOf(p.slug) === "hisse"
  );
  const hisseValue = hissePositions.reduce((sum, p) => sum + (p.value ?? 0), 0);

  if (hissePositions.length === 0) {
    return NextResponse.json<SectorBreakdownResponse>({ items: [], hisseValue: 0, totalValue });
  }

  const symbols = Array.from(new Set(hissePositions.map((p) => p.slug.split("-")[1])));
  const profiles = await Promise.all(
    symbols.map((s) => fetchCompanyProfile(s).catch(() => null))
  );
  const sectorBySymbol = new Map<string, string>();
  symbols.forEach((s, i) => sectorBySymbol.set(s, profiles[i]?.sector || "Diğer"));

  const bySector = new Map<string, number>();
  for (const p of hissePositions) {
    const symbol = p.slug.split("-")[1];
    const sector = sectorBySymbol.get(symbol) ?? "Diğer";
    bySector.set(sector, (bySector.get(sector) ?? 0) + (p.value ?? 0));
  }

  const items: SectorBreakdownItem[] = Array.from(bySector.entries())
    .map(([sector, value]) => ({
      sector,
      value,
      pct: hisseValue > 0 ? (value / hisseValue) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);

  return NextResponse.json<SectorBreakdownResponse>({ items, hisseValue, totalValue });
}

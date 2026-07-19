import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isPremium } from "@/lib/auth/premium";

/**
 * GET /api/stock-analysis — /hisseler ekranındaki screener için risk/vade/AI
 * skoru verisi. Aynı free/premium mantığını /kategori/[key] ile paylaşır:
 * free kullanıcı yalnızca BIST 30 (isWellKnown) satırlarını görür, premium
 * tüm ~300 hisseyi görür. Fiyat/değişim burada yok — /api/bist'ten gelir,
 * istemci symbol'e göre birleştirir.
 */

export interface StockAnalysisItem {
  symbol:      string;
  name:        string;
  risk:        string;
  horizon:     string;
  isWellKnown: boolean;
  aiScore:     number;
}

export interface StockAnalysisResponse {
  items:      StockAnalysisItem[];
  premium:    boolean;
  totalCount: number;
}

export async function GET() {
  const session = await auth();
  const premium = await isPremium(session?.user?.id);

  const [items, totalCount] = await Promise.all([
    prisma.stockAnalysis.findMany({
      where:   premium ? {} : { isWellKnown: true },
      orderBy: [{ aiScore: "desc" }, { symbol: "asc" }],
      select:  { symbol: true, name: true, risk: true, horizon: true, isWellKnown: true, aiScore: true },
    }),
    prisma.stockAnalysis.count(),
  ]);

  return NextResponse.json<StockAnalysisResponse>({ items, premium, totalCount });
}

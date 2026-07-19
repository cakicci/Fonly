import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isPremium } from "@/lib/auth/premium";
import { assetDisplayName, assetTypeOf, ASSET_TYPE_LABELS } from "@/lib/portfolio/asset";

/**
 * Gerçek portföyün işlem kayıtlarını CSV olarak dışa aktarır — Premium'a özel.
 * Deneme portföyü hariçtir (gerçek finansal kayıt niteliği taşımaz).
 */

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
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

  const lots = await prisma.portfolioLot.findMany({
    where: { userId: session.user.id, isDemo: false },
    orderBy: { boughtAt: "asc" },
  });

  const header = ["Tarih", "Varlık", "Tür", "Yön", "Adet", "Birim Fiyat (TL)", "Toplam Tutar (TL)"];
  const rows = lots.map((l) => {
    const type = assetTypeOf(l.slug);
    const total = l.quantity * l.unitCost;
    return [
      l.boughtAt.toISOString().slice(0, 10),
      assetDisplayName(l.slug),
      type ? ASSET_TYPE_LABELS[type] : "",
      l.side === "sell" ? "Satış" : "Alış",
      l.quantity.toString(),
      l.unitCost.toFixed(2),
      total.toFixed(2),
    ]
      .map(csvEscape)
      .join(",");
  });

  // BOM — Excel'de Türkçe karakterlerin doğru görünmesi için.
  const BOM = String.fromCharCode(0xfeff);
  const csv = BOM + [header.join(","), ...rows].join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="fonly-portfoy-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}

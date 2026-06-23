import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPricesForSlugs } from "@/lib/portfolio/price";
import { aggregatePositions, portfolioSummary } from "@/lib/portfolio/aggregate";
import { normalizeAssetSlug } from "@/lib/portfolio/asset";

/**
 * Auth'lu kullanıcının portföyü.
 *
 * GET    → lot'lar + slug bazında pozisyonlar (canlı fiyat + K/Z) + özet
 * POST   → yeni lot ekle  { slug, quantity, unitCost, boughtAt?, note? }
 * DELETE → ?id= ile lot sil
 */

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Giriş gerekli." }, { status: 401 });
  }

  const lots = await prisma.portfolioLot.findMany({
    where: { userId: session.user.id },
    orderBy: { boughtAt: "desc" },
  });

  const prices = await getPricesForSlugs(lots.map((l) => l.slug));
  const positions = aggregatePositions(lots, prices);
  const summary = portfolioSummary(positions);

  return NextResponse.json({ lots, positions, summary });
}

const lotSchema = z.object({
  slug: z.string().min(3).max(40),
  quantity: z.number().positive("Adet 0'dan büyük olmalı.").finite(),
  unitCost: z.number().nonnegative("Maliyet negatif olamaz.").finite(),
  boughtAt: z.string().datetime().optional(),
  note: z.string().trim().max(200).optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Giriş gerekli." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = lotSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Geçersiz veri." },
      { status: 400 }
    );
  }

  const slug = normalizeAssetSlug(parsed.data.slug);
  if (!slug) {
    return NextResponse.json({ message: "Geçersiz veya bilinmeyen varlık." }, { status: 400 });
  }

  const lot = await prisma.portfolioLot.create({
    data: {
      userId: session.user.id,
      slug,
      quantity: parsed.data.quantity,
      unitCost: parsed.data.unitCost,
      boughtAt: parsed.data.boughtAt ? new Date(parsed.data.boughtAt) : undefined,
      note: parsed.data.note,
    },
  });

  return NextResponse.json({ lot }, { status: 201 });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Giriş gerekli." }, { status: 401 });
  }

  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ message: "Geçersiz id." }, { status: 400 });
  }

  // deleteMany ile userId şartı — başkasının lot'unu silemesin.
  const { count } = await prisma.portfolioLot.deleteMany({
    where: { id, userId: session.user.id },
  });

  if (count === 0) {
    return NextResponse.json({ message: "Kayıt bulunamadı." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

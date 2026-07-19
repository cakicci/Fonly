import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isPremium } from "@/lib/auth/premium";

/**
 * Net değer takibi — portföy dışı varlık/borç kalemleri. Premium'a özel.
 *
 * GET    → kalem listesi (yeni → eski)
 * POST   → yeni kalem  { name, kind, value }
 * DELETE → ?id= ile kalem sil
 */

const MAX_ITEMS = 30;

async function requirePremium(userId: string): Promise<NextResponse | null> {
  const premium = await isPremium(userId);
  if (!premium) {
    return NextResponse.json({ message: "Bu özellik Premium aboneliğe özeldir." }, { status: 403 });
  }
  return null;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Giriş gerekli." }, { status: 401 });
  }

  const denied = await requirePremium(session.user.id);
  if (denied) return denied;

  const items = await prisma.otherAsset.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ items });
}

const itemSchema = z.object({
  name:  z.string().trim().min(1, "Ad gir.").max(60, "Ad çok uzun."),
  kind:  z.enum(["asset", "liability"]).default("asset"),
  value: z.number().positive("Tutar 0'dan büyük olmalı.").finite().max(1_000_000_000, "Tutar çok büyük."),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Giriş gerekli." }, { status: 401 });
  }

  const denied = await requirePremium(session.user.id);
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  const parsed = itemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Geçersiz veri." },
      { status: 400 }
    );
  }

  const count = await prisma.otherAsset.count({ where: { userId: session.user.id } });
  if (count >= MAX_ITEMS) {
    return NextResponse.json({ message: `En fazla ${MAX_ITEMS} kalem ekleyebilirsin.` }, { status: 400 });
  }

  const item = await prisma.otherAsset.create({
    data: {
      userId: session.user.id,
      name:   parsed.data.name,
      kind:   parsed.data.kind,
      value:  parsed.data.value,
    },
  });

  return NextResponse.json({ item }, { status: 201 });
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

  // deleteMany ile userId şartı — başkasının kalemini silemesin.
  const { count } = await prisma.otherAsset.deleteMany({
    where: { id, userId: session.user.id },
  });

  if (count === 0) {
    return NextResponse.json({ message: "Kayıt bulunamadı." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

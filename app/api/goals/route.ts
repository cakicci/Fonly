import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * Auth'lu kullanıcının birikim/yatırım hedefleri.
 *
 * GET    → hedef listesi (yeni → eski)
 * POST   → yeni hedef  { title, target, targetDate? }
 * DELETE → ?id= ile hedef sil
 *
 * İlerleme (portföy değerine göre) UI tarafında hesaplanır — burada saklanmaz.
 */

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Giriş gerekli." }, { status: 401 });
  }

  const goals = await prisma.goal.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ goals });
}

const goalSchema = z.object({
  title: z.string().trim().min(1, "Başlık gir.").max(60, "Başlık çok uzun."),
  // 32-bit Int sınırı içinde (PostgreSQL INTEGER) — kişisel hedefler için fazlasıyla yeterli.
  target: z
    .number()
    .int("Tutar tam sayı olmalı.")
    .positive("Tutar 0'dan büyük olmalı.")
    .max(2_000_000_000, "Tutar çok büyük."),
  targetDate: z.string().datetime().optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Giriş gerekli." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = goalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Geçersiz veri." },
      { status: 400 }
    );
  }

  // Aşırı birikmeyi engelle — kullanıcı başına makul üst sınır.
  const count = await prisma.goal.count({ where: { userId: session.user.id } });
  if (count >= 20) {
    return NextResponse.json({ message: "En fazla 20 hedef ekleyebilirsin." }, { status: 400 });
  }

  const goal = await prisma.goal.create({
    data: {
      userId: session.user.id,
      title: parsed.data.title,
      target: parsed.data.target,
      targetDate: parsed.data.targetDate ? new Date(parsed.data.targetDate) : undefined,
    },
  });

  return NextResponse.json({ goal }, { status: 201 });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Giriş gerekli." }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ message: "Geçersiz id." }, { status: 400 });
  }

  // deleteMany ile userId şartı — başkasının hedefini silemesin.
  const { count } = await prisma.goal.deleteMany({
    where: { id, userId: session.user.id },
  });

  if (count === 0) {
    return NextResponse.json({ message: "Kayıt bulunamadı." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

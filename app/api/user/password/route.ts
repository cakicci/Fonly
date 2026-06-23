import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

/**
 * POST /api/user/password
 *
 * Şifre değiştirme (in-app). İki durum:
 *  - Kullanıcının zaten şifresi varsa (Credentials) → `currentPassword` doğrulanır.
 *  - Sadece Google ile girmiş, hiç şifresi yoksa → ilk şifreyi belirler
 *    (currentPassword istenmez). Böylece OAuth kullanıcısı e-posta+şifre girişini de açabilir.
 *
 * Body: { currentPassword?: string, newPassword: string }
 */
const schema = z.object({
  currentPassword: z.string().max(120).optional(),
  newPassword: z.string().min(8, "Yeni şifre en az 8 karakter olmalı.").max(120),
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limited = rateLimit(`password:${ip}`, { limit: 8, windowMs: 10 * 60 * 1000 });
  if (!limited.ok) {
    return NextResponse.json(
      { message: "Çok fazla deneme. Lütfen biraz sonra tekrar dene." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
    );
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Giriş gerekli." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Geçersiz veri." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });
  if (!user) {
    return NextResponse.json({ message: "Kullanıcı bulunamadı." }, { status: 404 });
  }

  // Mevcut şifre varsa doğrula.
  if (user.passwordHash) {
    if (!parsed.data.currentPassword) {
      return NextResponse.json({ message: "Mevcut şifreni gir." }, { status: 400 });
    }
    const ok = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ message: "Mevcut şifre yanlış." }, { status: 403 });
    }
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash },
  });

  return NextResponse.json({ ok: true, message: "Şifren güncellendi." });
}

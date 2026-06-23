import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { hashResetToken, isTokenExpired } from "@/lib/auth/password-reset";

/**
 * POST /api/auth/reset-password
 *
 * Body: { token, password }
 *
 * E-postadaki ham token'ı doğrular (hash karşılaştırma + süre), geçerliyse
 * kullanıcının şifresini günceller ve token'ı siler (tek kullanım). OAuth-only
 * kullanıcıya da şifre belirletir (passwordHash null → set).
 */
const schema = z.object({
  token: z.string().min(10).max(200),
  password: z.string().min(8, "Şifre en az 8 karakter olmalı.").max(120),
});

const RESET_LIMIT = 8;
const RESET_WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limited = rateLimit(`reset:${ip}`, { limit: RESET_LIMIT, windowMs: RESET_WINDOW_MS });
  if (!limited.ok) {
    return NextResponse.json(
      { message: "Çok fazla deneme. Lütfen biraz sonra tekrar dene." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Geçersiz veri." },
      { status: 400 }
    );
  }

  const tokenHash = hashResetToken(parsed.data.token);
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

  if (!record || isTokenExpired(record.expires)) {
    // Süresi dolmuş kaydı temizle (varsa).
    if (record) {
      await prisma.passwordResetToken.delete({ where: { id: record.id } }).catch(() => {});
    }
    return NextResponse.json(
      { message: "Bağlantı geçersiz veya süresi dolmuş. Lütfen yeni bir sıfırlama isteği oluştur." },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  // Şifreyi güncelle + kullanıcının tüm sıfırlama token'larını sil (tek kullanım).
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.deleteMany({ where: { userId: record.userId } }),
  ]);

  return NextResponse.json({
    ok: true,
    message: "Şifren güncellendi. Artık yeni şifrenle giriş yapabilirsin.",
  });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { generateResetToken, hashResetToken, resetTokenExpiry } from "@/lib/auth/password-reset";
import { sendPasswordResetEmail } from "@/lib/mail/mailer";

/**
 * POST /api/auth/forgot-password
 *
 * Body: { email }
 *
 * E-posta kayıtlıysa şifre sıfırlama token'ı üretir, hash'ini saklar ve linki
 * mail atar. GÜVENLİK: e-posta var/yok bilgisini sızdırmamak için kayıt olsa da
 * olmasa da HER ZAMAN aynı 200 yanıtı döner (kullanıcı enumerasyonunu engeller).
 */
const schema = z.object({ email: z.string().trim().email().max(160) });

const FORGOT_LIMIT = 3;
const FORGOT_WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limited = rateLimit(`forgot:${ip}`, { limit: FORGOT_LIMIT, windowMs: FORGOT_WINDOW_MS });
  if (!limited.ok) {
    return NextResponse.json(
      { message: "Çok fazla deneme. Lütfen biraz sonra tekrar dene." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
    );
  }

  // Her durumda dönülecek nötr yanıt — e-posta varlığını sızdırmaz.
  const neutral = () =>
    NextResponse.json({
      ok: true,
      message: "Eğer bu e-posta kayıtlıysa, şifre sıfırlama bağlantısı gönderildi.",
    });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return neutral();

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });

  if (user?.email) {
    // Aynı kullanıcı için tek aktif token: eskilerini sil, yenisini oluştur.
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
    const token = generateResetToken();
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashResetToken(token),
        expires: resetTokenExpiry(),
      },
    });
    await sendPasswordResetEmail(user.email, token);
  }

  return neutral();
}

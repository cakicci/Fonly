import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getActiveProvider } from "@/lib/billing/provider";
import { getPlan } from "@/lib/billing/plans";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

/**
 * POST /api/checkout
 *
 * Auth'lu kullanıcı için aktif ödeme sağlayıcısında bir ödeme oturumu açar ve
 * yönlendirileceği URL'i döner. Body: `{ plan: "monthly" | "yearly" }`.
 * Sağlayıcıdan bağımsız — `getActiveProvider()` (env `PAYMENT_PROVIDER`) ne
 * dönerse onu kullanır.
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limited = rateLimit(`checkout:${ip}`, { limit: 10, windowMs: 5 * 60 * 1000 });
  if (!limited.ok) {
    return NextResponse.json(
      { message: "Çok fazla deneme. Lütfen biraz sonra tekrar dene." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
    );
  }

  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ message: "Giriş gerekli." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const plan = getPlan(body?.plan);
  if (!plan) {
    return NextResponse.json({ message: "Geçersiz plan." }, { status: 400 });
  }

  const origin = request.headers.get("origin") ?? new URL(request.url).origin;

  try {
    const provider = getActiveProvider();
    const result = await provider.createCheckout({
      user: { id: session.user.id, email: session.user.email },
      plan: plan.id,
      successUrl: `${origin}/dashboard?upgraded=1`,
      cancelUrl: `${origin}/premium`,
    });
    return NextResponse.json({ redirectUrl: result.redirectUrl });
  } catch (err) {
    console.error("[checkout] sağlayıcı hatası:", err);
    return NextResponse.json(
      { message: "Ödeme başlatılamadı. Lütfen daha sonra tekrar dene." },
      { status: 502 }
    );
  }
}

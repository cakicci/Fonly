import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { cancelAtPeriodEnd } from "@/lib/billing/subscription";
import { getActiveProvider } from "@/lib/billing/provider";

/**
 * POST /api/subscription/cancel
 *
 * "Tek tıkla iptal" — aboneliği dönem sonunda biter şekilde işaretler. Erişim
 * `currentPeriodEnd`'e kadar sürer (anında kesilmez). Sağlayıcı destekliyorsa
 * (iyzico) yenileme sağlayıcı tarafında da durdurulur.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Giriş gerekli." }, { status: 401 });
  }

  const sub = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
    select: {
      status: true,
      cancelAtPeriodEnd: true,
      currentPeriodEnd: true,
      providerSubscriptionId: true,
    },
  });

  if (!sub || (sub.status !== "active" && sub.status !== "trialing")) {
    return NextResponse.json({ message: "Aktif abonelik bulunamadı." }, { status: 404 });
  }

  if (!sub.cancelAtPeriodEnd) {
    // Önce sağlayıcı tarafında yenilemeyi durdur — başarısızsa DB'ye yazma ki
    // kullanıcı tekrar deneyebilsin (aksi hâlde "iptal edildi" görünüp
    // sağlayıcıda tahsilat devam ederdi).
    try {
      const provider = getActiveProvider();
      if (provider.cancelAtProvider && sub.providerSubscriptionId) {
        await provider.cancelAtProvider(sub.providerSubscriptionId);
      }
    } catch (err) {
      console.error("[cancel] sağlayıcı iptali başarısız:", err);
      return NextResponse.json(
        { message: "İptal şu anda tamamlanamadı. Lütfen tekrar dene." },
        { status: 502 }
      );
    }

    await cancelAtPeriodEnd(session.user.id);
  }

  return NextResponse.json({ ok: true, currentPeriodEnd: sub.currentPeriodEnd });
}

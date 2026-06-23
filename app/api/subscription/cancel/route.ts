import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { cancelAtPeriodEnd } from "@/lib/billing/subscription";

/**
 * POST /api/subscription/cancel
 *
 * "Tek tıkla iptal" — aboneliği dönem sonunda biter şekilde işaretler. Erişim
 * `currentPeriodEnd`'e kadar sürer (anında kesilmez). Gerçek PSP eklenince
 * burada sağlayıcının iptal API'si de çağrılır (yenilemeyi durdurmak için).
 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Giriş gerekli." }, { status: 401 });
  }

  const sub = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
    select: { status: true, cancelAtPeriodEnd: true, currentPeriodEnd: true },
  });

  if (!sub || (sub.status !== "active" && sub.status !== "trialing")) {
    return NextResponse.json({ message: "Aktif abonelik bulunamadı." }, { status: 404 });
  }

  if (!sub.cancelAtPeriodEnd) {
    await cancelAtPeriodEnd(session.user.id);
  }

  return NextResponse.json({ ok: true, currentPeriodEnd: sub.currentPeriodEnd });
}

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/user/export — KVKK/GDPR veri taşınabilirliği.
 *
 * Kullanıcının tüm verisini tek JSON dosyası olarak indirir. Hassas alanlar
 * (passwordHash, OAuth token'ları) hariç tutulur.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Giriş gerekli." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      riskProfile: true,
      monthlyIncome: true,
      createdAt: true,
      watchlist: { select: { slug: true, createdAt: true } },
      priceAlerts: {
        select: { slug: true, condition: true, threshold: true, active: true, triggeredAt: true, createdAt: true },
      },
      portfolioLots: {
        select: { slug: true, quantity: true, unitCost: true, boughtAt: true, note: true },
      },
      subscription: {
        select: { plan: true, status: true, currentPeriodStart: true, currentPeriodEnd: true, cancelAtPeriodEnd: true },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ message: "Kullanıcı bulunamadı." }, { status: 404 });
  }

  const payload = { exportedAt: new Date().toISOString(), user };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="fonly-verilerim.json"`,
    },
  });
}

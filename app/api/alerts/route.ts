import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isPremium } from "@/lib/auth/premium";

/** Ücretsiz planda eş zamanlı aktif alarm üst sınırı — Premium'da sınırsız. */
const FREE_ALERT_LIMIT = 5;

const SlugSchema = z
  .string()
  .min(3)
  .max(40)
  .regex(/^(hisse|doviz|altin|fon)-[A-Za-z0-9]+$/);

const CreateAlertSchema = z.object({
  slug:        SlugSchema,
  triggerType: z.enum(["price", "percent_change"]).default("price"),
  condition:   z.enum(["above", "below"]),
  // percent_change'de bu yüzde puanı ifade eder (örn. 5 = %5) — 100'ün üzerine
  // izin vermek anlamsız, makul bir üst sınır koyar.
  threshold:   z.number().positive().finite().max(1_000_000),
});

/** GET /api/alerts — kullanıcının tüm alarmları. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ items: [] });
  }

  const items = await prisma.priceAlert.findMany({
    where:   { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ items });
}

/** POST /api/alerts — body: { slug, condition, threshold }. */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = CreateAlertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Geçersiz veri", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  // JWT'deki cache'lenmiş değere değil, DB'ye gerçek bakış.
  const premium = await isPremium(session.user.id);

  if (!premium && parsed.data.triggerType === "percent_change") {
    return NextResponse.json(
      { error: "Yüzde değişim alarmı Premium aboneliğe özeldir." },
      { status: 403 }
    );
  }

  if (!premium) {
    const activeCount = await prisma.priceAlert.count({
      where: { userId: session.user.id, active: true },
    });
    if (activeCount >= FREE_ALERT_LIMIT) {
      return NextResponse.json(
        {
          error: `Ücretsiz planda en fazla ${FREE_ALERT_LIMIT} aktif alarm kurabilirsin — Premium'da sınırsız.`,
        },
        { status: 403 }
      );
    }
  }

  const alert = await prisma.priceAlert.create({
    data: {
      userId:      session.user.id,
      slug:        parsed.data.slug,
      triggerType: parsed.data.triggerType,
      condition:   parsed.data.condition,
      threshold:   parsed.data.threshold,
      active:      true,
    },
  });

  return NextResponse.json({ ok: true, alert });
}

/** DELETE /api/alerts?id=123 */
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const id = parseInt(req.nextUrl.searchParams.get("id") ?? "", 10);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: "Geçersiz id" }, { status: 400 });
  }

  await prisma.priceAlert.deleteMany({
    where: { id, userId: session.user.id },
  });

  return NextResponse.json({ ok: true });
}

/** PATCH /api/alerts?id=123 — acknowledge tetiklenmiş alarm. */
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const id = parseInt(req.nextUrl.searchParams.get("id") ?? "", 10);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: "Geçersiz id" }, { status: 400 });
  }

  await prisma.priceAlert.updateMany({
    where: { id, userId: session.user.id },
    data:  { acknowledged: true },
  });

  return NextResponse.json({ ok: true });
}

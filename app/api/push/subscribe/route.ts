import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isPremium } from "@/lib/auth/premium";

const SubscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth:   z.string().min(1),
  }),
});

/** POST /api/push/subscribe — tarayıcının PushManager aboneliğini kaydeder. */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  // JWT'deki cache'lenmiş değere değil, DB'ye gerçek bakış.
  const premium = await isPremium(session.user.id);
  if (!premium) {
    return NextResponse.json(
      { error: "Anlık tarayıcı bildirimleri Premium aboneliğe özeldir." },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = SubscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where:  { endpoint: parsed.data.endpoint },
    update: { userId: session.user.id, p256dh: parsed.data.keys.p256dh, auth: parsed.data.keys.auth },
    create: {
      userId:   session.user.id,
      endpoint: parsed.data.endpoint,
      p256dh:   parsed.data.keys.p256dh,
      auth:     parsed.data.keys.auth,
    },
  });

  return NextResponse.json({ ok: true });
}

/** DELETE /api/push/subscribe — body: { endpoint }. Aboneliği iptal eder. */
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const endpoint = typeof body?.endpoint === "string" ? body.endpoint : null;
  if (!endpoint) {
    return NextResponse.json({ error: "endpoint gerekli" }, { status: 400 });
  }

  await prisma.pushSubscription.deleteMany({
    where: { endpoint, userId: session.user.id },
  });

  return NextResponse.json({ ok: true });
}

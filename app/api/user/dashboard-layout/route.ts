import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { serializeDashboardLayout, type WidgetKey } from "@/lib/dashboard/widgets";

/**
 * Kullanıcının dashboard yerleşimini (widget sırası + gizlenenler) kaydeder.
 * Bilinmeyen anahtarlar `serializeDashboardLayout` içinde elenir; ham string
 * doğrudan kabul edilebilir.
 */
const schema = z.object({
  order: z.array(z.string()).max(50),
  hidden: z.array(z.string()).max(50),
});

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Giriş gerekli." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Geçersiz veri." }, { status: 400 });
  }

  const layout = serializeDashboardLayout(
    parsed.data.order as WidgetKey[],
    parsed.data.hidden as WidgetKey[]
  );

  await prisma.user.update({
    where: { id: session.user.id },
    data: { dashboardLayout: layout },
  });

  return NextResponse.json({ ok: true });
}

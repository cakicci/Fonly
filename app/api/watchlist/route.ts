import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseAssetSlug } from "@/lib/chart/timeframe";

const SlugSchema = z
  .string()
  .min(3)
  .max(40)
  .regex(/^(hisse|doviz|altin|fon)-[A-Za-z0-9]+$/);

/** GET /api/watchlist — kullanıcının izleme listesi (slug dizisi). */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ items: [] });
  }

  const rows = await prisma.watchlist.findMany({
    where:   { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select:  { slug: true, createdAt: true },
  });

  return NextResponse.json({ items: rows });
}

/** POST /api/watchlist — body: { slug: "hisse-THYAO" }. Idempotent. */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = SlugSchema.safeParse(body?.slug);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz slug" }, { status: 400 });
  }

  const slug = parsed.data;
  const { type } = parseAssetSlug(slug);
  if (!type) {
    return NextResponse.json({ error: "Geçersiz slug" }, { status: 400 });
  }

  try {
    await prisma.watchlist.upsert({
      where:  { userId_slug: { userId: session.user.id, slug } },
      create: { userId: session.user.id, slug },
      update: {}, // zaten varsa dokunma
    });
    return NextResponse.json({ ok: true, slug });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "DB hatası";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** DELETE /api/watchlist?slug=hisse-THYAO */
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const slug = req.nextUrl.searchParams.get("slug");
  const parsed = SlugSchema.safeParse(slug);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz slug" }, { status: 400 });
  }

  await prisma.watchlist.deleteMany({
    where: { userId: session.user.id, slug: parsed.data },
  });

  return NextResponse.json({ ok: true });
}

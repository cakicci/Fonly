import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * DELETE /api/user — hesabı kalıcı siler.
 *
 * İlişkili tüm kayıtlar (watchlist, alarmlar, portföy, abonelik, oturumlar,
 * bağlı hesaplar) Prisma `onDelete: Cascade` ile birlikte silinir. İstemci
 * bu çağrıdan sonra signOut yapıp ana sayfaya yönlendirir.
 */
export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Giriş gerekli." }, { status: 401 });
  }

  await prisma.user.delete({ where: { id: session.user.id } });
  return NextResponse.json({ ok: true });
}

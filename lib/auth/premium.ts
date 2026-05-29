import { prisma } from "@/lib/prisma";

/**
 * Bir kullanıcının aktif premium aboneliği var mı?
 *
 * Aktif = status `active` veya `trialing` + currentPeriodEnd henüz dolmamış.
 *
 * Faz 0 iskelet: Subscription tablosu var ama henüz ödeme entegrasyonu yok,
 * dolayısıyla normal akışta hiçbir kullanıcı premium dönmez. Manuel test için
 * DB'ye doğrudan satır eklenebilir. Faz 11.5'te Iyzico/PayTR webhook'u bu
 * tabloyu doldurmaya başlayacak.
 */
export async function isPremium(userId: string | null | undefined): Promise<boolean> {
  if (!userId) return false;

  const sub = await prisma.subscription.findUnique({
    where: { userId },
    select: { status: true, currentPeriodEnd: true },
  });

  if (!sub) return false;
  if (sub.status !== "active" && sub.status !== "trialing") return false;
  if (sub.currentPeriodEnd.getTime() < Date.now()) return false;

  return true;
}

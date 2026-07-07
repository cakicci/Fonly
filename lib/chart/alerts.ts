import { prisma } from "@/lib/prisma";
import { sendPriceAlertEmail } from "@/lib/mail/mailer";
import { assetDisplayName, assetHref } from "@/lib/portfolio/asset";
import { getPricesForSlugs } from "@/lib/portfolio/price";
import type { MarketResponse } from "@/app/api/market/route";

interface AlertRow {
  id: number;
  slug: string;
  condition: string;
  threshold: number;
}

/** Eşik aşıldı mı? */
function isHit(a: Pick<AlertRow, "condition" | "threshold">, price: number): boolean {
  return a.condition === "above" ? price >= a.threshold : price <= a.threshold;
}

/**
 * Tetiklenen alarmları işaretler ve (e-posta biliniyorsa) bildirim maili yollar.
 * Mail gönderimi best-effort — başarısız olsa da alarm tetiklenmiş sayılır
 * (site içi AlertBadge her durumda gösterir).
 */
async function markTriggeredAndNotify(
  triggered: Array<AlertRow & { price: number }>,
  email: string | null | undefined
): Promise<void> {
  if (triggered.length === 0) return;

  await prisma.priceAlert.updateMany({
    where: { id: { in: triggered.map((t) => t.id) } },
    data: { triggeredAt: new Date(), active: false },
  });

  if (!email) return;
  await Promise.all(
    triggered.map((t) =>
      sendPriceAlertEmail(email, {
        assetName: assetDisplayName(t.slug),
        href: assetHref(t.slug),
        condition: t.condition,
        threshold: t.threshold,
        price: t.price,
      })
    )
  );
}

/**
 * Lazy alarm kontrolü — /api/market handler'ı tarafından çağırılır.
 *
 * Auth'lu kullanıcının aktif (active=true, triggeredAt=null) alarmlarını çeker,
 * mevcut market snapshot'ında her birini kontrol eder, eşik aşıldıysa
 * triggeredAt=now() set eder ve e-posta bildirimi yollar.
 *
 * NOT: Hata durumlarında sessiz geç — alarm kontrolü kritik path değil,
 * market endpoint'inin başarısız olmasına izin verilmez.
 *
 * Performans: Tek user'ın aktif alarmı tipik olarak <10 — DB sorgusu <10ms.
 */
export async function checkAlertsForUser(
  userId: string,
  market: MarketResponse
): Promise<void> {
  try {
    const alerts = await prisma.priceAlert.findMany({
      where: {
        userId,
        active:      true,
        triggeredAt: null,
      },
      select: {
        id:        true,
        slug:      true,
        condition: true,
        threshold: true,
      },
    });
    if (alerts.length === 0) return;

    const triggered: Array<AlertRow & { price: number }> = [];
    for (const a of alerts) {
      const price = lookupPrice(market, a.slug);
      if (price == null) continue;
      if (isHit(a, price)) triggered.push({ ...a, price });
    }

    if (triggered.length > 0) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });
      await markTriggeredAndNotify(triggered, user?.email);
    }
  } catch {
    // sessizce geç — market endpoint'i etkilenmemeli
  }
}

/**
 * Tüm kullanıcıların aktif alarmlarını kontrol eder — zamanlanmış kontrol
 * (instrumentation.ts interval'ı ve /api/cron/alerts) buradan çağırır.
 *
 * Lazy kontrolden farkı: kullanıcı sitede olmasa da çalışır ve market
 * snapshot'ı yerine kaynak bazında batched canlı fiyat kullanır
 * (getPricesForSlugs) — böylece fon ve tüm hisseler de desteklenir.
 */
export async function checkAllActiveAlerts(): Promise<{
  checked: number;
  triggered: number;
}> {
  const alerts = await prisma.priceAlert.findMany({
    where: { active: true, triggeredAt: null },
    select: {
      id:        true,
      slug:      true,
      condition: true,
      threshold: true,
      user:      { select: { email: true } },
    },
  });
  if (alerts.length === 0) return { checked: 0, triggered: 0 };

  const prices = await getPricesForSlugs(alerts.map((a) => a.slug));

  // Kullanıcı başına grupla — işaretleme + mail tek kullanıcı bağlamında.
  const byEmail = new Map<string, Array<AlertRow & { price: number }>>();
  let triggeredCount = 0;

  for (const a of alerts) {
    const price = prices.get(a.slug);
    if (price == null || !isHit(a, price)) continue;
    triggeredCount++;
    const key = a.user.email ?? "";
    const list = byEmail.get(key) ?? [];
    list.push({ id: a.id, slug: a.slug, condition: a.condition, threshold: a.threshold, price });
    byEmail.set(key, list);
  }

  for (const [email, list] of byEmail) {
    await markTriggeredAndNotify(list, email || null);
  }

  return { checked: alerts.length, triggered: triggeredCount };
}

/** Slug → MarketResponse'tan ham fiyat çıkar. Fon/hisse/altın market'te yok ise null. */
function lookupPrice(market: MarketResponse, slug: string): number | null {
  const dash = slug.indexOf("-");
  if (dash === -1) return null;
  const type = slug.substring(0, dash);
  const code = slug.substring(dash + 1);

  if (type === "doviz") {
    const item = market.doviz.find(d => d.code === code.toUpperCase());
    return item?.rawValue || null;
  }
  if (type === "altin") {
    const item = market.tumAltin.find(g => g.type === code.toLowerCase());
    return item?.rawValue || null;
  }
  if (type === "hisse") {
    // /api/market sadece XU100 + 5 hisse veriyor; lazy kontrol sadece bunlar
    // için tetiklenebilir. Diğer hisseler zamanlanmış kontrolde yakalanır.
    const item = market.borsa.find(b => b.symbol === code.toUpperCase());
    if (!item || item.value === "—") return null;
    // "1.234,56 ₺" → 1234.56
    const numeric = parseFloat(item.value.replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, ""));
    return Number.isFinite(numeric) ? numeric : null;
  }
  // Fon: market response'unda yok — zamanlanmış kontrol (checkAllActiveAlerts) yakalar.
  return null;
}

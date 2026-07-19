import { prisma } from "@/lib/prisma";
import { sendPriceAlertEmail } from "@/lib/mail/mailer";
import { sendPushToUser } from "@/lib/push/send";
import { assetDisplayName, assetHref } from "@/lib/portfolio/asset";
import { getQuotesForSlugs } from "@/lib/portfolio/price";
import type { MarketResponse } from "@/app/api/market/route";

export type TriggerType = "price" | "percent_change";

interface AlertRow {
  id: number;
  slug: string;
  condition: string;
  threshold: number;
  triggerType: string;
}

/**
 * Eşik aşıldı mı?
 * "price": condition yönünde mutlak fiyat seviyesi karşılaştırması (eski davranış).
 * "percent_change": condition yönünde günlük % değişim karşılaştırması —
 * "above" → değişim +threshold'u geçti, "below" → değişim -threshold'un altına indi.
 */
function isHit(
  a: Pick<AlertRow, "condition" | "threshold" | "triggerType">,
  price: number,
  changePercent: number | null
): boolean {
  if (a.triggerType === "percent_change") {
    if (changePercent == null) return false;
    return a.condition === "above" ? changePercent >= a.threshold : changePercent <= -a.threshold;
  }
  return a.condition === "above" ? price >= a.threshold : price <= a.threshold;
}

/** Tarayıcı push bildirimi için başlık/metin/link üretir — e-postayla aynı sade dil. */
function pushPayloadFor(t: AlertRow & { price: number; changePercent: number | null }) {
  const name = assetDisplayName(t.slug);
  const isAbove = t.condition === "above";
  const isPercent = t.triggerType === "percent_change";

  const body = isPercent
    ? `Bugün belirlediğin %${t.threshold} ${isAbove ? "değişimi" : "düşüşü"} geçti${
        t.changePercent != null
          ? `, güncel değişim ${t.changePercent >= 0 ? "+" : ""}${t.changePercent.toFixed(1)}%`
          : ""
      }.`
    : `Bugün belirlediğin ${t.threshold.toLocaleString("tr-TR")} seviyesini ${
        isAbove ? "geçti" : "altına indi"
      }, şu an ${t.price.toLocaleString("tr-TR")}.`;

  return { title: `${name} — Fonly Alarm`, body, url: assetHref(t.slug), tag: `alert-${t.id}` };
}

/**
 * Tetiklenen alarmları işaretler ve (e-posta + tarayıcı push, ikisi de
 * biliniyorsa/kuruluysa) bildirim yollar. İkisi de best-effort — başarısız
 * olsalar bile alarm tetiklenmiş sayılır (site içi AlertBadge her durumda gösterir).
 */
async function markTriggeredAndNotify(
  triggered: Array<AlertRow & { price: number; changePercent: number | null }>,
  userId: string,
  email: string | null | undefined
): Promise<void> {
  if (triggered.length === 0) return;

  await prisma.priceAlert.updateMany({
    where: { id: { in: triggered.map((t) => t.id) } },
    data: { triggeredAt: new Date(), active: false },
  });

  await Promise.all([
    email
      ? Promise.all(
          triggered.map((t) =>
            sendPriceAlertEmail(email, {
              assetName: assetDisplayName(t.slug),
              href: assetHref(t.slug),
              triggerType: t.triggerType as TriggerType,
              condition: t.condition,
              threshold: t.threshold,
              price: t.price,
              changePercent: t.changePercent,
            })
          )
        )
      : Promise.resolve(),
    Promise.all(triggered.map((t) => sendPushToUser(userId, pushPayloadFor(t)))),
  ]);
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
        id:          true,
        slug:        true,
        condition:   true,
        threshold:   true,
        triggerType: true,
      },
    });
    if (alerts.length === 0) return;

    const triggered: Array<AlertRow & { price: number; changePercent: number | null }> = [];
    for (const a of alerts) {
      const price = lookupPrice(market, a.slug);
      if (price == null) continue;
      const changePercent = lookupChangePercent(market, a.slug);
      if (isHit(a, price, changePercent)) triggered.push({ ...a, price, changePercent });
    }

    if (triggered.length > 0) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });
      await markTriggeredAndNotify(triggered, userId, user?.email);
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
 * snapshot'ı yerine kaynak bazında batched canlı fiyat+değişim kullanır
 * (getQuotesForSlugs) — böylece fon ve tüm hisseler de desteklenir.
 */
export async function checkAllActiveAlerts(): Promise<{
  checked: number;
  triggered: number;
}> {
  const alerts = await prisma.priceAlert.findMany({
    where: { active: true, triggeredAt: null },
    select: {
      id:          true,
      slug:        true,
      condition:   true,
      threshold:   true,
      triggerType: true,
      userId:      true,
      user:        { select: { email: true } },
    },
  });
  if (alerts.length === 0) return { checked: 0, triggered: 0 };

  const quotes = await getQuotesForSlugs(alerts.map((a) => a.slug));

  // Kullanıcı başına grupla — işaretleme + mail/push tek kullanıcı bağlamında.
  const byUser = new Map<string, { email: string | null; items: Array<AlertRow & { price: number; changePercent: number | null }> }>();
  let triggeredCount = 0;

  for (const a of alerts) {
    const q = quotes.get(a.slug);
    if (!q || !isHit(a, q.price, q.changePercent)) continue;
    triggeredCount++;
    const group = byUser.get(a.userId) ?? { email: a.user.email, items: [] };
    group.items.push({
      id: a.id, slug: a.slug, condition: a.condition, threshold: a.threshold,
      triggerType: a.triggerType, price: q.price, changePercent: q.changePercent,
    });
    byUser.set(a.userId, group);
  }

  for (const [userId, group] of byUser) {
    await markTriggeredAndNotify(group.items, userId, group.email);
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

/** "%+1,23" / "-2,50%" gibi formatlanmış yüzde string'ini sayıya çevirir. */
function parsePercentString(s: string | undefined): number | null {
  if (!s || s === "—") return null;
  const n = parseFloat(s.replace(",", ".").replace(/[+%]/g, ""));
  return Number.isFinite(n) ? n : null;
}

/** Slug → MarketResponse'tan günlük değişim yüzdesini çıkar. */
function lookupChangePercent(market: MarketResponse, slug: string): number | null {
  const dash = slug.indexOf("-");
  if (dash === -1) return null;
  const type = slug.substring(0, dash);
  const code = slug.substring(dash + 1);

  if (type === "doviz") {
    const item = market.doviz.find(d => d.code === code.toUpperCase());
    return parsePercentString(item?.changePercent);
  }
  if (type === "altin") {
    const item = market.tumAltin.find(g => g.type === code.toLowerCase());
    return parsePercentString(item?.changePercent);
  }
  if (type === "hisse") {
    const item = market.borsa.find(b => b.symbol === code.toUpperCase());
    return parsePercentString(item?.changePercent);
  }
  return null;
}

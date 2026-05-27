import { prisma } from "@/lib/prisma";
import type { MarketResponse } from "@/app/api/market/route";

/**
 * Lazy alarm kontrolü — /api/market handler'ı tarafından çağırılır.
 *
 * Auth'lu kullanıcının aktif (active=true, triggeredAt=null) alarmlarını çeker,
 * mevcut market snapshot'ında her birini kontrol eder, eşik aşıldıysa
 * triggeredAt=now() set eder.
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

    const now = new Date();
    const triggered: number[] = [];

    for (const a of alerts) {
      const price = lookupPrice(market, a.slug);
      if (price == null) continue;

      const hit = a.condition === "above"
        ? price >= a.threshold
        : price <= a.threshold;
      if (hit) triggered.push(a.id);
    }

    if (triggered.length > 0) {
      await prisma.priceAlert.updateMany({
        where: { id: { in: triggered } },
        data:  { triggeredAt: now, active: false },
      });
    }
  } catch {
    // sessizce geç — market endpoint'i etkilenmemeli
  }
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
    // /api/market sadece XU100 + 5 hisse veriyor; alarm sadece bunlar için
    // tetiklenebilir. Diğer hisseler için ileride genişletilebilir.
    const item = market.borsa.find(b => b.symbol === code.toUpperCase());
    if (!item || item.value === "—") return null;
    // "1.234,56 ₺" → 1234.56
    const numeric = parseFloat(item.value.replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, ""));
    return Number.isFinite(numeric) ? numeric : null;
  }
  // Fon: market response'unda yok — ileride /api/market'a fon snapshot eklendiğinde
  return null;
}

import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * checkAllActiveAlerts — zamanlanmış alarm kontrolü. Prisma, canlı fiyat+değişim
 * ve mailer mock'lanır; eşik mantığı (fiyat + yüzde değişim), işaretleme ve
 * e-posta fan-out doğrulanır.
 */
vi.mock("@/lib/prisma", () => ({
  prisma: {
    priceAlert: {
      findMany: vi.fn(),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    user: { findUnique: vi.fn() },
  },
}));
vi.mock("@/lib/portfolio/price", () => ({
  getQuotesForSlugs: vi.fn(),
}));
vi.mock("@/lib/mail/mailer", () => ({
  sendPriceAlertEmail: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/push/send", () => ({
  sendPushToUser: vi.fn().mockResolvedValue(undefined),
}));

import { prisma } from "@/lib/prisma";
import { getQuotesForSlugs } from "@/lib/portfolio/price";
import { sendPriceAlertEmail } from "@/lib/mail/mailer";
import { checkAllActiveAlerts } from "@/lib/chart/alerts";

const findMany = vi.mocked(prisma.priceAlert.findMany);
const updateMany = vi.mocked(prisma.priceAlert.updateMany);
const quotes = vi.mocked(getQuotesForSlugs);
const sendMail = vi.mocked(sendPriceAlertEmail);

function alertRow(over: Partial<{
  id: number; slug: string; condition: string; threshold: number;
  triggerType: string; email: string | null;
}> = {}) {
  return {
    id: over.id ?? 1,
    slug: over.slug ?? "doviz-USD",
    condition: over.condition ?? "above",
    threshold: over.threshold ?? 40,
    triggerType: over.triggerType ?? "price",
    user: { email: over.email === undefined ? "u@test.local" : over.email },
  };
}

function quote(price: number, changePercent: number | null = null) {
  return { price, changePercent };
}

beforeEach(() => {
  vi.clearAllMocks();
  updateMany.mockResolvedValue({ count: 0 });
});

describe("checkAllActiveAlerts — fiyat tetikleyicisi", () => {
  it("aktif alarm yoksa fiyat çekmeden 0/0 döner", async () => {
    findMany.mockResolvedValue([] as never);
    const res = await checkAllActiveAlerts();
    expect(res).toEqual({ checked: 0, triggered: 0 });
    expect(quotes).not.toHaveBeenCalled();
  });

  it("above eşiği aşılınca işaretler ve e-posta yollar", async () => {
    findMany.mockResolvedValue([alertRow({ id: 7, threshold: 40 })] as never);
    quotes.mockResolvedValue(new Map([["doviz-USD", quote(46.8)]]));

    const res = await checkAllActiveAlerts();

    expect(res).toEqual({ checked: 1, triggered: 1 });
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: [7] } },
        data: expect.objectContaining({ active: false }),
      })
    );
    expect(sendMail).toHaveBeenCalledTimes(1);
    expect(sendMail).toHaveBeenCalledWith(
      "u@test.local",
      expect.objectContaining({ threshold: 40, price: 46.8, condition: "above" })
    );
  });

  it("below koşulu: fiyat eşiğin üstündeyse tetiklenmez", async () => {
    findMany.mockResolvedValue([alertRow({ condition: "below", threshold: 40 })] as never);
    quotes.mockResolvedValue(new Map([["doviz-USD", quote(46.8)]]));

    const res = await checkAllActiveAlerts();
    expect(res).toEqual({ checked: 1, triggered: 0 });
    expect(updateMany).not.toHaveBeenCalled();
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("fiyatı çekilemeyen (null) alarm atlanır", async () => {
    findMany.mockResolvedValue([alertRow()] as never);
    quotes.mockResolvedValue(new Map([["doviz-USD", null]]));

    const res = await checkAllActiveAlerts();
    expect(res).toEqual({ checked: 1, triggered: 0 });
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("e-postası olmayan kullanıcının alarmı işaretlenir ama mail gitmez", async () => {
    findMany.mockResolvedValue([alertRow({ email: null })] as never);
    quotes.mockResolvedValue(new Map([["doviz-USD", quote(46.8)]]));

    const res = await checkAllActiveAlerts();
    expect(res).toEqual({ checked: 1, triggered: 0 + 1 });
    expect(updateMany).toHaveBeenCalledTimes(1);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("aynı kullanıcının birden çok tetiklenen alarmı tek tek maillenir", async () => {
    findMany.mockResolvedValue([
      alertRow({ id: 1, slug: "doviz-USD", threshold: 40 }),
      alertRow({ id: 2, slug: "altin-gram", threshold: 1000 }),
    ] as never);
    quotes.mockResolvedValue(
      new Map([
        ["doviz-USD", quote(46.8)],
        ["altin-gram", quote(4600)],
      ])
    );

    const res = await checkAllActiveAlerts();
    expect(res).toEqual({ checked: 2, triggered: 2 });
    expect(sendMail).toHaveBeenCalledTimes(2);
  });
});

describe("checkAllActiveAlerts — yüzde değişim tetikleyicisi", () => {
  it("above: günlük değişim +threshold'u geçince tetiklenir", async () => {
    findMany.mockResolvedValue([
      alertRow({ id: 3, triggerType: "percent_change", condition: "above", threshold: 5 }),
    ] as never);
    quotes.mockResolvedValue(new Map([["doviz-USD", quote(46.8, 6.2)]]));

    const res = await checkAllActiveAlerts();
    expect(res).toEqual({ checked: 1, triggered: 1 });
    expect(sendMail).toHaveBeenCalledWith(
      "u@test.local",
      expect.objectContaining({ triggerType: "percent_change", threshold: 5, changePercent: 6.2 })
    );
  });

  it("above: değişim threshold'un altındaysa tetiklenmez", async () => {
    findMany.mockResolvedValue([
      alertRow({ triggerType: "percent_change", condition: "above", threshold: 5 }),
    ] as never);
    quotes.mockResolvedValue(new Map([["doviz-USD", quote(46.8, 3.1)]]));

    const res = await checkAllActiveAlerts();
    expect(res).toEqual({ checked: 1, triggered: 0 });
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("below: günlük değişim -threshold'un altına inince tetiklenir", async () => {
    findMany.mockResolvedValue([
      alertRow({ id: 4, triggerType: "percent_change", condition: "below", threshold: 5 }),
    ] as never);
    quotes.mockResolvedValue(new Map([["doviz-USD", quote(44.0, -7.5)]]));

    const res = await checkAllActiveAlerts();
    expect(res).toEqual({ checked: 1, triggered: 1 });
  });

  it("değişim yüzdesi bilinmiyorsa (null) tetiklenmez", async () => {
    findMany.mockResolvedValue([
      alertRow({ triggerType: "percent_change", condition: "above", threshold: 5 }),
    ] as never);
    quotes.mockResolvedValue(new Map([["doviz-USD", quote(46.8, null)]]));

    const res = await checkAllActiveAlerts();
    expect(res).toEqual({ checked: 1, triggered: 0 });
  });
});

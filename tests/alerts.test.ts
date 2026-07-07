import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * checkAllActiveAlerts — zamanlanmış alarm kontrolü. Prisma, canlı fiyat ve
 * mailer mock'lanır; eşik mantığı, işaretleme ve e-posta fan-out doğrulanır.
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
  getPricesForSlugs: vi.fn(),
}));
vi.mock("@/lib/mail/mailer", () => ({
  sendPriceAlertEmail: vi.fn().mockResolvedValue(undefined),
}));

import { prisma } from "@/lib/prisma";
import { getPricesForSlugs } from "@/lib/portfolio/price";
import { sendPriceAlertEmail } from "@/lib/mail/mailer";
import { checkAllActiveAlerts } from "@/lib/chart/alerts";

const findMany = vi.mocked(prisma.priceAlert.findMany);
const updateMany = vi.mocked(prisma.priceAlert.updateMany);
const prices = vi.mocked(getPricesForSlugs);
const sendMail = vi.mocked(sendPriceAlertEmail);

function alertRow(over: Partial<{
  id: number; slug: string; condition: string; threshold: number; email: string | null;
}> = {}) {
  return {
    id: over.id ?? 1,
    slug: over.slug ?? "doviz-USD",
    condition: over.condition ?? "above",
    threshold: over.threshold ?? 40,
    user: { email: over.email === undefined ? "u@test.local" : over.email },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  updateMany.mockResolvedValue({ count: 0 });
});

describe("checkAllActiveAlerts", () => {
  it("aktif alarm yoksa fiyat çekmeden 0/0 döner", async () => {
    findMany.mockResolvedValue([] as never);
    const res = await checkAllActiveAlerts();
    expect(res).toEqual({ checked: 0, triggered: 0 });
    expect(prices).not.toHaveBeenCalled();
  });

  it("above eşiği aşılınca işaretler ve e-posta yollar", async () => {
    findMany.mockResolvedValue([alertRow({ id: 7, threshold: 40 })] as never);
    prices.mockResolvedValue(new Map([["doviz-USD", 46.8]]));

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
    prices.mockResolvedValue(new Map([["doviz-USD", 46.8]]));

    const res = await checkAllActiveAlerts();
    expect(res).toEqual({ checked: 1, triggered: 0 });
    expect(updateMany).not.toHaveBeenCalled();
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("fiyatı çekilemeyen (null) alarm atlanır", async () => {
    findMany.mockResolvedValue([alertRow()] as never);
    prices.mockResolvedValue(new Map([["doviz-USD", null]]));

    const res = await checkAllActiveAlerts();
    expect(res).toEqual({ checked: 1, triggered: 0 });
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("e-postası olmayan kullanıcının alarmı işaretlenir ama mail gitmez", async () => {
    findMany.mockResolvedValue([alertRow({ email: null })] as never);
    prices.mockResolvedValue(new Map([["doviz-USD", 46.8]]));

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
    prices.mockResolvedValue(
      new Map([
        ["doviz-USD", 46.8],
        ["altin-gram", 4600],
      ])
    );

    const res = await checkAllActiveAlerts();
    expect(res).toEqual({ checked: 2, triggered: 2 });
    expect(sendMail).toHaveBeenCalledTimes(2);
  });
});

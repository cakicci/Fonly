import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * applySubscriptionEvent — para işleyen kritik yol. Prisma mock'lanır;
 * her normalize olayın doğru mutasyona ve doğru alanlara çevrildiği doğrulanır.
 */
vi.mock("@/lib/prisma", () => ({
  prisma: {
    subscription: {
      upsert: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { applySubscriptionEvent } from "@/lib/billing/subscription";

const upsert = vi.mocked(prisma.subscription.upsert);
const update = vi.mocked(prisma.subscription.update);

beforeEach(() => {
  upsert.mockClear();
  update.mockClear();
});

describe("applySubscriptionEvent", () => {
  it("activated → upsert: plan, aktif durum, dönem ve sağlayıcı referansları", async () => {
    const periodStart = new Date("2026-07-07T00:00:00Z");
    const periodEnd = new Date("2026-08-07T00:00:00Z");

    await applySubscriptionEvent({
      kind: "activated",
      userId: "user-1",
      plan: "monthly",
      periodStart,
      periodEnd,
      providerSubscriptionId: "sub-ref",
      providerCustomerId: "cus-ref",
    });

    expect(upsert).toHaveBeenCalledTimes(1);
    const args = upsert.mock.calls[0][0];
    expect(args.where).toEqual({ userId: "user-1" });
    // create ve update dalları aynı gerçeği yazmalı (yeniden abonelik dahil).
    for (const branch of [args.create, args.update] as const) {
      expect(branch).toMatchObject({
        plan: "monthly",
        status: "active",
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        providerSubscriptionId: "sub-ref",
        providerCustomerId: "cus-ref",
      });
    }
  });

  it("renewed → update: durum tekrar active + yeni dönem sonu", async () => {
    const periodEnd = new Date("2026-09-07T00:00:00Z");
    await applySubscriptionEvent({ kind: "renewed", userId: "user-1", periodEnd });

    expect(update).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      data: { status: "active", currentPeriodEnd: periodEnd },
    });
  });

  it("canceled → update: status canceled, cancelAtPeriodEnd sıfırlanır", async () => {
    await applySubscriptionEvent({ kind: "canceled", userId: "user-1" });

    expect(update).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      data: { status: "canceled", cancelAtPeriodEnd: false },
    });
  });

  it("past_due → update: status past_due (erişim isPremium'da kesilir)", async () => {
    await applySubscriptionEvent({ kind: "past_due", userId: "user-1" });

    expect(update).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      data: { status: "past_due" },
    });
  });
});

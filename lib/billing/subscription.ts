import { prisma } from "@/lib/prisma";
import type { SubscriptionEvent } from "./provider";
import type { PlanId } from "./plans";

/**
 * Abonelik lifecycle servisi — webhook olaylarını `Subscription` tablosuna yazar.
 * `isPremium()` (lib/auth/premium.ts) bu tablonun `status` + `currentPeriodEnd`
 * alanlarını okuyarak premium kararı verir; JWT en geç 5dk içinde yansır.
 */

export async function activateSubscription(input: {
  userId: string;
  plan: PlanId;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  providerSubscriptionId: string;
  providerCustomerId: string;
  status?: "active" | "trialing";
  trialEnd?: Date | null;
}) {
  const status = input.status ?? "active";
  return prisma.subscription.upsert({
    where: { userId: input.userId },
    create: {
      userId: input.userId,
      plan: input.plan,
      status,
      currentPeriodStart: input.currentPeriodStart,
      currentPeriodEnd: input.currentPeriodEnd,
      cancelAtPeriodEnd: false,
      trialEnd: input.trialEnd ?? null,
      providerSubscriptionId: input.providerSubscriptionId,
      providerCustomerId: input.providerCustomerId,
    },
    update: {
      plan: input.plan,
      status,
      currentPeriodStart: input.currentPeriodStart,
      currentPeriodEnd: input.currentPeriodEnd,
      cancelAtPeriodEnd: false,
      trialEnd: input.trialEnd ?? null,
      providerSubscriptionId: input.providerSubscriptionId,
      providerCustomerId: input.providerCustomerId,
    },
  });
}

/** Yenileme — yeni dönem bitişi, durum tekrar active. */
export async function renewSubscription(userId: string, currentPeriodEnd: Date) {
  return prisma.subscription.update({
    where: { userId },
    data: { status: "active", currentPeriodEnd },
  });
}

/** Dönem sonunda iptal işaretle — erişim periodEnd'e kadar sürer. */
export async function cancelAtPeriodEnd(userId: string) {
  return prisma.subscription.update({
    where: { userId },
    data: { cancelAtPeriodEnd: true },
  });
}

export async function markPastDue(userId: string) {
  return prisma.subscription.update({
    where: { userId },
    data: { status: "past_due" },
  });
}

export async function markCanceled(userId: string) {
  return prisma.subscription.update({
    where: { userId },
    data: { status: "canceled", cancelAtPeriodEnd: false },
  });
}

/**
 * Normalize webhook olayını uygun mutasyona yönlendirir. Webhook route bunu
 * çağırır; sağlayıcıdan bağımsızdır.
 */
export async function applySubscriptionEvent(event: SubscriptionEvent) {
  switch (event.kind) {
    case "activated":
      return activateSubscription({
        userId: event.userId,
        plan: event.plan,
        currentPeriodStart: event.periodStart,
        currentPeriodEnd: event.periodEnd,
        providerSubscriptionId: event.providerSubscriptionId,
        providerCustomerId: event.providerCustomerId,
      });
    case "renewed":
      return renewSubscription(event.userId, event.periodEnd);
    case "canceled":
      return markCanceled(event.userId);
    case "past_due":
      return markPastDue(event.userId);
  }
}

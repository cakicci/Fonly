import type { PaymentProvider, CheckoutInput, CheckoutResult, SubscriptionEvent } from "../provider";
import { getPlan, periodEndFrom } from "../plans";
import { createDevToken, verifyDevToken } from "../dev-token";

/**
 * Dev (sahte) ödeme sağlayıcısı.
 *
 * Gerçek PSP olmadan checkout → onay → webhook → abonelik akışının tamamını
 * uçtan uca çalıştırır. createCheckout, imzalı bir token taşıyan dev onay
 * sayfasına yönlendirir; o sayfa "Ödemeyi Onayla" deyince /api/webhooks/dev'e
 * POST atar ve bu sağlayıcının verifyWebhook'u token'ı doğrulayıp aboneliği
 * aktive eder.
 *
 * GÜVENLİK: prod'da yanlışlıkla bedava premium dağıtmasın diye NODE_ENV
 * production iken `ALLOW_DEV_BILLING=1` yoksa hata fırlatır.
 */

function assertAllowed(): void {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEV_BILLING !== "1") {
    throw new Error(
      "Dev ödeme sağlayıcısı production'da kapalı. Gerçek bir PAYMENT_PROVIDER ayarlayın."
    );
  }
}

export const devProvider: PaymentProvider = {
  id: "dev",

  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    assertAllowed();
    const token = createDevToken(input.user.id, input.plan);
    const params = new URLSearchParams({ token, redirect: input.successUrl });
    return {
      redirectUrl: `/premium/dev-checkout?${params.toString()}`,
      providerRef: `dev_${token.slice(0, 12)}`,
    };
  },

  async verifyWebhook(req: Request): Promise<SubscriptionEvent | null> {
    assertAllowed();
    const body = await req.json().catch(() => null);
    const verified = verifyDevToken(body?.token);
    if (!verified) return null;

    const plan = getPlan(verified.plan);
    if (!plan) return null;

    const periodStart = new Date();
    const periodEnd = periodEndFrom(periodStart, plan);

    return {
      kind: "activated",
      userId: verified.userId,
      plan: verified.plan,
      periodStart,
      periodEnd,
      providerSubscriptionId: `dev_sub_${verified.userId.slice(0, 8)}`,
      providerCustomerId: `dev_cus_${verified.userId.slice(0, 8)}`,
    };
  },
};

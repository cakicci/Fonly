import type { PlanId } from "./plans";

/**
 * Ödeme sağlayıcısı soyutlaması.
 *
 * Tüm akış (checkout route, webhook route, abonelik lifecycle) yalnızca bu
 * arayüze bağlıdır. Yeni bir PSP eklemek = `PaymentProvider` implement eden tek
 * dosya yazmak + `getActiveProvider`'a kaydetmek. UI ve DB tarafı dokunulmaz.
 */

export type ProviderId = "dev" | "iyzico" | "paytr" | "stripe";

export interface CheckoutInput {
  user: { id: string; email: string };
  plan: PlanId;
  /** Ödeme başarıyla bitince kullanıcının döneceği mutlak URL. */
  successUrl: string;
  /** Vazgeçince döneceği mutlak URL. */
  cancelUrl: string;
}

export interface CheckoutResult {
  /** Kullanıcının yönlendirileceği ödeme sayfası (hosted/iframe/dev). */
  redirectUrl: string;
  /** Sağlayıcı tarafı referansı (ödeme/oturum id'si) — loglama/izleme için. */
  providerRef: string;
}

/**
 * Webhook'tan türetilen normalize edilmiş abonelik olayı. Lifecycle servisi
 * bunları DB mutasyonuna çevirir (`lib/billing/subscription.ts`).
 */
export type SubscriptionEvent =
  | {
      kind: "activated";
      userId: string;
      plan: PlanId;
      periodStart: Date;
      periodEnd: Date;
      providerSubscriptionId: string;
      providerCustomerId: string;
    }
  | { kind: "renewed"; userId: string; periodEnd: Date }
  | { kind: "canceled"; userId: string }
  | { kind: "past_due"; userId: string };

export interface PaymentProvider {
  id: ProviderId;
  /** Ödeme oturumu oluşturur, kullanıcının yönlendirileceği URL'i döner. */
  createCheckout(input: CheckoutInput): Promise<CheckoutResult>;
  /**
   * Gelen webhook isteğini doğrular (imza) ve normalize olay döner. İmza
   * geçersiz veya ilgisiz olay ise null (route 400/200 ile yanıtlar).
   */
  verifyWebhook(req: Request): Promise<SubscriptionEvent | null>;
  /**
   * (Opsiyonel) Sağlayıcı tarafında yenilemeyi durdurur — kullanıcı iptal
   * edince çağrılır. Dönem sonuna kadar erişim mantığı bizde kalır.
   */
  cancelAtProvider?(providerSubscriptionId: string): Promise<void>;
}

import { devProvider } from "./providers/dev";
import { iyzicoProvider } from "./providers/iyzico";

/**
 * Aktif sağlayıcıyı `PAYMENT_PROVIDER` env'ine göre döner. Varsayılan `dev`.
 * iyzico/paytr/stripe henüz implement edilmedi — seçilirse açık hata fırlatır.
 */
export function getActiveProvider(): PaymentProvider {
  const id = (process.env.PAYMENT_PROVIDER ?? "dev") as ProviderId;
  return getProvider(id);
}

export function getProvider(id: ProviderId): PaymentProvider {
  switch (id) {
    case "dev":
      return devProvider;
    case "iyzico":
      return iyzicoProvider;
    case "paytr":
    case "stripe":
      throw new Error(
        `Ödeme sağlayıcısı "${id}" henüz bağlanmadı. lib/billing/providers/${id}.ts ekleyin.`
      );
    default:
      throw new Error(`Bilinmeyen ödeme sağlayıcısı: ${id}`);
  }
}

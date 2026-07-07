import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/site";
import type {
  PaymentProvider,
  CheckoutInput,
  CheckoutResult,
  SubscriptionEvent,
} from "../provider";
import { getPlan, periodEndFrom, type PlanId } from "../plans";
import { createDevToken } from "../dev-token";

/**
 * iyzico Abonelik (Subscription API v2) sağlayıcısı.
 *
 * Akış:
 *  1. `createCheckout` → kullanıcıyı kendi embed sayfamıza yönlendirir
 *     (/premium/iyzico-checkout). iyzico abonelik formu hosted URL değil,
 *     gömülebilir `checkoutFormContent` döndürdüğü için form bizde render edilir.
 *  2. Embed sayfası `initializeSubscriptionCheckout` ile
 *     POST /v2/subscription/checkoutform/initialize çağırır; callbackUrl'e
 *     HMAC-imzalı `state` (userId+plan, 30 dk) eklenir.
 *  3. Ödeme sonrası iyzico, token'ı callback route'umuza POST'lar
 *     (/api/billing/iyzico/callback). Route, sonucu sunucudan doğrular
 *     (GET /v2/subscription/checkoutform/{token}) ve aboneliği aktive eder.
 *  4. Yenileme/başarısız tahsilat webhook ile gelir (/api/webhooks/iyzico) —
 *     `verifyWebhook` X-IYZ-SIGNATURE-V3 imzasını doğrular.
 *
 * SANDBOX: `IYZICO_BASE_URL` varsayılanı sandbox'tır. Prod'a geçerken
 * https://api.iyzipay.com yapın ve panelden webhook URL'ini kaydedin.
 */

// ── Konfigürasyon ────────────────────────────────────────────────────────────

export interface IyzicoConfig {
  apiKey: string;
  secretKey: string;
  /** Webhook imza doğrulamasında kullanılır (panel → merchant bilgileri). */
  merchantId: string;
  baseUrl: string;
  /** iyzico panelinde oluşturulan ödeme planlarının referans kodları. */
  planRefs: Record<PlanId, string>;
}

export function getIyzicoConfig(): IyzicoConfig {
  const apiKey = process.env.IYZICO_API_KEY;
  const secretKey = process.env.IYZICO_SECRET_KEY;
  const merchantId = process.env.IYZICO_MERCHANT_ID;
  const monthly = process.env.IYZICO_PLAN_REF_MONTHLY;
  const yearly = process.env.IYZICO_PLAN_REF_YEARLY;

  if (!apiKey || !secretKey || !merchantId || !monthly || !yearly) {
    throw new Error(
      "iyzico yapılandırması eksik: IYZICO_API_KEY, IYZICO_SECRET_KEY, " +
        "IYZICO_MERCHANT_ID, IYZICO_PLAN_REF_MONTHLY, IYZICO_PLAN_REF_YEARLY gerekli."
    );
  }

  return {
    apiKey,
    secretKey,
    merchantId,
    baseUrl: (process.env.IYZICO_BASE_URL ?? "https://sandbox-api.iyzipay.com").replace(/\/+$/, ""),
    planRefs: { monthly, yearly },
  };
}

// ── IYZWSv2 imza (docs: HMACSHA256 Auth) ─────────────────────────────────────

/**
 * Authorization başlığını üretir:
 *   signature = hex( HMAC-SHA256(secretKey, randomKey + uriPath + body) )
 *   Authorization: IYZWSv2 base64("apiKey:A&randomKey:R&signature:S")
 * `randomKey` ayrıca `x-iyzi-rnd` başlığında gönderilir.
 *
 * Saf fonksiyon — testler sabit randomKey ile determinizmi doğrular.
 */
export function buildIyzicoAuthHeaders(
  cfg: Pick<IyzicoConfig, "apiKey" | "secretKey">,
  uriPath: string,
  body: string,
  randomKey: string = `${Date.now()}FONLY`
): { Authorization: string; "x-iyzi-rnd": string } {
  const signature = crypto
    .createHmac("sha256", cfg.secretKey)
    .update(randomKey + uriPath + body)
    .digest("hex");
  const authString = `apiKey:${cfg.apiKey}&randomKey:${randomKey}&signature:${signature}`;
  return {
    Authorization: `IYZWSv2 ${Buffer.from(authString).toString("base64")}`,
    "x-iyzi-rnd": randomKey,
  };
}

async function iyzicoRequest<T>(
  cfg: IyzicoConfig,
  method: "GET" | "POST",
  uriPath: string,
  payload?: Record<string, unknown>
): Promise<T> {
  const body = payload ? JSON.stringify(payload) : "";
  const headers = {
    ...buildIyzicoAuthHeaders(cfg, uriPath, body),
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const res = await fetch(`${cfg.baseUrl}${uriPath}`, {
    method,
    headers,
    body: method === "POST" ? body : undefined,
    cache: "no-store",
  });

  const data = (await res.json().catch(() => null)) as
    | (T & { status?: string; errorMessage?: string })
    | null;

  if (!res.ok || !data || data.status !== "success") {
    throw new Error(
      `iyzico ${uriPath}: HTTP ${res.status} — ${data?.errorMessage ?? "bilinmeyen hata"}`
    );
  }
  return data;
}

// ── Abonelik checkout ────────────────────────────────────────────────────────

interface InitializeResponse {
  status: string;
  token: string;
  checkoutFormContent: string;
  tokenExpireTime?: number;
}

interface RetrieveResponse {
  status: string;
  data?: {
    referenceCode: string;
    parentReferenceCode?: string;
    customerReferenceCode: string;
    subscriptionStatus: "ACTIVE" | "PENDING" | string;
    pricingPlanReferenceCode?: string;
    startDate?: string;
    endDate?: string;
  };
}

/**
 * Abonelik checkout formunu başlatır; embed sayfası render etmek için
 * `checkoutFormContent` döner.
 *
 * NOT (prod öncesi): iyzico müşteri nesnesi TCKN (`identityNumber`) ve fatura
 * adresi ister. Fonly bu bilgileri toplamıyor — sandbox'ta placeholder yeterli;
 * prod'a geçmeden checkout'a fatura bilgisi adımı eklenmeli veya iyzico
 * temsilcisiyle zorunluluk teyit edilmeli.
 */
export async function initializeSubscriptionCheckout(user: {
  id: string;
  email: string;
  name?: string | null;
}, plan: PlanId): Promise<{ checkoutFormContent: string; token: string }> {
  const cfg = getIyzicoConfig();

  const state = createDevToken(user.id, plan); // HMAC(userId+plan+exp) — sağlayıcıdan bağımsız
  const callbackUrl = `${SITE_URL}/api/billing/iyzico/callback?state=${encodeURIComponent(state)}`;

  const fullName = (user.name ?? "").trim() || "Fonly Üyesi";
  const spaceIdx = fullName.lastIndexOf(" ");
  const name = spaceIdx > 0 ? fullName.slice(0, spaceIdx) : fullName;
  const surname = spaceIdx > 0 ? fullName.slice(spaceIdx + 1) : "Üye";

  const res = await iyzicoRequest<InitializeResponse>(
    cfg,
    "POST",
    "/v2/subscription/checkoutform/initialize",
    {
      locale: "tr",
      conversationId: user.id,
      callbackUrl,
      pricingPlanReferenceCode: cfg.planRefs[plan],
      subscriptionInitialStatus: "ACTIVE",
      customer: {
        name,
        surname,
        email: user.email,
        // Placeholder'lar — bkz. fonksiyon dokümantasyonu.
        gsmNumber: "+905000000000",
        identityNumber: "74300864791",
        billingAddress: {
          contactName: fullName,
          address: "Dijital hizmet — adres beyan edilmedi",
          city: "İstanbul",
          country: "Türkiye",
          zipCode: "34000",
        },
      },
    }
  );

  return { checkoutFormContent: res.checkoutFormContent, token: res.token };
}

/** Callback token'ı ile abonelik sonucunu sunucudan doğrular. */
export async function retrieveSubscriptionCheckout(token: string) {
  const cfg = getIyzicoConfig();
  const res = await iyzicoRequest<RetrieveResponse>(
    cfg,
    "GET",
    `/v2/subscription/checkoutform/${encodeURIComponent(token)}`
  );
  return res.data ?? null;
}

// ── Webhook imzası (docs: Webhook → subscription format) ────────────────────

export interface IyzicoSubscriptionWebhook {
  iyziEventType: string;
  subscriptionReferenceCode: string;
  orderReferenceCode: string;
  customerReferenceCode: string;
  iyziEventTime?: number;
  iyziReferenceCode?: string;
}

/**
 * Abonelik webhook imzası:
 *   hex( HMAC-SHA256(secretKey,
 *     merchantId + secretKey + eventType + subscriptionRef + orderRef + customerRef) )
 * Saf fonksiyon — testler sahte payload ile doğrular.
 */
export function computeSubscriptionWebhookSignature(
  cfg: Pick<IyzicoConfig, "secretKey" | "merchantId">,
  payload: IyzicoSubscriptionWebhook
): string {
  const message =
    cfg.merchantId +
    cfg.secretKey +
    payload.iyziEventType +
    payload.subscriptionReferenceCode +
    payload.orderReferenceCode +
    payload.customerReferenceCode;
  return crypto.createHmac("sha256", cfg.secretKey).update(message).digest("hex");
}

function timingSafeEqualHex(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

// ── PaymentProvider implementasyonu ─────────────────────────────────────────

export const iyzicoProvider: PaymentProvider = {
  id: "iyzico",

  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    getIyzicoConfig(); // eksik env'de erken ve açık hata
    // Form embed sayfamız initialize'ı render sırasında yapar (hosted URL yok).
    const params = new URLSearchParams({ plan: input.plan });
    return {
      redirectUrl: `/premium/iyzico-checkout?${params.toString()}`,
      providerRef: `iyzico_pending_${input.user.id.slice(0, 8)}`,
    };
  },

  /**
   * Yenileme/başarısız tahsilat olayları. İlk aktivasyon callback route'unda
   * yapılır; buraya ilk `subscription.order.success` abonelik satırı henüz
   * yazılmadan gelirse null döner (route 400 yanıtlar, iyzico tekrar dener —
   * o sırada callback satırı yazmış olur).
   */
  async verifyWebhook(req: Request): Promise<SubscriptionEvent | null> {
    const cfg = getIyzicoConfig();

    const payload = (await req.json().catch(() => null)) as IyzicoSubscriptionWebhook | null;
    if (
      !payload?.iyziEventType ||
      !payload.subscriptionReferenceCode ||
      !payload.orderReferenceCode ||
      !payload.customerReferenceCode
    ) {
      return null;
    }

    const signature = req.headers.get("x-iyz-signature-v3");
    if (!signature) return null;
    const expected = computeSubscriptionWebhookSignature(cfg, payload);
    if (!timingSafeEqualHex(signature.toLowerCase(), expected)) return null;

    const sub = await prisma.subscription.findFirst({
      where: { providerSubscriptionId: payload.subscriptionReferenceCode },
      select: { userId: true, plan: true },
    });
    if (!sub) return null;

    if (payload.iyziEventType === "subscription.order.success") {
      const plan = getPlan(sub.plan);
      if (!plan) return null;
      return {
        kind: "renewed",
        userId: sub.userId,
        periodEnd: periodEndFrom(new Date(), plan),
      };
    }
    if (payload.iyziEventType === "subscription.order.failure") {
      return { kind: "past_due", userId: sub.userId };
    }
    return null;
  },

  /**
   * Yenilemeyi iyzico tarafında durdurur. Erişim dönem sonuna kadar sürer —
   * o mantık bizde (cancelAtPeriodEnd). Endpoint sandbox'ta teyit edilmeli.
   */
  async cancelAtProvider(providerSubscriptionId: string): Promise<void> {
    const cfg = getIyzicoConfig();
    await iyzicoRequest(
      cfg,
      "POST",
      `/v2/subscription/subscriptions/${encodeURIComponent(providerSubscriptionId)}/cancel`,
      { locale: "tr" }
    );
  },
};

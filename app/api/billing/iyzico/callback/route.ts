import { NextRequest, NextResponse } from "next/server";
import { verifyDevToken } from "@/lib/billing/dev-token";
import { getPlan, periodEndFrom } from "@/lib/billing/plans";
import { retrieveSubscriptionCheckout } from "@/lib/billing/providers/iyzico";
import { applySubscriptionEvent } from "@/lib/billing/subscription";
import { SITE_URL } from "@/lib/site";

/**
 * iyzico abonelik checkout callback'i.
 *
 * Ödeme tamamlanınca iyzico, kullanıcının tarayıcısını form token'ı ile buraya
 * POST'lar. Cross-site POST'ta oturum çerezi gelmez (SameSite=Lax) — kullanıcı
 * eşlemesi, initialize sırasında callbackUrl'e eklediğimiz HMAC-imzalı `state`
 * parametresinden yapılır. Sonuç iyzico'dan sunucu-sunucu retrieve ile
 * doğrulanır; tarayıcıdan gelen hiçbir veriye güvenilmez (token yalnızca
 * retrieve anahtarıdır, state imzalıdır).
 */
async function handleCallback(request: NextRequest): Promise<NextResponse> {
  const failUrl = `${SITE_URL}/premium?payment=failed`;

  const state = request.nextUrl.searchParams.get("state");
  const verified = verifyDevToken(state);
  if (!verified) return NextResponse.redirect(failUrl, 303);

  // iyzico token'ı form-post body'sinde (`token`) veya query'de gelebilir.
  let token = request.nextUrl.searchParams.get("token");
  if (!token) {
    const form = await request.formData().catch(() => null);
    const t = form?.get("token");
    if (typeof t === "string") token = t;
  }
  if (!token) return NextResponse.redirect(failUrl, 303);

  try {
    const result = await retrieveSubscriptionCheckout(token);
    if (!result || result.subscriptionStatus !== "ACTIVE") {
      return NextResponse.redirect(failUrl, 303);
    }

    const plan = getPlan(verified.plan);
    if (!plan) return NextResponse.redirect(failUrl, 303);

    const periodStart = new Date();
    await applySubscriptionEvent({
      kind: "activated",
      userId: verified.userId,
      plan: verified.plan,
      periodStart,
      periodEnd: periodEndFrom(periodStart, plan),
      providerSubscriptionId: result.referenceCode,
      providerCustomerId: result.customerReferenceCode,
    });

    return NextResponse.redirect(`${SITE_URL}/dashboard?upgraded=1`, 303);
  } catch (err) {
    console.error("[iyzico:callback] doğrulama/aktivasyon hatası:", err);
    return NextResponse.redirect(failUrl, 303);
  }
}

export async function POST(request: NextRequest) {
  return handleCallback(request);
}

// Bazı akışlarda iyzico GET ile de dönebilir.
export async function GET(request: NextRequest) {
  return handleCallback(request);
}

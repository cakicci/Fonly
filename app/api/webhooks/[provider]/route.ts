import { NextResponse } from "next/server";
import { getProvider, type ProviderId } from "@/lib/billing/provider";
import { applySubscriptionEvent } from "@/lib/billing/subscription";

/**
 * POST /api/webhooks/{provider}
 *
 * Ödeme sağlayıcısından gelen olayları işler. Sağlayıcı `verifyWebhook` ile
 * imzayı doğrular ve normalize `SubscriptionEvent` döner; biz onu DB'ye yazarız.
 * İmza/parse geçersizse 400 — sağlayıcı yeniden denemesin diye geçerli ama
 * ilgisiz olaylarda 200 dönmek de mümkün (burada null → 400 tutuyoruz).
 *
 * NOT: Webhook'lar sunucu-sunucu çağrıdır, auth cookie taşımaz; güvenlik
 * tamamen `verifyWebhook` imza doğrulamasına dayanır.
 */
const VALID_PROVIDERS = new Set<ProviderId>(["dev", "iyzico", "paytr", "stripe"]);

export async function POST(
  request: Request,
  { params }: { params: { provider: string } }
) {
  if (!VALID_PROVIDERS.has(params.provider as ProviderId)) {
    return NextResponse.json({ message: "Bilinmeyen sağlayıcı." }, { status: 404 });
  }

  let provider;
  try {
    provider = getProvider(params.provider as ProviderId);
  } catch (err) {
    console.error("[webhook] sağlayıcı yüklenemedi:", err);
    return NextResponse.json({ message: "Sağlayıcı yapılandırılmadı." }, { status: 501 });
  }

  let event;
  try {
    event = await provider.verifyWebhook(request);
  } catch (err) {
    console.error("[webhook] doğrulama hatası:", err);
    return NextResponse.json({ message: "Doğrulama hatası." }, { status: 400 });
  }

  if (!event) {
    return NextResponse.json({ message: "Geçersiz veya ilgisiz olay." }, { status: 400 });
  }

  try {
    await applySubscriptionEvent(event);
  } catch (err) {
    console.error("[webhook] DB yazım hatası:", err);
    return NextResponse.json({ message: "İşlenemedi." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, kind: event.kind });
}

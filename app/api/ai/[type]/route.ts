import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isPremium } from "@/lib/auth/premium";

/**
 * POST /api/ai/{type}
 *
 * AI özellik stub'ı. Faz 0'da gerçek motor yok — sadece auth + premium gate'i
 * doğrular ve "coming_soon" döner. Faz 12'de Anthropic SDK ile streaming
 * response'a dönüştürülecek.
 *
 * Body: { context: AIContext }
 */
const VALID_TYPES = new Set([
  "chart-analysis",
  "asset-summary",
  "news-summary",
  "dividend-safety",
  "growth-pricing",
  "technical-summary",
  "company-explainer",
  "ownership-insight",
]);

export async function POST(
  _request: NextRequest,
  { params }: { params: { type: string } }
) {
  if (!VALID_TYPES.has(params.type)) {
    return NextResponse.json(
      { status: "error", message: "Geçersiz AI tipi." },
      { status: 400 }
    );
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { status: "error", message: "Giriş gerekli." },
      { status: 401 }
    );
  }

  // JWT'deki cache'lenmiş değere değil, DB'ye gerçek bakış — güvenlik açısından
  // backend her zaman taze kontrol yapar.
  const premium = await isPremium(session.user.id);
  if (!premium) {
    return NextResponse.json(
      { status: "error", message: "Bu özellik Premium aboneliğe özeldir." },
      { status: 403 }
    );
  }

  return NextResponse.json({
    status:  "coming_soon",
    type:    params.type,
    message: "AI motoru yakında devreye girecek. Premium aboneliğiniz aktif görünüyor; özellik canlıya alındığında bu butondan kullanabileceksiniz.",
  });
}

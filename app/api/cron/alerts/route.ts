import { NextRequest, NextResponse } from "next/server";
import { checkAllActiveAlerts } from "@/lib/chart/alerts";

/**
 * GET /api/cron/alerts — tüm aktif fiyat alarmlarını kontrol eder.
 *
 * Dış zamanlayıcılar için (Vercel Cron, cron-job.org, sistem cron'u vb.).
 * Tek sunuculu `next start` dağıtımında instrumentation.ts zaten 5 dakikada
 * bir aynı kontrolü çalıştırır; bu route ek/alternatif tetikleyicidir.
 *
 * Kimlik: `CRON_SECRET` env'i zorunlu. İstek `Authorization: Bearer <secret>`
 * başlığı (Vercel Cron varsayılanı) veya `?secret=` parametresiyle gelir.
 */
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET tanımlı değil — zamanlanmış kontrol devre dışı." },
      { status: 503 }
    );
  }

  const header = request.headers.get("authorization");
  const provided =
    header?.replace(/^Bearer\s+/i, "") ??
    request.nextUrl.searchParams.get("secret");

  if (provided !== secret) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  try {
    const result = await checkAllActiveAlerts();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[cron:alerts] kontrol başarısız:", err);
    return NextResponse.json({ error: "Kontrol başarısız." }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeWeeklySummary } from "@/lib/portfolio/weeklySummary";
import { sendWeeklySummaryEmail } from "@/lib/mail/mailer";

/**
 * GET /api/cron/weekly-summary — portföyü olan tüm kullanıcılara haftalık
 * özet e-postası yollar.
 *
 * /api/cron/alerts'ten farkı: bu route 5 dakikada bir DEĞİL, haftada bir
 * çalışmalı (aksi halde aynı hafta içinde defalarca mail gider) — bu yüzden
 * instrumentation.ts'in sık aralıklı interval'ına EKLENMEDİ, kasıtlı olarak
 * sadece dış zamanlayıcı (Vercel Cron, cron-job.org) üzerinden tetiklenir.
 * Örn. Vercel Cron: `"0 9 * * 1"` (her Pazartesi 09:00).
 *
 * Kimlik: `CRON_SECRET` env'i zorunlu — /api/cron/alerts ile aynı desen.
 */
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET tanımlı değil — zamanlanmış özet devre dışı." },
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
    const users = await prisma.user.findMany({
      where: { email: { not: null }, portfolioLots: { some: { isDemo: false } } },
      select: { id: true, email: true },
    });

    let sent = 0;
    for (const user of users) {
      if (!user.email) continue;
      const summary = await computeWeeklySummary(user.id);
      if (!summary) continue;
      await sendWeeklySummaryEmail(user.email, summary);
      sent++;
    }

    return NextResponse.json({ ok: true, checked: users.length, sent });
  } catch (err) {
    console.error("[cron:weekly-summary] gönderim başarısız:", err);
    return NextResponse.json({ error: "Gönderim başarısız." }, { status: 500 });
  }
}

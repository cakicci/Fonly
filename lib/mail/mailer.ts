import { Resend } from "resend";

/**
 * E-posta gönderimi (Resend).
 *
 * `RESEND_API_KEY` ayarlıysa gerçek mail gider. Ayarlı değilse (lokal dev),
 * gönderim atlanır ve sıfırlama linki sunucu konsoluna basılır — böylece
 * Resend hesabı olmadan da tüm "şifremi unuttum" akışı uçtan uca test edilebilir.
 *
 * Env:
 *  - RESEND_API_KEY  → gerçek gönderim için
 *  - MAIL_FROM       → gönderen (örn. "Fonly <noreply@alanadi.com>")
 *  - APP_URL         → linklerin üretileceği dış URL (varsayılan localhost:3000)
 */

function appUrl(): string {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

function from(): string {
  // Resend'in test gönderen adresi; prod'da MAIL_FROM ile doğrulanmış alan adı kullan.
  return process.env.MAIL_FROM ?? "Fonly <onboarding@resend.dev>";
}

let client: Resend | null = null;
function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!client) client = new Resend(key);
  return client;
}

/** Ham token'dan tam sıfırlama URL'i üretir. */
export function resetPasswordUrl(token: string): string {
  return `${appUrl()}/reset-password?token=${encodeURIComponent(token)}`;
}

export interface PriceAlertMail {
  /** Varlık görünen adı (örn. "Türk Hava Yolları"). */
  assetName: string;
  /** Detay sayfası path'i (örn. "/hisse/THYAO") — mutlak URL burada üretilir. */
  href: string;
  /** "price" (mutlak TL seviyesi) | "percent_change" (günlük % değişim). */
  triggerType: "price" | "percent_change" | string;
  condition: "above" | "below" | string;
  /** price: TL seviyesi. percent_change: yüzde puan eşiği (örn. 5 = %5). */
  threshold: number;
  /** Tetiklenme anındaki fiyat. */
  price: number;
  /** Tetiklenme anındaki günlük değişim yüzdesi (percent_change'de kullanılır). */
  changePercent?: number | null;
}

const fmtTL = (v: number) =>
  new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 4 }).format(v);

/**
 * Fiyat alarmı e-postası. Şifre sıfırlama ile aynı sözleşme: hata fırlatmaz,
 * RESEND_API_KEY yoksa konsola basar (dev).
 */
export async function sendPriceAlertEmail(to: string, alert: PriceAlertMail): Promise<void> {
  const url = `${appUrl()}${alert.href}`;
  const isAbove = alert.condition === "above";
  const isPercent = alert.triggerType === "percent_change";

  const subject = isPercent
    ? `Fonly Alarm — ${alert.assetName} bugün %${fmtTL(alert.threshold)} ${isAbove ? "yükseldi" : "düştü"}`
    : isAbove
      ? `Fonly Alarm — ${alert.assetName} bugün belirlediğin seviyeyi geçti`
      : `Fonly Alarm — ${alert.assetName} bugün belirlediğin seviyenin altına indi`;

  const line = isPercent
    ? `${alert.assetName} bugün belirlediğin %${fmtTL(alert.threshold)} değişimi geçti, güncel değişim ${alert.changePercent != null ? `${alert.changePercent >= 0 ? "+" : ""}${fmtTL(alert.changePercent)}%` : "bilinmiyor"} — istersen bak.`
    : isAbove
      ? `${alert.assetName} bugün belirlediğin ${fmtTL(alert.threshold)} TL seviyesini geçti, şu an ${fmtTL(alert.price)} TL — istersen bak.`
      : `${alert.assetName} bugün belirlediğin ${fmtTL(alert.threshold)} TL seviyesinin altına indi, şu an ${fmtTL(alert.price)} TL — istersen bak.`;

  const resend = getClient();
  if (!resend) {
    console.log(`[mail:dev] Fiyat alarmı → ${to}\n${line}\n${url}`);
    return;
  }

  try {
    await resend.emails.send({
      from: from(),
      to,
      subject,
      text: `Merhaba,\n\n${line}\n\nDetay: ${url}\n\nBu alarmı Fonly'de sen kurdun; alarmlarını ${appUrl()}/alarmlar adresinden yönetebilirsin.\n\nFonly`,
      html:
        `<div style="font-family:system-ui,Arial,sans-serif;max-width:480px;margin:0 auto;color:#0b1026">` +
        `<h2 style="margin:0 0 12px">${alert.assetName} için kurduğun alarm tetiklendi</h2>` +
        `<p style="margin:0 0 16px;line-height:1.5;color:#374151">${line}</p>` +
        `<p style="margin:0 0 24px"><a href="${url}" ` +
        `style="display:inline-block;background:#34d399;color:#0b1026;text-decoration:none;` +
        `padding:12px 20px;border-radius:12px;font-weight:600">${alert.assetName} detayına git</a></p>` +
        `<p style="margin:0;font-size:12px;color:#6b7280;line-height:1.5">` +
        `Bu alarmı Fonly'de sen kurdun. Alarmlarını <a href="${appUrl()}/alarmlar">buradan</a> yönetebilirsin.</p></div>`,
    });
  } catch (err) {
    console.error("[mail] Fiyat alarmı e-postası gönderilemedi:", err);
  }
}

export interface WeeklySummaryMail {
  changeValue:  number;
  changePct:    number | null;
  currentValue: number;
  bestPerformer:  { name: string; pct: number } | null;
  worstPerformer: { name: string; pct: number } | null;
  goals: Array<{ title: string; pct: number; reached: boolean }>;
}

const fmtTLFull = (v: number) =>
  new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(v);

/**
 * Haftalık portföy özeti e-postası — düz Türkçe, anlatı formatında.
 * Şifre sıfırlama/alarm mailleriyle aynı sözleşme: hata fırlatmaz,
 * RESEND_API_KEY yoksa konsola basar (dev).
 */
export async function sendWeeklySummaryEmail(to: string, data: WeeklySummaryMail): Promise<void> {
  const url = `${appUrl()}/portfoy`;
  const positive = data.changeValue >= 0;
  const pctText = data.changePct != null ? ` (%${fmtTL(Math.abs(data.changePct))})` : "";

  const lines: string[] = [
    `Bu hafta portföyün ${fmtTLFull(Math.abs(data.changeValue))} TL ${positive ? "kazandı" : "kaybetti"}${pctText}.`,
    `Güncel değer: ${fmtTLFull(data.currentValue)} TL.`,
  ];
  if (data.bestPerformer) {
    const sign = data.bestPerformer.pct >= 0 ? "+" : "";
    lines.push(`En çok yükselen: ${data.bestPerformer.name} (${sign}${fmtTL(data.bestPerformer.pct)}%).`);
  }
  if (data.worstPerformer) {
    const sign = data.worstPerformer.pct >= 0 ? "+" : "";
    lines.push(`En çok gerileyen: ${data.worstPerformer.name} (${sign}${fmtTL(data.worstPerformer.pct)}%).`);
  }
  for (const g of data.goals) {
    lines.push(
      g.reached
        ? `🎉 "${g.title}" hedefine ulaştın!`
        : `"${g.title}" hedefine %${fmtTL(g.pct)} yaklaştın.`
    );
  }

  const subject = `Fonly Haftalık Özet — Portföyün ${positive ? "kazandı" : "kaybetti"}`;
  const bodyText = lines.join("\n");

  const resend = getClient();
  if (!resend) {
    console.log(`[mail:dev] Haftalık özet → ${to}\n${bodyText}\n${url}`);
    return;
  }

  try {
    await resend.emails.send({
      from: from(),
      to,
      subject,
      text: `Merhaba,\n\n${bodyText}\n\nPortföyüne göz at: ${url}\n\nFonly`,
      html:
        `<div style="font-family:system-ui,Arial,sans-serif;max-width:480px;margin:0 auto;color:#0b1026">` +
        `<h2 style="margin:0 0 12px">Bu haftanın portföy özeti</h2>` +
        lines.map((l) => `<p style="margin:0 0 10px;line-height:1.5;color:#374151">${l}</p>`).join("") +
        `<p style="margin:16px 0 0"><a href="${url}" ` +
        `style="display:inline-block;background:#34d399;color:#0b1026;text-decoration:none;` +
        `padding:12px 20px;border-radius:12px;font-weight:600">Portföyüne göz at</a></p>` +
        `<p style="margin:16px 0 0;font-size:12px;color:#6b7280;line-height:1.5">` +
        `Bu, Fonly'deki portföyün için haftalık gönderilen bilgilendirme özetidir.</p></div>`,
    });
  } catch (err) {
    console.error("[mail] Haftalık özet e-postası gönderilemedi:", err);
  }
}

/**
 * Şifre sıfırlama e-postası gönderir. Hata fırlatmaz — gönderim başarısız olsa
 * bile çağıran route kullanıcıya aynı nötr yanıtı döner (e-posta varlığını sızdırmamak için).
 */
export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const url = resetPasswordUrl(token);
  const resend = getClient();

  if (!resend) {
    // Dev fallback — RESEND_API_KEY yoksa maili gönderme, linki konsola bas.
    console.log(`[mail:dev] Şifre sıfırlama linki → ${to}\n${url}`);
    return;
  }

  try {
    await resend.emails.send({
      from: from(),
      to,
      subject: "Fonly — Şifre sıfırlama",
      text:
        `Merhaba,\n\n` +
        `Fonly hesabının şifresini sıfırlamak için aşağıdaki bağlantıya tıkla:\n${url}\n\n` +
        `Bu bağlantı 1 saat geçerlidir ve yalnızca bir kez kullanılabilir.\n` +
        `Bu isteği sen yapmadıysan bu e-postayı yok sayabilirsin; şifren değişmez.\n\n` +
        `Fonly`,
      html:
        `<div style="font-family:system-ui,Arial,sans-serif;max-width:480px;margin:0 auto;color:#0b1026">` +
        `<h2 style="margin:0 0 12px">Şifre sıfırlama</h2>` +
        `<p style="margin:0 0 16px;line-height:1.5;color:#374151">` +
        `Fonly hesabının şifresini sıfırlamak için aşağıdaki butona tıkla. ` +
        `Bağlantı <strong>1 saat</strong> geçerlidir ve yalnızca bir kez kullanılabilir.</p>` +
        `<p style="margin:0 0 24px"><a href="${url}" ` +
        `style="display:inline-block;background:#34d399;color:#0b1026;text-decoration:none;` +
        `padding:12px 20px;border-radius:12px;font-weight:600">Şifreyi sıfırla</a></p>` +
        `<p style="margin:0;font-size:12px;color:#6b7280;line-height:1.5">` +
        `Buton çalışmazsa bu adresi tarayıcına yapıştır:<br>${url}<br><br>` +
        `Bu isteği sen yapmadıysan e-postayı yok say; şifren değişmez.</p></div>`,
    });
  } catch (err) {
    // Gönderim hatası akışı bozmasın; logla ve sessizce dön.
    console.error("[mail] Şifre sıfırlama e-postası gönderilemedi:", err);
  }
}

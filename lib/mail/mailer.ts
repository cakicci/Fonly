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

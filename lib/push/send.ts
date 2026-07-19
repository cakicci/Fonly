import webpush from "web-push";
import { prisma } from "@/lib/prisma";

/**
 * Web Push gönderim yardımcısı. VAPID anahtarları boşsa (dev'de kurulmamışsa)
 * tüm çağrılar sessizce no-op olur — mailer.ts'teki RESEND_API_KEY yoksa
 * konsola düşme örüntüsünün aynısı, ama push'ta konsol logu bile gerekmiyor
 * (e-posta zaten birincil bildirim kanalı).
 */

let configured = false;
function ensureConfigured(): boolean {
  if (configured) return true;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:destek@fonly.app";
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

/**
 * Bir kullanıcının kayıtlı tüm push aboneliklerine bildirim yollar.
 * Geçersiz/süresi dolmuş abonelikler (410 Gone / 404) sessizce DB'den silinir.
 * Diğer hatalar best-effort — bir cihazın başarısız olması diğerlerini etkilemez.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!ensureConfigured()) return;

  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  if (subs.length === 0) return;

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload)
        );
      } catch (err) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
        // diğer hatalar (ağ, geçici) sessizce geçilir — kritik path değil
      }
    })
  );
}

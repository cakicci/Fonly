import crypto from "crypto";
import { isPlanId, type PlanId } from "./plans";

/**
 * Dev sağlayıcı için imzalı checkout token'ı (mini-JWT).
 *
 * Gerçek PSP'de ödeme onayını sağlayıcı imzalı webhook ile bildirir. Dev
 * modunda o imzayı kendimiz `AUTH_SECRET` ile HMAC'leyerek taklit ediyoruz —
 * böylece /api/checkout → onay → /api/webhooks/dev akışı sahteye karşı korunur
 * (kullanıcı token'ı kurcalayıp başkası adına abonelik açamaz).
 *
 * Format: base64url(payload) + "." + base64url(hmacSHA256)
 */

interface DevTokenPayload {
  userId: string;
  plan: PlanId;
  /** epoch ms — son kullanma. */
  exp: number;
}

function secret(): string {
  return process.env.AUTH_SECRET ?? "development-fonly-auth-secret-change-me";
}

function b64url(buf: Buffer | string): string {
  return Buffer.from(buf).toString("base64url");
}

function sign(payloadB64: string): string {
  return crypto.createHmac("sha256", secret()).update(payloadB64).digest("base64url");
}

const DEFAULT_TTL_MS = 30 * 60 * 1000; // 30 dk

export function createDevToken(
  userId: string,
  plan: PlanId,
  ttlMs: number = DEFAULT_TTL_MS
): string {
  const payload: DevTokenPayload = { userId, plan, exp: Date.now() + ttlMs };
  const payloadB64 = b64url(JSON.stringify(payload));
  return `${payloadB64}.${sign(payloadB64)}`;
}

/** Token'ı doğrular; imza/exp geçersizse null. */
export function verifyDevToken(token: string | null | undefined): {
  userId: string;
  plan: PlanId;
} | null {
  if (!token || typeof token !== "string") return null;
  const dot = token.indexOf(".");
  if (dot === -1) return null;

  const payloadB64 = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  const expected = sign(payloadB64);
  // Sabit zamanlı karşılaştırma — uzunluk eşitse timingSafeEqual.
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  let payload: DevTokenPayload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (!payload || typeof payload.userId !== "string" || !isPlanId(payload.plan)) return null;
  if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;

  return { userId: payload.userId, plan: payload.plan };
}

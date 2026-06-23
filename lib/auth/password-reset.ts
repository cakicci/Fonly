import crypto from "crypto";

/**
 * Şifre sıfırlama token'ı için saf yardımcılar.
 *
 * Akış: kullanıcı "şifremi unuttum" der → `generateResetToken()` ile ham token
 * üretilir, e-postadaki linke konur. DB'ye yalnızca `hashResetToken()` (SHA-256)
 * yazılır — böylece DB sızsa bile linkler tahmin/yeniden kullanılamaz. Doğrulama
 * sırasında gelen ham token tekrar hash'lenip DB'deki hash ile karşılaştırılır.
 *
 * Bu modül kasıtlı olarak saf (DB/IO yok) — `tests/` altında test edilir.
 */

/** Token geçerlilik süresi (ms). */
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 saat

/** URL-güvenli ham token üretir (e-postadaki linkte gider, DB'ye yazılmaz). */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

/** Ham token'ı DB'de saklamak için SHA-256 hex'e çevirir (deterministik). */
export function hashResetToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/** Verilen `now`'a (ms) göre yeni token'ın son kullanma tarihi. */
export function resetTokenExpiry(now: number = Date.now()): Date {
  return new Date(now + RESET_TOKEN_TTL_MS);
}

/** Token'ın süresi geçmiş mi (expires < now). */
export function isTokenExpired(expires: Date, now: number = Date.now()): boolean {
  return expires.getTime() < now;
}

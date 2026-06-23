/**
 * Basit in-memory sabit pencere (fixed-window) rate limiter.
 *
 * Kapsam: tek instance içinde process-belleğinde tutulur. Serverless/multi-instance
 * dağıtımda her instance kendi sayacını tutar — yani gerçek global limit için
 * Redis/Upstash gibi paylaşımlı bir store gerekir. Yine de tek sunuculu dev/prod'da
 * ve kötüye kullanımı yavaşlatmak için yeterli; hiç limit olmamasından çok daha iyi.
 *
 * Kullanım:
 *   const { ok, retryAfter } = rateLimit(`register:${ip}`, { limit: 5, windowMs: 600_000 });
 *   if (!ok) return new Response(..., { status: 429, headers: { "Retry-After": ... } });
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Map'in sınırsız büyümesini önlemek için ara sıra süresi dolmuş kovaları temizle.
const CLEANUP_EVERY = 500;
let opsSinceCleanup = 0;

function cleanup(now: number): void {
  for (const [key, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(key);
  }
}

export interface RateLimitOptions {
  /** Pencere başına izin verilen istek sayısı. */
  limit: number;
  /** Pencere uzunluğu (ms). */
  windowMs: number;
  /** Test için enjekte edilebilir saat; verilmezse Date.now(). */
  now?: number;
}

export interface RateLimitResult {
  /** İstek limit dahilinde mi. */
  ok: boolean;
  /** Bu pencerede kalan istek hakkı. */
  remaining: number;
  /** Pencerenin sıfırlanacağı epoch ms. */
  resetAt: number;
  /** Limit aşıldıysa kaç saniye sonra tekrar denenebilir (ok=false iken). */
  retryAfter: number;
}

export function rateLimit(key: string, opts: RateLimitOptions): RateLimitResult {
  const now = opts.now ?? Date.now();

  if (++opsSinceCleanup >= CLEANUP_EVERY) {
    opsSinceCleanup = 0;
    cleanup(now);
  }

  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + opts.windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { ok: true, remaining: opts.limit - 1, resetAt, retryAfter: 0 };
  }

  existing.count += 1;
  if (existing.count > opts.limit) {
    return {
      ok: false,
      remaining: 0,
      resetAt: existing.resetAt,
      retryAfter: Math.ceil((existing.resetAt - now) / 1000),
    };
  }

  return {
    ok: true,
    remaining: opts.limit - existing.count,
    resetAt: existing.resetAt,
    retryAfter: 0,
  };
}

/**
 * İstekten istemci IP'sini çıkarır. Proxy/CDN arkasında `x-forwarded-for`
 * ilk değeri gerçek istemcidir; yoksa `x-real-ip`; ikisi de yoksa "unknown"
 * (bu durumda tüm anonim istekler aynı kovayı paylaşır — kasıtlı muhafazakâr).
 */
export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

/** Test yardımcısı — kova durumunu sıfırlar. */
export function __resetRateLimitStore(): void {
  buckets.clear();
  opsSinceCleanup = 0;
}

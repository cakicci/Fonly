/**
 * Yahoo Finance "crumb" / cookie yöneticisi.
 *
 * v10/finance/quoteSummary 2024'ten itibaren her isteğe geçerli bir
 *   ?crumb=...  +  Cookie: A1=...; A3=...;  ikilisi bekliyor.
 *
 * Akış:
 *   1. GET https://fc.yahoo.com  → set-cookie header'larından A1/A3/... topla
 *   2. GET https://query1.finance.yahoo.com/v1/test/getcrumb  (cookie ile)
 *        → plain text crumb döner
 *   3. quoteSummary çağrılarına bu çifti ekle
 *
 * Crumb 24+ saat geçerli; biz daha kısa cache'liyoruz (1 saat) ki
 * IP rotation senaryolarında otomatik tazelensin. "Invalid Crumb" hatası
 * alınırsa cache invalidate edip bir kez retry'lanır.
 */

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const CACHE_MS = 60 * 60 * 1000;

interface CrumbCache {
  crumb:     string;
  cookie:    string;
  expiresAt: number;
}

let cached: CrumbCache | null = null;
let inFlight: Promise<CrumbCache> | null = null;

function parseSetCookieHeaders(headers: Headers): string {
  // Node 18+ / undici: getSetCookie() string[] döner
  // Fallback: tek tek Set-Cookie header'ı (uniqueness uyarısı verir).
  type HdrsExt = Headers & { getSetCookie?: () => string[] };
  const ext = headers as HdrsExt;
  const sc =
    typeof ext.getSetCookie === "function"
      ? ext.getSetCookie()
      : headers.get("set-cookie")
        ? [headers.get("set-cookie") as string]
        : [];

  // Her set-cookie'nin ilk segmenti "name=value" — domain/path/expires uçur.
  const pairs = sc
    .map(s => s.split(";")[0].trim())
    .filter(p => p && p.includes("="));

  return pairs.join("; ");
}

async function fetchFresh(): Promise<CrumbCache> {
  // 1. Cookie almak için fc.yahoo.com — bazen 404 verir ama set-cookie yine gelir.
  const res1 = await fetch("https://fc.yahoo.com", {
    headers:  { "User-Agent": UA },
    redirect: "manual",
  });
  const cookie = parseSetCookieHeaders(res1.headers);
  if (!cookie) {
    throw new Error("Yahoo cookie alınamadı");
  }

  // 2. Crumb'u al
  const res2 = await fetch("https://query1.finance.yahoo.com/v1/test/getcrumb", {
    headers: {
      "User-Agent": UA,
      Cookie:       cookie,
    },
  });
  if (!res2.ok) {
    throw new Error(`Yahoo getcrumb HTTP ${res2.status}`);
  }
  const crumb = (await res2.text()).trim();
  if (!crumb || crumb.length < 4) {
    throw new Error("Yahoo crumb boş döndü");
  }

  return {
    crumb,
    cookie,
    expiresAt: Date.now() + CACHE_MS,
  };
}

export async function getYahooCrumb(): Promise<{ crumb: string; cookie: string }> {
  if (cached && Date.now() < cached.expiresAt) return cached;

  // Aynı anda birden fazla istek gelirse tek bir fetchFresh paylaşılır.
  if (!inFlight) {
    inFlight = fetchFresh()
      .then(c => { cached = c; return c; })
      .finally(() => { inFlight = null; });
  }
  return inFlight;
}

export function invalidateYahooCrumb(): void {
  cached = null;
}

import { getYahooCrumb, invalidateYahooCrumb } from "./crumb";

/**
 * Yahoo v10 quoteSummary çağrısı — crumb-aware ve tek seferlik retry'lı.
 *
 * BIST sembolleri için ticker `.IS` suffix'iyle gönderilmelidir.
 * Çağıran kod parsing'i kendisi yapar — bu fonksiyon ham modül objesini döner.
 */

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

interface QuoteSummaryEnvelope {
  quoteSummary?: {
    result?: unknown[] | null;
    error?:  { code?: string; description?: string } | null;
  };
}

/** Tüm Yahoo Finance fundamental modülleri için ortak tip yardımcıları. */
export interface YahooNum {
  raw?:     number;
  fmt?:     string;
  longFmt?: string;
}

export interface YahooDate {
  raw?: number;  // epoch saniye
  fmt?: string;  // "2024-12-31"
}

async function callOnce(symbol: string, modules: string[]): Promise<unknown | null> {
  const { crumb, cookie } = await getYahooCrumb();
  const url =
    `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}` +
    `?modules=${modules.join(",")}&crumb=${encodeURIComponent(crumb)}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Cookie:       cookie,
    },
    // 1 saatlik server cache — sayfa içindeki polling'in upstream'i ezmesini önler.
    next: { revalidate: 3600 },
  });

  if (res.status === 401) {
    // Crumb expire olmuş — invalidate et, üst seviye retry alır.
    invalidateYahooCrumb();
    return "RETRY";
  }
  if (!res.ok) return null;

  const json = (await res.json()) as QuoteSummaryEnvelope;
  if (json?.quoteSummary?.error) return null;
  const result = json?.quoteSummary?.result?.[0];
  return result ?? null;
}

/**
 * Bir BIST sembolü için istenen modülleri çek (örn. "THYAO.IS").
 *
 * @returns Yahoo'nun döndüğü ham result objesi — modüller alt-key olarak içinde.
 *          Hata veya bulunmazsa null.
 */
export async function fetchQuoteSummary<T = Record<string, unknown>>(
  symbol: string,
  modules: string[],
): Promise<T | null> {
  const r1 = await callOnce(symbol, modules);
  if (r1 === "RETRY") {
    const r2 = await callOnce(symbol, modules);
    return r2 === "RETRY" ? null : (r2 as T | null);
  }
  return r1 as T | null;
}

/**
 * TEFAS (Türkiye Elektronik Fon Alım Satım Platformu) v2 client.
 *
 * Endpoint'ler 2026-04 Next.js geçişi sonrası /api/funds/* altında JSON kabul
 * ediyor; eski form-urlencoded /api/DB/* endpoint'leri 404 dönüyor.
 * Tüm yanıtlar {errorCode, errorMessage, resultList} zarfı ile gelir.
 *
 * Çıkış noktası: borsapy/_providers/tefas.py (MIT, saidsurucu).
 */

const TEFAS_BASE = "https://www.tefas.gov.tr/api/funds";

const TEFAS_HEADERS: HeadersInit = {
  "Content-Type": "application/json",
  Accept: "application/json",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
  Referer: "https://www.tefas.gov.tr/",
};

interface TefasEnvelope<T> {
  errorCode: string | null;
  errorMessage: string | null;
  resultList: T[] | null;
}

// ── Ham TEFAS satır tipleri ─────────────────────────────────────────────────

/** fonGetiriBazliBilgiGetir — toplu getiri listesi (tüm fonlar) */
export interface TefasFundReturnRow {
  fonKodu: string;
  fonUnvan: string;
  fonTurAciklama: string;
  tefasDurum: boolean;
  riskDegeri: string | null; // "1".."7"
  getiri1a: number | null;
  getiri3a: number | null;
  getiri6a: number | null;
  getiriyb: number | null;
  getiri1y: number | null;
  getiri3y: number | null;
  getiri5y: number | null;
  getiriOrani: number | null;
}

/** fonBilgiGetir — tek fon detayı */
export interface TefasFundInfoRow {
  fonKodu: string;
  fonUnvan: string;
  sonFiyat: number;
  gunlukGetiri: number | null;
  payAdet: number | null;
  portBuyukluk: number | null;
  fonKategori: string | null;
  kategoriDerece: number | null;
  kategoriFonSay: number | null;
  yatirimciSayi: number | null;
  pazarPayi: number | null;
}

/** fonFiyatBilgiGetir — geçmiş NAV (tek satır) */
export interface TefasPricePointRow {
  fonKodu: string;
  fonUnvan: string;
  tarih: string; // ISO "2026-05-25"
  fiyat: number;
  kategoriDerece: number | null;
  kategoriFonSay: number | null;
}

// ── HTTP yardımcısı ──────────────────────────────────────────────────────────

/**
 * TEFAS WAF aralıklı olarak boş gövde veya HTML bakım sayfası dönebiliyor.
 * 3 deneme + exponential backoff (250ms, 500ms, 1s).
 */
async function tefasPost<T>(
  endpoint: string,
  payload: Record<string, unknown>,
  revalidate = 3600
): Promise<T[]> {
  const url = `${TEFAS_BASE}/${endpoint}`;

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, 250 * 2 ** (attempt - 1)));
    }

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: TEFAS_HEADERS,
        body: JSON.stringify(payload),
        next: { revalidate },
      });

      if (!res.ok) {
        lastError = new Error(`TEFAS ${endpoint}: HTTP ${res.status}`);
        continue;
      }

      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("json")) {
        lastError = new Error(`TEFAS ${endpoint}: non-JSON response`);
        continue;
      }

      const data = (await res.json()) as TefasEnvelope<T>;
      if (data.errorMessage) {
        throw new Error(`TEFAS ${endpoint}: ${data.errorMessage}`);
      }
      return data.resultList ?? [];
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError ?? new Error(`TEFAS ${endpoint}: unknown failure`);
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Tüm yatırım fonları + dönem getirileri (1a/3a/6a/YB/1y/3y/5y) + risk.
 * fonTipi: "YAT" (yatırım, varsayılan) | "EMK" (emeklilik) | "BYF" (ETF).
 */
export async function fetchAllFundReturns(
  fonTipi: "YAT" | "EMK" | "BYF" = "YAT",
  revalidate = 3600
): Promise<TefasFundReturnRow[]> {
  return tefasPost<TefasFundReturnRow>(
    "fonGetiriBazliBilgiGetir",
    {
      fonTipi,
      dil: "TR",
      calismaTipi: 2,
      donemGetiri1a: "1",
      donemGetiri3a: "1",
      donemGetiri6a: "1",
      donemGetiriyb: "1",
      donemGetiri1y: "1",
      donemGetiri3y: "1",
      donemGetiri5y: "1",
    },
    revalidate
  );
}

/** Tek fon için güncel fiyat, portföy büyüklüğü, yatırımcı sayısı vb. */
export async function fetchFundDetail(
  fonKodu: string,
  revalidate = 3600
): Promise<TefasFundInfoRow | null> {
  const rows = await tefasPost<TefasFundInfoRow>(
    "fonBilgiGetir",
    { fonKodu: fonKodu.toUpperCase() },
    revalidate
  );
  return rows[0] ?? null;
}

/**
 * Geçmiş NAV serisi. periyod enum (sadece şu değerler geçerli):
 *   13 = 1 hafta, 1 = 1 ay, 3 = 3 ay, 6 = 6 ay,
 *   12 = 1 yıl, 36 = 3 yıl, 60 = 5 yıl (azami)
 */
export type TefasPeriyod = 13 | 1 | 3 | 6 | 12 | 36 | 60;

export async function fetchFundHistory(
  fonKodu: string,
  periyod: TefasPeriyod = 12,
  revalidate = 300
): Promise<TefasPricePointRow[]> {
  return tefasPost<TefasPricePointRow>(
    "fonFiyatBilgiGetir",
    { fonKodu: fonKodu.toUpperCase(), dil: "TR", periyod },
    revalidate
  );
}

// ── Domain helpers ──────────────────────────────────────────────────────────

/** TEFAS riskDegeri (1–7) → projemizdeki "low" | "medium" | "high" eşlemesi. */
export function tefasRiskToCategory(
  riskDegeri: string | null | undefined
): "low" | "medium" | "high" | null {
  if (!riskDegeri) return null;
  const n = parseInt(riskDegeri, 10);
  if (isNaN(n)) return null;
  if (n <= 3) return "low";
  if (n <= 5) return "medium";
  return "high";
}

/**
 * Türkçe arama için karakter normalizasyonu.
 * "ÇİĞDEM" → "cigdem" şeklinde aksansız küçük harfe çevirir.
 */
export function normalizeTurkish(text: string): string {
  return text
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/i̇/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");
}

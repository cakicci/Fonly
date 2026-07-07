/**
 * Slug → günlük TL fiyat serisi altyapısı.
 *
 * app/api/history/[slug] (varlık grafikleri) ve app/api/portfolio/history
 * (portföy değer grafiği) ortak kullanır. Ticker eşlemeleri ve sentez
 * formülleri (altın = GC=F × USDTRY × gram, egzotik döviz = USDTRY ÷ USD<KOD>)
 * tek yerde durur.
 */

import { CURRENCY_MAP } from "@/data/currencies";
import { GOLD_TYPE_MAP } from "@/data/gold-types";
import { fetchYahooHistory } from "@/lib/market-data";
import { fetchFundHistory, type TefasPeriyod } from "@/lib/tefas";

// ── Yahoo Finance ticker eşlemeleri ─────────────────────────────────────────

export const FOREX_TICKER: Record<string, string> = {
  USD: "USDTRY=X", EUR: "EURTRY=X", GBP: "GBPTRY=X",
  CHF: "CHFTRY=X", JPY: "JPYTRY=X", CNY: "CNYTRY=X",
  CAD: "CADTRY=X", AUD: "AUDTRY=X",
};

// Exotic currencies: USD/<CODE> rate on Yahoo. TRY/<CODE> = USDTRY ÷ USD<CODE>.
export const FOREX_CROSS_TICKER: Record<string, string> = {
  RUB: "RUB=X", SAR: "SAR=X", AED: "AED=X", KWD: "KWD=X", BHD: "BHD=X",
  LYD: "LYD=X", ILS: "ILS=X", IQD: "IQD=X", SEK: "SEK=X", NOK: "NOK=X",
  DKK: "DKK=X", PLN: "PLN=X", CZK: "CZK=X", HUF: "HUF=X", RON: "RON=X",
  ZAR: "ZAR=X", INR: "INR=X", IDR: "IDR=X", MXN: "MXN=X", BRL: "BRL=X",
  ARS: "ARS=X", NZD: "NZD=X",
};

export const RANGE_CFG: Record<string, { range: string; interval: string }> = {
  "1h": { range: "5d",  interval: "1d"  },
  "3a": { range: "3mo", interval: "1d"  },
  "1y": { range: "1y",  interval: "1d"  },
  "5y": { range: "5y",  interval: "1wk" },
};

// TEFAS periyod kodları — fon endpoint'i sabit enum bekliyor.
export const FON_PERIYOD: Record<string, TefasPeriyod> = {
  "1h": 13, // 1 hafta
  "3a": 3,  // 3 ay
  "1y": 12, // 1 yıl
  "5y": 60, // 5 yıl (azami)
};

// ── Map yardımcıları ─────────────────────────────────────────────────────────

/** İki tarih→değer Map'ini hizalar; comp tarafında backward-fill uygular. */
export function alignMaps(
  main: Map<string, number>,
  comp: Map<string, number>
): Array<{ date: string; mainVal: number; compVal: number }> {
  const compSorted = [...comp.entries()].sort(([a], [b]) => a.localeCompare(b));
  const mainSorted = [...main.entries()].sort(([a], [b]) => a.localeCompare(b));

  const result: Array<{ date: string; mainVal: number; compVal: number }> = [];
  let compIdx = 0;
  for (const [date, mainVal] of mainSorted) {
    while (compIdx + 1 < compSorted.length && compSorted[compIdx + 1][0] <= date) {
      compIdx++;
    }
    const compVal = compSorted[compIdx]?.[1];
    if (compVal == null) continue;
    result.push({ date, mainVal, compVal });
  }
  return result;
}

/** Gram altın TL serisi: GC=F (USD/oz) × USDTRY ÷ 31.1035. */
export function buildGramAltinMap(
  gcMap: Map<string, number>,
  usdtryMap: Map<string, number>
): Map<string, number> {
  const result = new Map<string, number>();
  const usdSorted = [...usdtryMap.entries()].sort(([a], [b]) => a.localeCompare(b));
  let usdIdx = 0;

  for (const [date, gcPrice] of [...gcMap.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    while (usdIdx + 1 < usdSorted.length && usdSorted[usdIdx + 1][0] <= date) {
      usdIdx++;
    }
    const usdtry = usdSorted[usdIdx]?.[1];
    if (!usdtry) continue;
    result.set(date, (gcPrice / 31.1035) * usdtry);
  }
  return result;
}

/** Egzotik döviz TL serisi: USDTRY ÷ USD<KOD> per gün. */
export function buildExoticForexMap(
  usdCodeMap: Map<string, number>,
  usdtryMap: Map<string, number>
): Map<string, number> {
  const result = new Map<string, number>();
  const fxSorted = [...usdtryMap.entries()].sort(([a], [b]) => a.localeCompare(b));
  let fxIdx = 0;

  for (const [date, usdCode] of [...usdCodeMap.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    if (usdCode <= 0) continue;
    while (fxIdx + 1 < fxSorted.length && fxSorted[fxIdx + 1][0] <= date) {
      fxIdx++;
    }
    const usdtry = fxSorted[fxIdx]?.[1];
    if (!usdtry) continue;
    result.set(date, usdtry / usdCode);
  }
  return result;
}

// ── Slug → günlük TL serisi ──────────────────────────────────────────────────

/**
 * Tek slug için günlük TL fiyat serisi (tarih ISO "YYYY-MM-DD" → birim fiyat).
 * Desteklenmeyen varlık (antika altın vb.) veya kaynak hatasında null.
 */
export async function fetchDailySeries(
  slug: string,
  range: string
): Promise<Map<string, number> | null> {
  const cfg = RANGE_CFG[range] ?? RANGE_CFG["1y"];
  const dashIdx = slug.indexOf("-");
  if (dashIdx === -1) return null;
  const type = slug.substring(0, dashIdx);
  const code = slug.substring(dashIdx + 1);

  try {
    if (type === "hisse") {
      return await fetchYahooHistory(`${code.toUpperCase()}.IS`, cfg.range, cfg.interval);
    }

    if (type === "doviz") {
      const upper = code.toUpperCase();
      if (!CURRENCY_MAP[upper]) return null;
      const direct = FOREX_TICKER[upper];
      if (direct) return await fetchYahooHistory(direct, cfg.range, cfg.interval);
      const cross = FOREX_CROSS_TICKER[upper];
      if (!cross) return null;
      const [crossMap, usdtryMap] = await Promise.all([
        fetchYahooHistory(cross, cfg.range, cfg.interval),
        fetchYahooHistory("USDTRY=X", cfg.range, cfg.interval),
      ]);
      if (!crossMap || !usdtryMap) return null;
      return buildExoticForexMap(crossMap, usdtryMap);
    }

    if (type === "altin") {
      const meta = GOLD_TYPE_MAP[code.toLowerCase()];
      if (!meta?.weightG) return null; // antika/ayar/gümüş: geçmiş yok
      const [gcMap, usdtryMap] = await Promise.all([
        fetchYahooHistory("GC=F", cfg.range, cfg.interval),
        fetchYahooHistory("USDTRY=X", cfg.range, cfg.interval),
      ]);
      if (!gcMap || !usdtryMap) return null;
      const gram = buildGramAltinMap(gcMap, usdtryMap);
      const result = new Map<string, number>();
      for (const [date, v] of gram) result.set(date, v * meta.weightG!);
      return result;
    }

    if (type === "fon") {
      const periyod = FON_PERIYOD[range] ?? 12;
      const rows = await fetchFundHistory(code.toUpperCase(), periyod);
      if (!rows.length) return null;
      const map = new Map<string, number>();
      for (const row of rows) {
        const date = row.tarih?.slice(0, 10);
        if (date && row.fiyat != null) map.set(date, row.fiyat);
      }
      return map.size > 0 ? map : null;
    }

    return null;
  } catch {
    return null;
  }
}

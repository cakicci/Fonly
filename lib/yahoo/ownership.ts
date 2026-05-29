import { fetchQuoteSummary, type YahooNum } from "./quoteSummary";

/**
 * Sahiplik yapısı — Yahoo `majorHoldersBreakdown` + `netSharePurchaseActivity`.
 *
 * TR hisseleri için sadece toplu yüzdeler ve toplam kurum sayısı dolar;
 * tek tek kurum/fon/insider listeleri (`institutionOwnership`,
 * `fundOwnership`, `insiderHolders`) boş döner. Detaylı liste yol haritasında.
 */

interface RawMajor {
  insidersPercentHeld?:          YahooNum;
  institutionsPercentHeld?:      YahooNum;
  institutionsFloatPercentHeld?: YahooNum;
  institutionsCount?:            YahooNum;
}

interface RawNetActivity {
  netInstSharesBuying?:          YahooNum;
  netInstBuyingPercent?:         YahooNum;
  totalInsiderShares?:           YahooNum;
  period?:                       string;
}

interface RawResult {
  majorHoldersBreakdown?:    RawMajor;
  netSharePurchaseActivity?: RawNetActivity;
}

export interface OwnershipBreakdown {
  symbol:               string;
  insidersPercent:      number | null;
  institutionsPercent:  number | null;
  floatPercent:         number | null;
  /** Hisseyi tutan toplam kurum sayısı. */
  institutionsCount:    number | null;
  /** Son raporlama dönemindeki net kurumsal alış (paylar). */
  netInstSharesBuying:  number | null;
  /** Net kurumsal alış yüzdesi (oran formunda, 0.01 = 1%). */
  netInstBuyingPercent: number | null;
  totalInsiderShares:   number | null;
  netActivityPeriod:    string | null;
}

function num(f: YahooNum | undefined): number | null {
  return f?.raw != null && Number.isFinite(f.raw) ? f.raw : null;
}

export async function fetchOwnership(symbol: string): Promise<OwnershipBreakdown | null> {
  const ticker = `${symbol.toUpperCase()}.IS`;
  const raw = await fetchQuoteSummary<RawResult>(
    ticker,
    ["majorHoldersBreakdown", "netSharePurchaseActivity"],
  );
  if (!raw) return null;

  const m = raw.majorHoldersBreakdown    ?? {};
  const n = raw.netSharePurchaseActivity ?? {};

  // Hiç veri yoksa null
  if (
    num(m.insidersPercentHeld)         == null &&
    num(m.institutionsPercentHeld)     == null &&
    num(m.institutionsFloatPercentHeld) == null
  ) {
    return null;
  }

  return {
    symbol:               symbol.toUpperCase(),
    insidersPercent:      num(m.insidersPercentHeld),
    institutionsPercent:  num(m.institutionsPercentHeld),
    floatPercent:         num(m.institutionsFloatPercentHeld),
    institutionsCount:    num(m.institutionsCount),
    netInstSharesBuying:  num(n.netInstSharesBuying),
    netInstBuyingPercent: num(n.netInstBuyingPercent),
    totalInsiderShares:   num(n.totalInsiderShares),
    netActivityPeriod:    n.period ?? null,
  };
}

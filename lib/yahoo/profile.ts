import { fetchQuoteSummary } from "./quoteSummary";

/**
 * Şirket profili — Yahoo `assetProfile` modülünden çekilir.
 * TR hisseleri için adres, sektör, endüstri, çalışan sayısı, iş tanımı ve
 * üst düzey yönetici listesi dolu gelir.
 *
 * Açıklamalar Yahoo'da İngilizce — premium AI butonuyla Türkçe özet
 * üretilmesi Faz 12'ye bırakıldı; şimdilik olduğu gibi gösteriliyor.
 */

// ── Ham Yahoo şeması ─────────────────────────────────────────────────────────

interface RawOfficer {
  name?:     string;
  title?:    string;
  age?:      number;
  yearBorn?: number;
}

interface RawAssetProfile {
  address1?:              string;
  address2?:              string;
  city?:                  string;
  zip?:                   string;
  country?:               string;
  phone?:                 string;
  fax?:                   string;
  website?:               string;
  industry?:              string;
  industryDisp?:          string;
  sector?:                string;
  sectorDisp?:            string;
  longBusinessSummary?:   string;
  fullTimeEmployees?:     number;
  companyOfficers?:       RawOfficer[];
}

interface RawProfileResult {
  assetProfile?: RawAssetProfile;
}

// ── Halka açık tip ───────────────────────────────────────────────────────────

export interface CompanyOfficer {
  name:  string;
  title: string;
  /** Yahoo bilirse yaş; yoksa null. */
  age:   number | null;
}

export interface CompanyProfile {
  symbol:            string;
  /** Sektör (örn. "Industrials"). */
  sector:            string | null;
  /** Endüstri (örn. "Airlines"). */
  industry:          string | null;
  fullTimeEmployees: number | null;
  longBusinessSummary: string | null;
  // iletişim
  address:           string | null;  // "addr1 addr2, city zip, country"
  city:              string | null;
  country:           string | null;
  phone:             string | null;
  fax:               string | null;
  website:           string | null;
  officers:          CompanyOfficer[];
}

function joinAddress(p: RawAssetProfile): string | null {
  const parts = [
    [p.address1, p.address2].filter(Boolean).join(" "),
    [p.city, p.zip].filter(Boolean).join(" "),
    p.country,
  ].filter(s => s && s.length > 0);
  return parts.length > 0 ? parts.join(", ") : null;
}

// ── Fetcher ──────────────────────────────────────────────────────────────────

export async function fetchCompanyProfile(symbol: string): Promise<CompanyProfile | null> {
  const ticker = `${symbol.toUpperCase()}.IS`;
  const raw = await fetchQuoteSummary<RawProfileResult>(ticker, ["assetProfile"]);
  const p = raw?.assetProfile;
  if (!p) return null;

  return {
    symbol:              symbol.toUpperCase(),
    sector:              p.sectorDisp   ?? p.sector   ?? null,
    industry:            p.industryDisp ?? p.industry ?? null,
    fullTimeEmployees:   p.fullTimeEmployees ?? null,
    longBusinessSummary: p.longBusinessSummary ?? null,
    address:             joinAddress(p),
    city:                p.city    ?? null,
    country:             p.country ?? null,
    phone:               p.phone   ?? null,
    fax:                 p.fax     ?? null,
    website:             p.website ?? null,
    officers: (p.companyOfficers ?? [])
      .filter(o => o.name && o.title)
      .map(o => ({
        name:  o.name!,
        title: o.title!,
        age:   o.age ?? (o.yearBorn ? new Date().getFullYear() - o.yearBorn : null),
      })),
  };
}

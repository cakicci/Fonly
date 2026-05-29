import { fetchQuoteSummary, type YahooNum, type YahooDate } from "./quoteSummary";

/**
 * Hisseye ait temel finansal göstergeleri Yahoo Finance'tan çeker.
 *
 * Yahoo TR hisseleri için **gelir tablosu** ve **key statistics**'i doldurur;
 * bilanço/nakit akışı detaylarını sağlamaz (TR şirketlerinde yapısal
 * eksiklik). Sayfa bu boşlukları açıkça gösterir.
 */

// ── Ham Yahoo modülleri ──────────────────────────────────────────────────────

interface RawIncomeYear {
  endDate?:                 YahooDate;
  totalRevenue?:            YahooNum;
  costOfRevenue?:           YahooNum;
  grossProfit?:             YahooNum;
  operatingIncome?:         YahooNum;
  netIncome?:               YahooNum;
  ebit?:                    YahooNum;
  totalOperatingExpenses?:  YahooNum;
  incomeBeforeTax?:         YahooNum;
  incomeTaxExpense?:        YahooNum;
  interestExpense?:         YahooNum;
}

interface RawQuoteSummary {
  incomeStatementHistory?: {
    incomeStatementHistory?: RawIncomeYear[];
  };
  defaultKeyStatistics?: {
    enterpriseValue?:                 YahooNum;
    forwardPE?:                       YahooNum;
    trailingEps?:                     YahooNum;
    forwardEps?:                      YahooNum;
    bookValue?:                       YahooNum;
    priceToBook?:                     YahooNum;
    profitMargins?:                   YahooNum;
    sharesOutstanding?:               YahooNum;
    floatShares?:                     YahooNum;
    enterpriseToRevenue?:             YahooNum;
    enterpriseToEbitda?:              YahooNum;
    pegRatio?:                        YahooNum;
    priceToSalesTrailing12Months?:    YahooNum;
    beta?:                            YahooNum;
    "52WeekChange"?:                  YahooNum;
    lastFiscalYearEnd?:               YahooDate;
    mostRecentQuarter?:               YahooDate;
    earningsQuarterlyGrowth?:         YahooNum;
    revenueQuarterlyGrowth?:          YahooNum;
  };
  financialData?: {
    currentPrice?:        YahooNum;
    totalCash?:           YahooNum;
    totalDebt?:           YahooNum;
    debtToEquity?:        YahooNum;
    totalRevenue?:        YahooNum;
    grossMargins?:        YahooNum;
    operatingMargins?:    YahooNum;
    ebitda?:              YahooNum;
    ebitdaMargins?:       YahooNum;
    profitMargins?:       YahooNum;
    earningsGrowth?:      YahooNum;
    revenueGrowth?:       YahooNum;
    returnOnAssets?:      YahooNum;
    returnOnEquity?:      YahooNum;
    freeCashflow?:        YahooNum;
    operatingCashflow?:   YahooNum;
    currentRatio?:        YahooNum;
    quickRatio?:          YahooNum;
  };
  summaryDetail?: {
    marketCap?:                     YahooNum;
    trailingPE?:                    YahooNum;
    forwardPE?:                     YahooNum;
    fiftyTwoWeekLow?:               YahooNum;
    fiftyTwoWeekHigh?:              YahooNum;
    dividendRate?:                  YahooNum;
    dividendYield?:                 YahooNum;
    exDividendDate?:                YahooDate;
    fiveYearAvgDividendYield?:      YahooNum;
    payoutRatio?:                   YahooNum;
  };
}

// ── Parser'lar ───────────────────────────────────────────────────────────────

/** Yahoo `{ raw, fmt }` field'ından raw sayıyı çek. */
function num(f: YahooNum | undefined): number | null {
  return f?.raw != null && Number.isFinite(f.raw) ? f.raw : null;
}

/** Yahoo `{ raw, fmt }` field'ından "fmt" string'ini çek. */
function date(f: YahooDate | undefined): string | null {
  return f?.fmt ?? null;
}

// ── Halka açık tip ───────────────────────────────────────────────────────────

export interface IncomeYear {
  /** "2024-12-31" — yoksa "Bilinmeyen". */
  endDate:               string;
  totalRevenue:          number | null;
  costOfRevenue:         number | null;
  grossProfit:           number | null;
  operatingIncome:       number | null;
  netIncome:             number | null;
  ebit:                  number | null;
  incomeBeforeTax:       number | null;
  incomeTaxExpense:      number | null;
  interestExpense:       number | null;
}

export interface KeyStatistics {
  marketCap:             number | null;
  enterpriseValue:       number | null;
  trailingPE:            number | null;
  forwardPE:             number | null;
  pegRatio:              number | null;
  priceToBook:           number | null;
  priceToSales:          number | null;
  beta:                  number | null;
  trailingEps:           number | null;
  forwardEps:            number | null;
  bookValue:             number | null;
  sharesOutstanding:     number | null;
  floatShares:           number | null;
  enterpriseToRevenue:   number | null;
  enterpriseToEbitda:    number | null;
  fiftyTwoWeekLow:       number | null;
  fiftyTwoWeekHigh:      number | null;
  fiftyTwoWeekChange:    number | null;
  // marjlar ve büyüme
  grossMargins:          number | null;
  operatingMargins:      number | null;
  profitMargins:         number | null;
  ebitda:                number | null;
  ebitdaMargins:         number | null;
  returnOnAssets:        number | null;
  returnOnEquity:        number | null;
  revenueGrowth:         number | null;
  earningsGrowth:        number | null;
  earningsQuarterlyGrowth: number | null;
  revenueQuarterlyGrowth:  number | null;
  // borç/likidite
  totalCash:             number | null;
  totalDebt:             number | null;
  debtToEquity:          number | null;
  currentRatio:          number | null;
  quickRatio:            number | null;
  // nakit akışı (TTM)
  freeCashflow:          number | null;
  operatingCashflow:     number | null;
  // temettü
  dividendRate:          number | null;
  dividendYield:         number | null;
  payoutRatio:           number | null;
  exDividendDate:        string | null;
  fiveYearAvgDividendYield: number | null;
  // tarihler
  lastFiscalYearEnd:     string | null;
  mostRecentQuarter:     string | null;
}

export interface FundamentalsResponse {
  symbol:        string;
  /** En yeniden eskiye sıralı yıllık gelir tablosu (4 yıl tipik). */
  income:        IncomeYear[];
  /** Bilanço / nakit akışı için Yahoo TR hisselerinde veri sağlamadığına dair flag. */
  hasBalanceSheet: false;
  hasCashflow:     false;
  /** P/E, ROE, marjlar ve diğer anahtar oranlar. */
  stats:         KeyStatistics;
}

// ── Ana fetcher ──────────────────────────────────────────────────────────────

const MODULES = [
  "incomeStatementHistory",
  "defaultKeyStatistics",
  "financialData",
  "summaryDetail",
];

/**
 * BIST hissesi için temel finansal verileri tek istekte çeker.
 * `.IS` suffix otomatik eklenir.
 *
 * Yahoo bulamazsa `null` döner — sayfa "veri yok" durumunu gösterir.
 */
export async function fetchFundamentals(
  symbol: string,
): Promise<FundamentalsResponse | null> {
  const ticker = `${symbol.toUpperCase()}.IS`;
  const raw = await fetchQuoteSummary<RawQuoteSummary>(ticker, MODULES);
  if (!raw) return null;

  const incomeYears = raw.incomeStatementHistory?.incomeStatementHistory ?? [];
  const income: IncomeYear[] = incomeYears.map(y => ({
    endDate:           date(y.endDate) ?? "Bilinmeyen",
    totalRevenue:      num(y.totalRevenue),
    costOfRevenue:     num(y.costOfRevenue),
    grossProfit:       num(y.grossProfit),
    operatingIncome:   num(y.operatingIncome),
    netIncome:         num(y.netIncome),
    ebit:              num(y.ebit),
    incomeBeforeTax:   num(y.incomeBeforeTax),
    incomeTaxExpense:  num(y.incomeTaxExpense),
    interestExpense:   num(y.interestExpense),
  }));

  const ks = raw.defaultKeyStatistics ?? {};
  const fd = raw.financialData       ?? {};
  const sd = raw.summaryDetail       ?? {};

  const stats: KeyStatistics = {
    marketCap:             num(sd.marketCap),
    enterpriseValue:       num(ks.enterpriseValue),
    trailingPE:            num(sd.trailingPE),
    forwardPE:             num(sd.forwardPE ?? ks.forwardPE),
    pegRatio:              num(ks.pegRatio),
    priceToBook:           num(ks.priceToBook),
    priceToSales:          num(ks.priceToSalesTrailing12Months),
    beta:                  num(ks.beta),
    trailingEps:           num(ks.trailingEps),
    forwardEps:            num(ks.forwardEps),
    bookValue:             num(ks.bookValue),
    sharesOutstanding:     num(ks.sharesOutstanding),
    floatShares:           num(ks.floatShares),
    enterpriseToRevenue:   num(ks.enterpriseToRevenue),
    enterpriseToEbitda:    num(ks.enterpriseToEbitda),
    fiftyTwoWeekLow:       num(sd.fiftyTwoWeekLow),
    fiftyTwoWeekHigh:      num(sd.fiftyTwoWeekHigh),
    fiftyTwoWeekChange:    num(ks["52WeekChange"]),
    grossMargins:          num(fd.grossMargins),
    operatingMargins:      num(fd.operatingMargins),
    profitMargins:         num(fd.profitMargins ?? ks.profitMargins),
    ebitda:                num(fd.ebitda),
    ebitdaMargins:         num(fd.ebitdaMargins),
    returnOnAssets:        num(fd.returnOnAssets),
    returnOnEquity:        num(fd.returnOnEquity),
    revenueGrowth:         num(fd.revenueGrowth),
    earningsGrowth:        num(fd.earningsGrowth),
    earningsQuarterlyGrowth: num(ks.earningsQuarterlyGrowth),
    revenueQuarterlyGrowth:  num(ks.revenueQuarterlyGrowth),
    totalCash:             num(fd.totalCash),
    totalDebt:             num(fd.totalDebt),
    debtToEquity:          num(fd.debtToEquity),
    currentRatio:          num(fd.currentRatio),
    quickRatio:            num(fd.quickRatio),
    freeCashflow:          num(fd.freeCashflow),
    operatingCashflow:     num(fd.operatingCashflow),
    dividendRate:          num(sd.dividendRate),
    dividendYield:         num(sd.dividendYield),
    payoutRatio:           num(sd.payoutRatio),
    exDividendDate:        date(sd.exDividendDate),
    fiveYearAvgDividendYield: num(sd.fiveYearAvgDividendYield),
    lastFiscalYearEnd:     date(ks.lastFiscalYearEnd),
    mostRecentQuarter:     date(ks.mostRecentQuarter),
  };

  return {
    symbol:        symbol.toUpperCase(),
    income,
    hasBalanceSheet: false,
    hasCashflow:     false,
    stats,
  };
}

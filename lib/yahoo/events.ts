/**
 * Yahoo Finance chart v8 endpoint'inden temettü ve bölünme olayları.
 *
 * Aynı istekle iki seriyi birden alır (`?events=div,splits`). Crumb gerekmiyor —
 * chart endpoint'i public. 10 yıllık range standart; daha uzun veri için
 * `range=max` kullanılabilir ama BIST hisselerinde 10y yeterli (eski tarihler
 * yarım enflasyon, denominasyon, vb. ile karışır).
 */

const UA = "Mozilla/5.0";

interface RawDividend {
  amount: number;
  date:   number;  // epoch saniye
}

interface RawSplit {
  date:        number;
  numerator:   number;
  denominator: number;
  splitRatio:  string;
}

interface YahooChartJson {
  chart?: {
    result?: Array<{
      events?: {
        dividends?: Record<string, RawDividend>;
        splits?:    Record<string, RawSplit>;
      };
    }>;
  };
}

export interface DividendPayment {
  /** ISO tarih "YYYY-MM-DD". */
  date:   string;
  /** Epoch saniye. */
  epoch:  number;
  amount: number;
}

export interface StockSplit {
  date:        string;
  epoch:       number;
  numerator:   number;
  denominator: number;
  /** İnsan-okur ratio: "2:1", "3:2", vb. */
  ratio:       string;
}

export interface EventsResponse {
  symbol:    string;
  dividends: DividendPayment[];  // tarih artan
  splits:    StockSplit[];        // tarih artan
}

function fmtDate(epoch: number): string {
  return new Date(epoch * 1000).toISOString().slice(0, 10);
}

export async function fetchStockEvents(symbol: string): Promise<EventsResponse | null> {
  const ticker = `${symbol.toUpperCase()}.IS`;
  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}` +
    `?interval=1d&range=max&events=div,splits`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as YahooChartJson;
    const events = json?.chart?.result?.[0]?.events;
    if (!events) {
      return { symbol: symbol.toUpperCase(), dividends: [], splits: [] };
    }

    const dividends: DividendPayment[] = Object.values(events.dividends ?? {})
      .map(d => ({
        date:   fmtDate(d.date),
        epoch:  d.date,
        amount: d.amount,
      }))
      .sort((a, b) => a.epoch - b.epoch);

    const splits: StockSplit[] = Object.values(events.splits ?? {})
      .map(s => ({
        date:        fmtDate(s.date),
        epoch:       s.date,
        numerator:   s.numerator,
        denominator: s.denominator,
        ratio:       s.splitRatio,
      }))
      .sort((a, b) => a.epoch - b.epoch);

    return { symbol: symbol.toUpperCase(), dividends, splits };
  } catch {
    return null;
  }
}

// ── Özet / istatistik yardımcıları ───────────────────────────────────────────

export interface DividendYearAgg {
  year:   number;
  total:  number;
  count:  number;
}

/** Yıllık temettü toplamlarını üret (ödeme tarihine göre). */
export function aggregateByYear(payments: DividendPayment[]): DividendYearAgg[] {
  const map = new Map<number, DividendYearAgg>();
  for (const p of payments) {
    const year = Number(p.date.slice(0, 4));
    const cur  = map.get(year);
    if (cur) {
      cur.total += p.amount;
      cur.count += 1;
    } else {
      map.set(year, { year, total: p.amount, count: 1 });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.year - b.year);
}

/**
 * 5 yıllık CAGR — en eski tam yıl ile en son tam yıl arasında.
 * Son yıl içinde bulunulan yılsa atlanır (kısmi yıl yanıltıcı sonuç verir).
 */
export function dividendCagr(yearly: DividendYearAgg[]): number | null {
  if (yearly.length < 2) return null;
  const thisYear = new Date().getFullYear();
  const closed = yearly.filter(y => y.year < thisYear);
  if (closed.length < 2) return null;

  const last  = closed[closed.length - 1];
  const window = Math.min(5, closed.length);
  const start = closed[closed.length - window];
  const years = last.year - start.year;
  if (years <= 0 || start.total <= 0) return null;
  return Math.pow(last.total / start.total, 1 / years) - 1;
}

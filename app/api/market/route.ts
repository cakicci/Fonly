import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { CURRENCIES } from "@/data/currencies";
import { GOLD_TYPES, type GoldCategory } from "@/data/gold-types";
import {
  fetchTruncgilToday,
  fetchYahooChart,
  getTruncgilAsset,
} from "@/lib/market-data";
import { fmtAsset, fmtPercent, kindFromGoldCategory } from "@/lib/format";
import { checkAlertsForUser } from "@/lib/chart/alerts";

// ── Tipler ──────────────────────────────────────────────────────────────────

export interface CurrencyItem {
  code: string
  name: string
  shortName: string
  flag: string
  value: string       // formatted TRY string (for displayPer units)
  rawValue: number    // 1 unit in TRY (avg buy/sell if truncgil)
  displayPer: number  // 1 or 100 (JPY)
  changePercent: string
  isPositive: boolean
  buying?:  number
  selling?: number
}

export interface GoldData {
  gram: string
  gramRaw: number
  oz: string
  ceyrek: string
  yarim: string
  tam: string
  /** Gram altın günlük değişim yüzdesi (truncgil GRA varsa). */
  gramChangePercent?: string
  gramIsPositive?:    boolean
  gramBuying?:        number
  gramSelling?:       number
}

export interface GoldTypeItem {
  type: string                 // URL slug ("gram", "ceyrek", "cumhuriyet", "14ayar")
  name: string                 // "Cumhuriyet Altını"
  nameShort: string            // "Cumhuriyet"
  category: GoldCategory       // "standart" | "antika" | "ayar" | "gumus"
  value: string                // Formatlanmış TL fiyat ("19.534")
  rawValue: number             // TL ortalama fiyat
  changePercent: string        // "+1,23%" veya "—"
  isPositive: boolean
  buying?: number              // Truncgil verisi varsa
  selling?: number
  /** Bu tür için grafik gösterilebilir mi (Yahoo Finance ticker var mı). */
  hasHistory: boolean
}

export interface BorsaItem {
  symbol: string
  name: string
  value: string
  changePercent: string
  isPositive: boolean
}

export interface MarketResponse {
  doviz: CurrencyItem[]
  altin: GoldData
  /** Tüm altın türleri (standart + antika + ayar + gümüş) — /altin sayfası için. */
  tumAltin: GoldTypeItem[]
  borsa: BorsaItem[]
  updatedAt: string
}

// ── Hisse sembolleri ─────────────────────────────────────────────────────────

const STOCK_TICKERS = [
  { ticker: "XU100.IS", symbol: "XU100", name: "BIST 100" },
  { ticker: "THYAO.IS", symbol: "THYAO", name: "Türk Hava Yolları" },
  { ticker: "BIMAS.IS", symbol: "BIMAS", name: "BİM" },
  { ticker: "ASELS.IS", symbol: "ASELS", name: "Aselsan" },
  { ticker: "SASA.IS",  symbol: "SASA",  name: "Sasa Polyester" },
  { ticker: "KCHOL.IS", symbol: "KCHOL", name: "Koç Holding" },
];

// ── Handler ──────────────────────────────────────────────────────────────────

const TROY_OZ_GRAMS = 31.1035;

export async function GET() {
  // Major (USD/EUR/…/AUD): direct `<CODE>TRY=X`.
  // Exotic (RUB/SAR/…): `<CODE>=X` = USD/<CODE>. We combine with USDTRY=X to
  // synthesize <CODE>/TRY — same trick we use for gold (`GC=F × USDTRY`).
  // Truncgil yine de gerekli: alış/satış spread'i Yahoo bid/ask vermediği için.
  const yahooFxPromises = CURRENCIES.map(c => {
    const ticker = c.category === "major" ? `${c.code}TRY=X` : `${c.code}=X`;
    return fetchYahooChart(ticker).then(r => [c.code, r] as const);
  });

  const [
    truncgil,
    yahooGold,
    yahooUsdTry,
    yahooFxResults,
    stocks0, stocks1, stocks2, stocks3, stocks4, stocks5,
  ] = await Promise.all([
    fetchTruncgilToday(),
    fetchYahooChart("GC=F"),
    fetchYahooChart("USDTRY=X"),
    Promise.all(yahooFxPromises),
    fetchYahooChart(STOCK_TICKERS[0].ticker),
    fetchYahooChart(STOCK_TICKERS[1].ticker),
    fetchYahooChart(STOCK_TICKERS[2].ticker),
    fetchYahooChart(STOCK_TICKERS[3].ticker),
    fetchYahooChart(STOCK_TICKERS[4].ticker),
    fetchYahooChart(STOCK_TICKERS[5].ticker),
  ]);
  const stockResults = [stocks0, stocks1, stocks2, stocks3, stocks4, stocks5];
  const yahooFx = new Map(yahooFxResults);

  // ── Döviz ──────────────────────────────────────────────────────────────────
  // Major: yh.price = TRY direkt.
  // Exotic: yh.price = USD/<CODE> → TRY = USDTRY / yh.price.
  //         changePct chain: (now/prev - 1) where now/prev are synthesized.
  // Yahoo yoksa truncgil ortalamasına düş (her zaman fallback).
  const doviz: CurrencyItem[] = CURRENCIES.map(currency => {
    const t  = getTruncgilAsset(truncgil, currency.code);
    const yh = yahooFx.get(currency.code) ?? null;

    let rawValue = 0;
    let pct      = 0;
    if (currency.category === "major" && yh) {
      rawValue = yh.price;
      pct      = yh.changePercent;
    } else if (currency.category === "other" && yh && yahooUsdTry && yh.price > 0) {
      rawValue = yahooUsdTry.price / yh.price;
      const prev = yh.prev > 0 ? yahooUsdTry.prev / yh.prev : 0;
      pct = prev > 0 ? ((rawValue - prev) / prev) * 100 : 0;
    } else if (t) {
      rawValue = (t.Buying + t.Selling) / 2;
      pct      = t.Change;
    }

    const displayValue = rawValue * currency.displayPer;

    return {
      code:          currency.code,
      name:          currency.name,
      shortName:     currency.shortName,
      flag:          currency.flag,
      value:         rawValue > 0 ? fmtAsset(displayValue, "currency") : "—",
      rawValue,
      displayPer:    currency.displayPer,
      changePercent: rawValue > 0
        ? `${pct >= 0 ? "+" : "-"}${fmtPercent(Math.abs(pct))}%`
        : "—",
      isPositive:    pct >= 0,
      buying:        t?.Buying,
      selling:       t?.Selling,
    };
  });

  // ── Altın ──────────────────────────────────────────────────────────────────
  // Standart 4 (gram/çeyrek/yarım/tam): Yahoo GC=F × USDTRY × weightG / 31.1035
  // — detay sayfası grafiği ile tam aynı formül. Antika/ayar/gümüş Yahoo'da yok
  // → truncgil'den gelir. Spread (alış/satış) yine truncgil'den.
  const goldBaseRaw =
    yahooGold && yahooUsdTry
      ? (yahooGold.price * yahooUsdTry.price) / TROY_OZ_GRAMS
      : 0;
  const goldBasePrev =
    yahooGold && yahooUsdTry
      ? (yahooGold.prev * yahooUsdTry.prev) / TROY_OZ_GRAMS
      : 0;
  const goldBaseChangePct =
    goldBasePrev > 0 ? ((goldBaseRaw - goldBasePrev) / goldBasePrev) * 100 : 0;

  const truncgilGra    = getTruncgilAsset(truncgil, "GRA");
  const truncgilOns    = getTruncgilAsset(truncgil, "ONS");
  const truncgilCeyrek = getTruncgilAsset(truncgil, "CEYREKALTIN");
  const truncgilYarim  = getTruncgilAsset(truncgil, "YARIMALTIN");
  const truncgilTam    = getTruncgilAsset(truncgil, "TAMALTIN");

  // Yahoo varsa Yahoo türevi; yoksa truncgil ortalamasına düş.
  const gramRaw =
    goldBaseRaw > 0
      ? goldBaseRaw
      : truncgilGra ? (truncgilGra.Buying + truncgilGra.Selling) / 2 : 0;
  const ceyrekRaw =
    goldBaseRaw > 0
      ? goldBaseRaw * 1.748
      : truncgilCeyrek ? (truncgilCeyrek.Buying + truncgilCeyrek.Selling) / 2 : 0;
  const yarimRaw =
    goldBaseRaw > 0
      ? goldBaseRaw * 3.496
      : truncgilYarim ? (truncgilYarim.Buying + truncgilYarim.Selling) / 2 : 0;
  const tamRaw =
    goldBaseRaw > 0
      ? goldBaseRaw * 6.992
      : truncgilTam ? (truncgilTam.Buying + truncgilTam.Selling) / 2 : 0;
  const ozRaw = yahooGold?.price ?? truncgilOns?.Selling ?? 0;

  const gramPct = goldBaseRaw > 0
    ? goldBaseChangePct
    : (truncgilGra?.Change ?? 0);

  const altin: GoldData = {
    gram:    gramRaw   ? `${fmtAsset(gramRaw,   "gold-standard")} TL` : "—",
    gramRaw,
    oz:      ozRaw     ? `${fmtAsset(ozRaw,     "gold-standard")} $`  : "—",
    ceyrek:  ceyrekRaw ? `${fmtAsset(ceyrekRaw, "gold-standard")} TL` : "—",
    yarim:   yarimRaw  ? `${fmtAsset(yarimRaw,  "gold-standard")} TL` : "—",
    tam:     tamRaw    ? `${fmtAsset(tamRaw,    "gold-standard")} TL` : "—",
    gramChangePercent: gramRaw
      ? `${gramPct >= 0 ? "+" : "-"}${fmtPercent(Math.abs(gramPct))}%`
      : undefined,
    gramIsPositive: gramRaw ? gramPct >= 0 : undefined,
    gramBuying:     truncgilGra?.Buying,
    gramSelling:    truncgilGra?.Selling,
  };

  // ── Tüm altın türleri (genişletilmiş — /altin sayfası için) ───────────────
  // Standart 4 Yahoo'dan, geri kalan (antika/ayar/gümüş) truncgil'den.
  const STANDART_MULTIPLIER: Record<string, number> = {
    gram: 1, ceyrek: 1.748, yarim: 3.496, tam: 6.992,
  };
  const tumAltin: GoldTypeItem[] = GOLD_TYPES.map(g => {
    const t = getTruncgilAsset(truncgil, g.truncgilKey);

    let buying:  number | undefined;
    let selling: number | undefined;
    let raw     = 0;
    let pct     = 0;

    const mult = STANDART_MULTIPLIER[g.type];
    if (mult && goldBaseRaw > 0) {
      raw = goldBaseRaw * mult;
      pct = goldBaseChangePct;
      buying  = t?.Buying || undefined;
      selling = t?.Selling;
    } else if (t) {
      buying  = t.Buying || undefined;
      selling = t.Selling;
      raw     = (t.Buying + t.Selling) / 2 || t.Selling;
      pct     = t.Change;
    }

    return {
      type:          g.type,
      name:          g.name,
      nameShort:     g.nameShort,
      category:      g.category,
      value:         raw > 0 ? fmtAsset(raw, kindFromGoldCategory(g.category)) : "—",
      rawValue:      raw,
      changePercent: raw > 0
        ? `${pct >= 0 ? "+" : "-"}${fmtPercent(Math.abs(pct))}%`
        : "—",
      isPositive:    pct >= 0,
      buying,
      selling,
      hasHistory:    !!g.weightG,
    };
  });

  // ── Borsa ──────────────────────────────────────────────────────────────────
  const borsa: BorsaItem[] = STOCK_TICKERS.map((s, i) => {
    const result = stockResults[i];
    return {
      symbol:        s.symbol,
      name:          s.name,
      value:         result
        ? (s.symbol === "XU100"
            ? fmtAsset(result.price, "stock-index")
            : `${fmtAsset(result.price, "stock")} ₺`)
        : "—",
      changePercent: result
        ? `${result.changePercent >= 0 ? "+" : ""}${fmtPercent(result.changePercent)}%`
        : "—",
      isPositive:    (result?.changePercent ?? 0) >= 0
    };
  });

  const body: MarketResponse = {
    doviz,
    altin,
    tumAltin,
    borsa,
    updatedAt: truncgil?.Update_Date
      ? new Date(truncgil.Update_Date.replace(" ", "T") + "+03:00").toISOString()
      : new Date().toISOString()
  };

  // ── Lazy alert check — auth'lu user için arka planda kontrol et ──────────
  // await etmiyoruz: response gecikmesin. Hatalı çalışırsa sessizce geçer.
  try {
    const session = await auth();
    if (session?.user?.id) {
      // intentionally not awaited
      void checkAlertsForUser(session.user.id, body);
    }
  } catch {
    /* sessiz */
  }

  return NextResponse.json(body, {
    headers: { "Cache-Control": "no-store" }
  });
}

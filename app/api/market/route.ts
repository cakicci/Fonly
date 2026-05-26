import { NextResponse } from "next/server";
import { CURRENCIES } from "@/data/currencies";
import { GOLD_TYPES, type GoldCategory } from "@/data/gold-types";
import {
  fetchTruncgilToday,
  fetchYahooChart,
  getTruncgilAsset,
  fmt,
} from "@/lib/market-data";

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

export async function GET() {
  // Truncgil tek çağrıda tüm döviz + altın verir; ona göre paralel başlat.
  const [truncgil, stocks0, stocks1, stocks2, stocks3, stocks4, stocks5] =
    await Promise.all([
      fetchTruncgilToday(),
      fetchYahooChart(STOCK_TICKERS[0].ticker),
      fetchYahooChart(STOCK_TICKERS[1].ticker),
      fetchYahooChart(STOCK_TICKERS[2].ticker),
      fetchYahooChart(STOCK_TICKERS[3].ticker),
      fetchYahooChart(STOCK_TICKERS[4].ticker),
      fetchYahooChart(STOCK_TICKERS[5].ticker),
    ]);
  const stockResults = [stocks0, stocks1, stocks2, stocks3, stocks4, stocks5];

  // ── Döviz ──────────────────────────────────────────────────────────────────
  const doviz: CurrencyItem[] = CURRENCIES.map(currency => {
    const t = getTruncgilAsset(truncgil, currency.code);

    const rawValue = t ? (t.Buying + t.Selling) / 2 : 0;
    const pct      = t ? t.Change : 0;
    const buying   = t?.Buying;
    const selling  = t?.Selling;

    const displayValue = rawValue * currency.displayPer;

    return {
      code:          currency.code,
      name:          currency.name,
      shortName:     currency.shortName,
      flag:          currency.flag,
      value:         rawValue > 0 ? fmt(displayValue, 2) : "—",
      rawValue,
      displayPer:    currency.displayPer,
      changePercent: rawValue > 0
        ? `${pct >= 0 ? "+" : "-"}${fmt(Math.abs(pct), 2)}%`
        : "—",
      isPositive:    pct >= 0,
      buying,
      selling,
    };
  });

  // ── Altın ──────────────────────────────────────────────────────────────────
  const truncgilGra    = getTruncgilAsset(truncgil, "GRA");
  const truncgilOns    = getTruncgilAsset(truncgil, "ONS");
  const truncgilCeyrek = getTruncgilAsset(truncgil, "CEYREKALTIN");
  const truncgilYarim  = getTruncgilAsset(truncgil, "YARIMALTIN");
  const truncgilTam    = getTruncgilAsset(truncgil, "TAMALTIN");

  const gramRaw   = truncgilGra    ? (truncgilGra.Buying    + truncgilGra.Selling)    / 2 : 0;
  const ozRaw     = truncgilOns?.Selling ?? 0;
  const ceyrekRaw = truncgilCeyrek ? (truncgilCeyrek.Buying + truncgilCeyrek.Selling) / 2 : 0;
  const yarimRaw  = truncgilYarim  ? (truncgilYarim.Buying  + truncgilYarim.Selling)  / 2 : 0;
  const tamRaw    = truncgilTam    ? (truncgilTam.Buying    + truncgilTam.Selling)    / 2 : 0;

  const altin: GoldData = {
    gram:    gramRaw   ? `${fmt(gramRaw,   0)} TL`           : "—",
    gramRaw,
    oz:      ozRaw     ? `${fmt(ozRaw,     0)} $`            : "—",
    ceyrek:  ceyrekRaw ? `${fmt(ceyrekRaw, 0)} TL`           : "—",
    yarim:   yarimRaw  ? `${fmt(yarimRaw,  0)} TL`           : "—",
    tam:     tamRaw    ? `${fmt(tamRaw,    0)} TL`           : "—",
    gramChangePercent: truncgilGra
      ? `${truncgilGra.Change >= 0 ? "+" : "-"}${fmt(Math.abs(truncgilGra.Change), 2)}%`
      : undefined,
    gramIsPositive: truncgilGra ? truncgilGra.Change >= 0 : undefined,
    gramBuying:     truncgilGra?.Buying,
    gramSelling:    truncgilGra?.Selling,
  };

  // ── Tüm altın türleri (genişletilmiş — /altin sayfası için) ───────────────
  const tumAltin: GoldTypeItem[] = GOLD_TYPES.map(g => {
    const t = getTruncgilAsset(truncgil, g.truncgilKey);

    let buying:  number | undefined;
    let selling: number | undefined;
    let raw     = 0;
    let pct     = 0;

    if (t) {
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
      value:         raw > 0 ? fmt(raw, raw >= 1000 ? 0 : 2) : "—",
      rawValue:      raw,
      changePercent: raw > 0
        ? `${pct >= 0 ? "+" : "-"}${fmt(Math.abs(pct), 2)}%`
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
        ? (s.symbol === "XU100" ? fmt(result.price, 0) : `${fmt(result.price, 2)} ₺`)
        : "—",
      changePercent: result
        ? `${result.changePercent >= 0 ? "+" : ""}${fmt(result.changePercent, 2)}%`
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

  return NextResponse.json(body, {
    headers: { "Cache-Control": "no-store" }
  });
}

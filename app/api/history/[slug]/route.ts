import { NextRequest, NextResponse } from "next/server";
import { CURRENCY_MAP } from "@/data/currencies";
import { GOLD_TYPE_MAP } from "@/data/gold-types";
import { BIST_TICKERS } from "@/data/bist-tickers";
import { fetchYahooHistory } from "@/lib/market-data";
import { fetchFundHistory } from "@/lib/tefas";
import { assetDisplayName } from "@/lib/portfolio/asset";
import {
  FOREX_TICKER,
  FOREX_CROSS_TICKER,
  RANGE_CFG,
  FON_PERIYOD,
  alignMaps,
  buildGramAltinMap,
  buildExoticForexMap,
  fetchDailySeries,
} from "@/lib/history/series";

/**
 * "comp" query param'dan karşılaştırma serisini çözer. Verilmezse null döner —
 * çağıran taraf tip bazlı varsayılana (gram altın / dolar) düşer.
 * "xu100" özel değeri BIST 100 endeksine karşılık gelir (normal bir varlık
 * slug'ı değil, bu yüzden fetchDailySeries kapsamı dışında).
 */
async function resolveComparator(
  compParam: string | null,
  range: string
): Promise<{ map: Map<string, number>; name: string; unit: string } | null> {
  if (!compParam) return null;
  if (compParam === "xu100") {
    const cfg = RANGE_CFG[range] ?? RANGE_CFG["1y"];
    const map = await fetchYahooHistory("XU100.IS", cfg.range, cfg.interval);
    return map ? { map, name: "BIST 100", unit: "puan" } : null;
  }
  const map = await fetchDailySeries(compParam, range);
  return map ? { map, name: assetDisplayName(compParam), unit: "TL" } : null;
}

// ── Tipler ──────────────────────────────────────────────────────────────────

export interface HistoryPoint { date: string; value: number }

export interface HistoryResponse {
  points: HistoryPoint[]       // Ana varlık TL değerleri
  compPoints: HistoryPoint[]   // Karşılaştırma (gram altın ya da dolar/TL)
  asset: { code: string; name: string; unit: string }
  comp:  { name: string; unit: string }
  summary: {
    changePercent:     number
    compChangePercent: number
    latest:            number
    compLatest:        number
  }
}

// Ticker eşlemeleri + Map yardımcıları lib/history/series.ts'e taşındı —
// portföy değer grafiği (app/api/portfolio/history) ile ortak.

// ── Handler ──────────────────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const slug  = params.slug;  // "doviz-USD", "altin-gram", "hisse-THYAO"
  const range = request.nextUrl.searchParams.get("range") ?? "1y";
  const cfg   = RANGE_CFG[range] ?? RANGE_CFG["1y"];
  // "xu100" | "fon-AAK" | "hisse-GARAN" | "altin-gram" | "doviz-EUR" | null (varsayılana düş)
  const compParam = request.nextUrl.searchParams.get("comp");

  const dashIdx = slug.indexOf("-");
  if (dashIdx === -1) return NextResponse.json({ error: "invalid slug" }, { status: 400 });
  const type = slug.substring(0, dashIdx);       // "doviz" | "altin" | "hisse"
  const code = slug.substring(dashIdx + 1);      // "USD" | "gram" | "THYAO"

  let mainTicker  = "";
  let assetName   = "";
  let assetUnit   = "TL";
  let goldWeight  = 1;
  let isGold      = false;
  let crossTicker = "";  // exotic forex için USD/<CODE>

  if (type === "doviz") {
    const meta = CURRENCY_MAP[code.toUpperCase()];
    if (!meta) return NextResponse.json({ error: "not found" }, { status: 404 });
    const upper = code.toUpperCase();
    mainTicker  = FOREX_TICKER[upper] ?? "";
    crossTicker = mainTicker ? "" : (FOREX_CROSS_TICKER[upper] ?? "");
    assetName   = meta.name;

  } else if (type === "altin") {
    const meta = GOLD_TYPE_MAP[code.toLowerCase()];
    if (!meta) return NextResponse.json({ error: "not found" }, { status: 404 });
    // Yalnızca standart 4 (gram/çeyrek/yarım/tam) için geçmiş üretebiliyoruz —
    // Yahoo GC=F + USDTRY üzerinden hesaplanıyor. Antika/ayar/gümüş için
    // truncgil geçmişi yok.
    if (!meta.weightG) {
      return NextResponse.json(
        { error: "Bu altın türü için geçmiş veri mevcut değil" },
        { status: 422 }
      );
    }
    mainTicker = "GC=F";  // Gold Comex futures (USD/oz)
    assetName  = meta.name;
    goldWeight = meta.weightG;
    isGold     = true;

  } else if (type === "hisse") {
    const symbol  = code.toUpperCase();
    const bistMeta = BIST_TICKERS.find(t => t.symbol === symbol);
    mainTicker = `${symbol}.IS`;
    assetName  = bistMeta?.name ?? symbol;
    assetUnit  = "₺";

  } else if (type === "fon") {
    // TEFAS pay fiyatları doğrudan TL — Yahoo bypass, ayrı koldan çekiyoruz.
    assetName  = code.toUpperCase();
    assetUnit  = "₺";

  } else {
    return NextResponse.json({ error: "invalid type" }, { status: 400 });
  }

  // ── Fon: TEFAS pay fiyatı serisi + gram altın overlay ────────────────────
  if (type === "fon") {
    const periyod = FON_PERIYOD[range] ?? 12;
    const [fundRows, gcMap, usdtryMap] = await Promise.all([
      fetchFundHistory(code, periyod),
      fetchYahooHistory("GC=F", cfg.range, cfg.interval),
      fetchYahooHistory("USDTRY=X", cfg.range, cfg.interval),
    ]);

    if (!fundRows.length || !gcMap || !usdtryMap) {
      return NextResponse.json({ error: "data unavailable" }, { status: 503 });
    }

    const fundMap = new Map<string, number>();
    let fundLabel = code.toUpperCase();
    for (const row of fundRows) {
      const date = row.tarih?.slice(0, 10);
      if (!date || row.fiyat == null) continue;
      fundMap.set(date, row.fiyat);
      if (row.fonUnvan) fundLabel = row.fonUnvan;
    }
    assetName = fundLabel;

    const custom = await resolveComparator(compParam, range);
    const compSeriesMap = custom?.map ?? buildGramAltinMap(gcMap, usdtryMap);
    const compName = custom?.name ?? "Gram Altın";
    const compUnit = custom?.unit ?? "TL";

    if (compParam && !custom) {
      return NextResponse.json({ error: "Karşılaştırma verisi bulunamadı" }, { status: 422 });
    }

    const aligned = alignMaps(fundMap, compSeriesMap);

    const points: HistoryPoint[]     = [];
    const compPoints: HistoryPoint[] = [];
    for (const { date, mainVal, compVal } of aligned) {
      points.push({ date, value: mainVal });
      compPoints.push({ date, value: compVal });
    }

    if (points.length < 2) {
      return NextResponse.json({ error: "insufficient data" }, { status: 422 });
    }

    const startVal  = points[0].value;
    const latest    = points.at(-1)!.value;
    const changePercent = ((latest - startVal) / startVal) * 100;
    const compStart  = compPoints[0]?.value ?? 1;
    const compLatest = compPoints.at(-1)?.value ?? 1;
    const compChangePercent = ((compLatest - compStart) / compStart) * 100;

    return NextResponse.json<HistoryResponse>({
      points,
      compPoints,
      asset:   { code: code.toUpperCase(), name: assetName, unit: assetUnit },
      comp:    { name: compName, unit: compUnit },
      summary: { changePercent, compChangePercent, latest, compLatest },
    });
  }

  if (!mainTicker && !crossTicker) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  // ── Veri çekme ────────────────────────────────────────────────────────────
  // Exotic doviz: mainMap, USDTRY ÷ USD<CODE> ile sentezlenir (buildExoticForexMap).
  const [mainMapRaw, gcMap, usdtryMap, crossMap] = await Promise.all([
    isGold || crossTicker ? null : fetchYahooHistory(mainTicker, cfg.range, cfg.interval),
    fetchYahooHistory("GC=F", cfg.range, cfg.interval),
    fetchYahooHistory("USDTRY=X", cfg.range, cfg.interval),
    crossTicker ? fetchYahooHistory(crossTicker, cfg.range, cfg.interval) : null,
  ]);

  if (!gcMap || !usdtryMap) {
    return NextResponse.json({ error: "data unavailable" }, { status: 503 });
  }

  const mainMap = crossTicker
    ? (crossMap ? buildExoticForexMap(crossMap, usdtryMap) : null)
    : mainMapRaw;

  // Gram altın TL değerleri (varsayılan karşılaştırma / altın'ın kendi ana serisi)
  const gramAltinMap = buildGramAltinMap(gcMap, usdtryMap);

  // ── Ana varlığın kendi TL serisi ─────────────────────────────────────────
  const mainSeriesMap = isGold
    ? new Map([...gramAltinMap].map(([date, v]) => [date, v * goldWeight]))
    : mainMap;
  if (!mainSeriesMap) {
    return NextResponse.json({ error: "data unavailable" }, { status: 503 });
  }

  // ── Karşılaştırma serisi — özel seçim varsa onu, yoksa tip bazlı varsayılan ─
  const custom = await resolveComparator(compParam, range);
  if (compParam && !custom) {
    return NextResponse.json({ error: "Karşılaştırma verisi bulunamadı" }, { status: 422 });
  }
  const compSeriesMap = custom?.map ?? (isGold ? usdtryMap : gramAltinMap);
  const compName = custom?.name ?? (isGold ? "Dolar" : "Gram Altın");
  const compUnit = custom?.unit ?? "TL";

  // ── Noktaları oluştur ─────────────────────────────────────────────────────
  const points:     HistoryPoint[] = [];
  const compPoints: HistoryPoint[] = [];
  const aligned = alignMaps(mainSeriesMap, compSeriesMap);
  for (const { date, mainVal, compVal } of aligned) {
    points.push({ date, value: mainVal });
    compPoints.push({ date, value: compVal });
  }

  if (points.length < 2) {
    return NextResponse.json({ error: "insufficient data" }, { status: 422 });
  }

  // ── Özet hesapla ─────────────────────────────────────────────────────────
  const startVal  = points[0].value;
  const latest    = points.at(-1)!.value;
  const changePercent = ((latest - startVal) / startVal) * 100;

  const compStart  = compPoints[0]?.value ?? 1;
  const compLatest = compPoints.at(-1)?.value ?? 1;
  const compChangePercent = ((compLatest - compStart) / compStart) * 100;

  const response: HistoryResponse = {
    points,
    compPoints,
    asset:   { code: code.toUpperCase(), name: assetName, unit: assetUnit },
    comp:    { name: compName, unit: compUnit },
    summary: { changePercent, compChangePercent, latest, compLatest }
  };

  return NextResponse.json(response);
}

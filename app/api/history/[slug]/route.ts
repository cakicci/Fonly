import { NextRequest, NextResponse } from "next/server";
import { CURRENCY_MAP } from "@/data/currencies";
import { GOLD_TYPE_MAP } from "@/data/gold-types";
import { BIST_TICKERS } from "@/data/bist-tickers";
import { fetchYahooHistory } from "@/lib/market-data";
import { fetchFundHistory, type TefasPeriyod } from "@/lib/tefas";

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

// ── Yahoo Finance ticker eşlemeleri ─────────────────────────────────────────

const FOREX_TICKER: Record<string, string> = {
  USD: "USDTRY=X", EUR: "EURTRY=X", GBP: "GBPTRY=X",
  CHF: "CHFTRY=X", JPY: "JPYTRY=X", CNY: "CNYTRY=X",
  CAD: "CADTRY=X", AUD: "AUDTRY=X",
};

// ── Period → Yahoo Finance parametre eşlemesi ────────────────────────────────

const RANGE_CFG: Record<string, { range: string; interval: string }> = {
  "1h": { range: "5d",  interval: "1d"  },
  "3a": { range: "3mo", interval: "1d"  },
  "1y": { range: "1y",  interval: "1d"  },
  "5y": { range: "5y",  interval: "1wk" },
};

// TEFAS periyod kodları — fon endpoint'i sabit enum bekliyor, gün sayısı kabul etmiyor.
const FON_PERIYOD: Record<string, TefasPeriyod> = {
  "1h": 13, // 1 hafta
  "3a": 3,  // 3 ay
  "1y": 12, // 1 yıl
  "5y": 60, // 5 yıl (azami)
};

// ── Yardımcı: iki Map'i tarihe göre hizala ──────────────────────────────────

function alignMaps(
  main: Map<string, number>,
  comp: Map<string, number>
): Array<{ date: string; mainVal: number; compVal: number }> {
  // Comp Map üzerinde önceki değeri taşıyan bir backward-fill uygula
  const compSorted = [...comp.entries()].sort(([a], [b]) => a.localeCompare(b));

  const result: Array<{ date: string; mainVal: number; compVal: number }> = [];
  const mainSorted = [...main.entries()].sort(([a], [b]) => a.localeCompare(b));

  let compIdx = 0;
  for (const [date, mainVal] of mainSorted) {
    // Comp'u ilerlet — date'i geçmemek kaydıyla
    while (compIdx + 1 < compSorted.length && compSorted[compIdx + 1][0] <= date) {
      compIdx++;
    }
    const compVal = compSorted[compIdx]?.[1];
    if (compVal == null) continue;
    result.push({ date, mainVal, compVal });
  }
  return result;
}

// ── Gram altın haritası oluştur (GC=F × USDTRY=X) ───────────────────────────

function buildGramAltinMap(
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

// ── Handler ──────────────────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const slug  = params.slug;  // "doviz-USD", "altin-gram", "hisse-THYAO"
  const range = request.nextUrl.searchParams.get("range") ?? "1y";
  const cfg   = RANGE_CFG[range] ?? RANGE_CFG["1y"];

  const dashIdx = slug.indexOf("-");
  if (dashIdx === -1) return NextResponse.json({ error: "invalid slug" }, { status: 400 });
  const type = slug.substring(0, dashIdx);       // "doviz" | "altin" | "hisse"
  const code = slug.substring(dashIdx + 1);      // "USD" | "gram" | "THYAO"

  let mainTicker = "";
  let assetName  = "";
  let assetUnit  = "TL";
  let goldWeight = 1;
  let isGold     = false;

  if (type === "doviz") {
    const meta = CURRENCY_MAP[code.toUpperCase()];
    if (!meta) return NextResponse.json({ error: "not found" }, { status: 404 });
    mainTicker = FOREX_TICKER[code.toUpperCase()] ?? "";
    assetName  = meta.name;

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

    const gramAltinMap = buildGramAltinMap(gcMap, usdtryMap);
    const aligned = alignMaps(fundMap, gramAltinMap);

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
      comp:    { name: "Gram Altın", unit: "TL" },
      summary: { changePercent, compChangePercent, latest, compLatest },
    });
  }

  if (!mainTicker) return NextResponse.json({ error: "not found" }, { status: 404 });

  // ── Veri çekme ────────────────────────────────────────────────────────────
  const [mainMap, gcMap, usdtryMap] = await Promise.all([
    isGold ? null : fetchYahooHistory(mainTicker, cfg.range, cfg.interval),
    fetchYahooHistory("GC=F", cfg.range, cfg.interval),
    fetchYahooHistory("USDTRY=X", cfg.range, cfg.interval),
  ]);

  if (!gcMap || !usdtryMap) {
    return NextResponse.json({ error: "data unavailable" }, { status: 503 });
  }

  // Gram altın TL değerleri
  const gramAltinMap = buildGramAltinMap(gcMap, usdtryMap);

  // ── Noktaları oluştur ─────────────────────────────────────────────────────
  const points:     HistoryPoint[] = [];
  const compPoints: HistoryPoint[] = [];
  let compName = "Gram Altın";
  let compUnit = "TL";

  if (isGold) {
    // Ana: gram altın × ağırlık (TL), Karşılaştırma: Dolar/TL kuru
    compName = "Dolar";
    compUnit = "TL";

    const aligned = alignMaps(gramAltinMap, usdtryMap);
    for (const { date, mainVal: gramTRY, compVal: usdtry } of aligned) {
      points.push({ date, value: gramTRY * goldWeight });
      compPoints.push({ date, value: usdtry });
    }

  } else {
    // Ana: varlık TL değeri, Karşılaştırma: gram altın TL
    if (!mainMap) return NextResponse.json({ error: "data unavailable" }, { status: 503 });

    const aligned = alignMaps(mainMap, gramAltinMap);
    for (const { date, mainVal, compVal: goldTRY } of aligned) {
      points.push({ date, value: mainVal });
      compPoints.push({ date, value: goldTRY });
    }
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

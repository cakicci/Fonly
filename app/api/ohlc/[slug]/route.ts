import { NextRequest, NextResponse } from "next/server"
import { fetchOhlcForSlug } from "@/lib/chart/ohlc"
import { ALL_TIMEFRAMES, parseAssetSlug } from "@/lib/chart/timeframe"
import { CURRENCY_MAP } from "@/data/currencies"
import { GOLD_TYPE_MAP } from "@/data/gold-types"
import { BIST_TICKERS } from "@/data/bist-tickers"
import { fetchFundDetail } from "@/lib/tefas"
import type { Candle, OhlcResponse, Timeframe } from "@/types/chart"

/**
 * GET /api/ohlc/{slug}?tf={timeframe}
 *
 * slug: "hisse-THYAO" | "doviz-USD" | "altin-gram" | "fon-AAK"
 * tf:   1G | 1H | 1A | 3A | 1Y | 5Y | MAX (default: 1Y)
 *
 * Yanıt: OhlcResponse — candles dizisi + name + isLineOnly flag.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const slug = params.slug
  const { type, code } = parseAssetSlug(slug)
  if (!type) {
    return NextResponse.json({ error: "Geçersiz slug" }, { status: 400 })
  }

  const tfParam = request.nextUrl.searchParams.get("tf") as Timeframe | null
  const timeframe: Timeframe =
    tfParam && ALL_TIMEFRAMES.includes(tfParam) ? tfParam : "1Y"

  // Asset insan-okur ismi
  let name = code
  if (type === "doviz") {
    name = CURRENCY_MAP[code.toUpperCase()]?.name ?? code.toUpperCase()
  } else if (type === "altin") {
    name = GOLD_TYPE_MAP[code.toLowerCase()]?.name ?? code
  } else if (type === "hisse") {
    name = BIST_TICKERS.find(t => t.symbol === code.toUpperCase())?.name
      ?? code.toUpperCase()
  } else if (type === "fon") {
    try {
      const detail = await fetchFundDetail(code)
      name = detail?.fonUnvan ?? code.toUpperCase()
    } catch {
      name = code.toUpperCase()
    }
  }

  const data = await fetchOhlcForSlug(slug, timeframe)
  if (!data) {
    return NextResponse.json(
      { error: "OHLC verisi bulunamadı veya bu asset için desteklenmiyor" },
      { status: 404 }
    )
  }

  const body: OhlcResponse = {
    slug,
    name,
    timeframe,
    candles:    data.candles satisfies Candle[],
    isLineOnly: data.isLineOnly,
    latest:     data.latest,
  }

  return NextResponse.json(body)
}

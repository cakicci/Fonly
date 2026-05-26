import type { MarketResponse } from "@/app/api/market/route"

/**
 * Truncgil/Yahoo cache invalidation anında bir bölüm "—" dönerken diğeri
 * çalışabiliyor. /altin sayfası tumAltin'e, /doviz doviz'e, sidebar her ikisine
 * bakıyor — her sayfa kendi ilgilendiği bölümü kontrol etsin diye section param.
 *
 * @param section "doviz" / "tumAltin" / "borsa" / "all"
 *                "all" => doviz VE tumAltin sağlam olmalı (sidebar/panel için).
 * @returns true => ilgili bölümde en az bir geçerli değer var
 */
export function isMarketResponseFresh(
  json: MarketResponse | null | undefined,
  section: "doviz" | "tumAltin" | "borsa" | "all" = "all"
): boolean {
  if (!json) return false
  const goodDoviz    = !!json.doviz?.some(item => item.value !== "—")
  const goodTumAltin = !!json.tumAltin?.some(item => item.value !== "—")
  const goodBorsa    = !!json.borsa?.some(item => item.value !== "—")

  if (section === "doviz")    return goodDoviz
  if (section === "tumAltin") return goodTumAltin
  if (section === "borsa")    return goodBorsa
  // "all" — sidebar/panel hem döviz hem altın gösteriyor, ikisi de iyi olmalı
  return goodDoviz && goodTumAltin
}

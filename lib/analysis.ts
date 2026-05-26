/**
 * Rule-based Turkish analysis text generator for financial assets.
 * No LLM needed — computed from historical change percentages.
 */

export interface AnalysisParams {
  type: "doviz" | "altin" | "hisse" | "fon"
  assetName: string
  changePercent: number       // main asset % change over period
  compChangePercent: number   // comparison asset % change (gram altın or USD)
  compName: string            // "Gram Altın" or "Dolar"
}

export function generateAnalysis(p: AnalysisParams): string[] {
  const { type, assetName, changePercent, compChangePercent, compName } = p

  const absMain  = Math.abs(changePercent).toFixed(1)
  const absComp  = Math.abs(compChangePercent).toFixed(1)
  const mainDir  = changePercent  >= 0 ? "değer kazandı" : "değer kaybetti"
  const compDir  = compChangePercent >= 0 ? "arttı"       : "düştü"

  const lines: string[] = []

  // 1 — Main change sentence
  lines.push(
    `${assetName}, seçili dönemde yaklaşık %${absMain} ${mainDir}.`
  )

  // 2 — Comparison change
  lines.push(
    `Aynı dönemde ${compName} %${absComp} ${compDir}.`
  )

  // 3 — Relative performance
  const diff = changePercent - compChangePercent
  if (Math.abs(diff) < 1) {
    lines.push(
      `Her iki araç da bu sürede birbirine yakın performans sergiledi.`
    )
  } else if (diff > 0) {
    lines.push(
      `${assetName.split(" ")[0]}, bu sürede ${compName.toLowerCase()}'a kıyasla daha yüksek getiri sağladı.`
    )
  } else {
    lines.push(
      `Bu sürede ${compName}, ${assetName.split(" ")[0].toLowerCase()}'a kıyasla daha iyi performans gösterdi.`
    )
  }

  // 4 — Type-specific educational note
  if (type === "doviz") {
    lines.push(
      "Döviz, Türk yatırımcılar için TL'nin değer kaybına karşı bir koruma aracı olabilir. " +
      "Ancak kur oynaklığı kısa vadede belirsizlik yaratabilir. " +
      "Uzun vadeli bir araç olarak değerlendirilmesi önerilir."
    )
  } else if (type === "altin") {
    lines.push(
      "Altın, tarihsel olarak TL değer kaybına ve enflasyona karşı güçlü bir koruma aracı olarak görülmektedir. " +
      "Kısa vadeli fiyat hareketleri yatırım kararını yönlendirmemeli; " +
      "uzun vadeli birikim aracı olarak düşünmek daha sağlıklı bir yaklaşımdır."
    )
  } else if (type === "fon") {
    lines.push(
      "Yatırım fonları, bir portföy yöneticisinin farklı varlıkları sizin adınıza yönettiği ortak yatırım araçlarıdır. " +
      "Risk dağılımı sağlasa da yönetim ücreti ve fonun yatırım stratejisi getiriyi doğrudan etkiler. " +
      "Bir fonu seçmeden önce risk seviyesini ve yatırım amacının kendi hedeflerinize uyup uymadığını değerlendirmek önerilir."
    )
  } else {
    lines.push(
      "Hisse senetleri kısa vadede önemli fiyat dalgalanmaları yaşayabilir. " +
      "Geçmiş getiri, geleceği garanti etmez. " +
      "Uzun vadeli yatırımcılar için hisseler büyüme potansiyeli taşır; " +
      "ancak risk toleransına ve yatırım süresine göre değerlendirme yapılmalıdır."
    )
  }

  return lines
}

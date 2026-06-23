/**
 * Portföy hesaplama çekirdeği — saf fonksiyonlar (DB/ağ yok, kolay test edilir).
 *
 * Lot'lar (alım kayıtları) slug'a göre gruplanır → pozisyon. Ağırlıklı ortalama
 * maliyet + canlı fiyatla kâr/zarar hesaplanır. Fiyat bilinmiyorsa (kaynak çöktü)
 * value/pnl `null` döner; UI "—" gösterir.
 */

export interface LotInput {
  slug: string;
  quantity: number;
  unitCost: number;
}

export interface Position {
  slug: string;
  /** Toplam adet/birim. */
  quantity: number;
  /** Ağırlıklı ortalama birim maliyet. */
  avgCost: number;
  /** Toplam maliyet = Σ(qty × unitCost). */
  costTotal: number;
  /** Canlı birim fiyat; bilinmiyorsa null. */
  price: number | null;
  /** Güncel değer = qty × price; fiyat yoksa null. */
  value: number | null;
  /** Kâr/zarar = value − costTotal; fiyat yoksa null. */
  pnl: number | null;
  /** Yüzde K/Z; costTotal 0 veya fiyat yoksa null. */
  pnlPct: number | null;
}

export interface PortfolioSummary {
  costTotal: number;
  /** Fiyatı bilinen pozisyonların değer toplamı. */
  value: number;
  pnl: number;
  pnlPct: number | null;
  /** Canlı fiyatı çekilemeyen pozisyon sayısı (özetten hariç tutuldu). */
  missingPrices: number;
}

export interface PortfolioDailyChange {
  /** Bugünkü değer değişimi (TL) — günlük değişimi bilinen pozisyonlar üzerinden. */
  changeValue: number;
  /** Dünkü değere göre yüzde; dünkü değer ≤ 0 ise null. */
  changePct: number | null;
  /** Günlük değişimi bilinmeyen (fiyat veya değişim eksik) pozisyon sayısı. */
  missing: number;
}

/**
 * Lot'ları slug bazında pozisyonlara indirger. `prices` map'i slug→birim fiyat
 * (null = bilinmiyor). Sonuç maliyet toplamına göre azalan sıralı.
 */
export function aggregatePositions(
  lots: LotInput[],
  prices: Map<string, number | null>
): Position[] {
  const bySlug = new Map<string, { quantity: number; costTotal: number }>();

  for (const lot of lots) {
    if (!Number.isFinite(lot.quantity) || !Number.isFinite(lot.unitCost)) continue;
    const acc = bySlug.get(lot.slug) ?? { quantity: 0, costTotal: 0 };
    acc.quantity += lot.quantity;
    acc.costTotal += lot.quantity * lot.unitCost;
    bySlug.set(lot.slug, acc);
  }

  const positions: Position[] = [];
  for (const [slug, acc] of bySlug) {
    const price = prices.get(slug) ?? null;
    const hasPrice = price != null && Number.isFinite(price);
    const value = hasPrice ? acc.quantity * price : null;
    const pnl = value != null ? value - acc.costTotal : null;
    const pnlPct =
      pnl != null && acc.costTotal > 0 ? (pnl / acc.costTotal) * 100 : null;

    positions.push({
      slug,
      quantity: acc.quantity,
      avgCost: acc.quantity !== 0 ? acc.costTotal / acc.quantity : 0,
      costTotal: acc.costTotal,
      price,
      value,
      pnl,
      pnlPct,
    });
  }

  return positions.sort((a, b) => b.costTotal - a.costTotal);
}

/**
 * Pozisyonlardan portföy özeti. Fiyatı bilinmeyen pozisyonlar değer/kâr
 * toplamına katılmaz ama maliyetleri sayılır (yine de `missingPrices` ile raporlanır).
 */
export function portfolioSummary(positions: Position[]): PortfolioSummary {
  let costTotal = 0;
  let value = 0;
  let pricedCost = 0;
  let missingPrices = 0;

  for (const p of positions) {
    costTotal += p.costTotal;
    if (p.value != null) {
      value += p.value;
      pricedCost += p.costTotal;
    } else {
      missingPrices += 1;
    }
  }

  const pnl = value - pricedCost;
  const pnlPct = pricedCost > 0 ? (pnl / pricedCost) * 100 : null;

  return { costTotal, value, pnl, pnlPct, missingPrices };
}

/**
 * Portföyün bugünkü (günlük) değer değişimi. Her pozisyonun güncel değeri ve
 * günlük değişim yüzdesinden dünkü değeri geri hesaplar (prevValue = value /
 * (1 + pct/100)). Fiyatı veya günlük değişimi bilinmeyen pozisyonlar hariç
 * tutulur ve `missing` ile raporlanır.
 */
export function portfolioDailyChange(
  positions: Position[],
  changePctBySlug: Map<string, number | null>
): PortfolioDailyChange {
  let changeValue = 0;
  let prevValue = 0;
  let missing = 0;

  for (const p of positions) {
    const pct = changePctBySlug.get(p.slug);
    if (p.value == null || pct == null || !Number.isFinite(pct)) {
      missing += 1;
      continue;
    }
    const denom = 1 + pct / 100;
    if (denom <= 0) {
      missing += 1;
      continue;
    }
    const prevPositionValue = p.value / denom;
    changeValue += p.value - prevPositionValue;
    prevValue += prevPositionValue;
  }

  const changePct = prevValue > 0 ? (changeValue / prevValue) * 100 : null;
  return { changeValue, changePct, missing };
}

/**
 * Portföy hesaplama çekirdeği — saf fonksiyonlar (DB/ağ yok, kolay test edilir).
 *
 * İşlemler (alım + satım) slug'a göre gruplanır → pozisyon. Ortalama maliyet
 * yöntemi: alımlar ağırlıklı ortalama maliyeti günceller; satışlar o anki
 * ortalama maliyetten düşülür ve (satış fiyatı − ort. maliyet) × adet kadar
 * GERÇEKLEŞEN K/Z üretir. Kalan pozisyon canlı fiyatla GERÇEKLEŞMEMİŞ K/Z verir.
 * Fiyat bilinmiyorsa (kaynak çöktü) value/pnl `null` döner; UI "—" gösterir.
 */

export type LotSide = "buy" | "sell";

export interface LotInput {
  slug: string;
  quantity: number;
  /** Birim fiyat (TL) — alışta maliyet, satışta satış fiyatı. */
  unitCost: number;
  /** İşlem yönü; verilmezse "buy" (geriye uyum). */
  side?: LotSide | string;
  /** İşlem tarihi — satışların doğru ortalama maliyetten düşmesi için sıralamada kullanılır. */
  at?: string | Date;
}

export interface Position {
  slug: string;
  /** Kalan (net) adet/birim. */
  quantity: number;
  /** Ağırlıklı ortalama birim maliyet (alımlardan). */
  avgCost: number;
  /** Kalan maliyet esası = avgCost × quantity. */
  costTotal: number;
  /** Bu pozisyonda satışlardan gerçekleşen K/Z (TL). */
  realizedPnl: number;
  /** Canlı birim fiyat; bilinmiyorsa null. */
  price: number | null;
  /** Güncel değer = qty × price; fiyat yoksa null. */
  value: number | null;
  /** Gerçekleşmemiş K/Z = value − costTotal; fiyat yoksa null. */
  pnl: number | null;
  /** Yüzde K/Z; costTotal 0 veya fiyat yoksa null. */
  pnlPct: number | null;
}

export interface PortfolioSummary {
  costTotal: number;
  /** Fiyatı bilinen pozisyonların değer toplamı. */
  value: number;
  /** Gerçekleşmemiş K/Z (açık pozisyonlar). */
  pnl: number;
  pnlPct: number | null;
  /** Satışlardan gerçekleşen toplam K/Z. */
  realizedPnl: number;
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

/** Pozisyon "açık" sayılır mı — float artıklarına tolerans. */
export const QTY_EPSILON = 1e-9;

function lotTime(lot: LotInput): number {
  if (!lot.at) return 0;
  const t = new Date(lot.at).getTime();
  return Number.isFinite(t) ? t : 0;
}

/**
 * İşlemleri slug bazında pozisyonlara indirger (ortalama maliyet yöntemi).
 * `prices` map'i slug→birim fiyat (null = bilinmiyor). Satışlar kronolojik
 * sırada işlenir; eldekinden fazlası (veri hatası) eldekine kırpılır.
 * Sonuç maliyet toplamına göre azalan sıralı; tamamen kapanmış pozisyonlar
 * (quantity≈0) listede kalır — UI gerçekleşen K/Z için gösterebilir.
 */
export function aggregatePositions(
  lots: LotInput[],
  prices: Map<string, number | null>
): Position[] {
  const bySlug = new Map<string, LotInput[]>();
  for (const lot of lots) {
    if (!Number.isFinite(lot.quantity) || !Number.isFinite(lot.unitCost)) continue;
    const list = bySlug.get(lot.slug) ?? [];
    list.push(lot);
    bySlug.set(lot.slug, list);
  }

  const positions: Position[] = [];
  for (const [slug, slugLots] of bySlug) {
    // Kronolojik işle — sort stabil olduğundan tarihi olmayanlar giriş sırasını korur.
    const ordered = [...slugLots].sort((a, b) => lotTime(a) - lotTime(b));

    let quantity = 0;
    let costTotal = 0;
    let realizedPnl = 0;

    for (const lot of ordered) {
      if ((lot.side ?? "buy") === "sell") {
        const sellQty = Math.min(lot.quantity, quantity);
        if (sellQty <= 0) continue;
        const avg = quantity > 0 ? costTotal / quantity : 0;
        realizedPnl += (lot.unitCost - avg) * sellQty;
        quantity -= sellQty;
        costTotal = avg * quantity;
      } else {
        quantity += lot.quantity;
        costTotal += lot.quantity * lot.unitCost;
      }
    }

    if (quantity < QTY_EPSILON) {
      quantity = 0;
      costTotal = 0;
    }

    const price = prices.get(slug) ?? null;
    const hasPrice = price != null && Number.isFinite(price);
    const value = hasPrice ? quantity * price : null;
    const pnl = value != null ? value - costTotal : null;
    const pnlPct =
      pnl != null && costTotal > 0 ? (pnl / costTotal) * 100 : null;

    positions.push({
      slug,
      quantity,
      avgCost: quantity > 0 ? costTotal / quantity : 0,
      costTotal,
      realizedPnl,
      price,
      value,
      pnl,
      pnlPct,
    });
  }

  return positions.sort((a, b) => b.costTotal - a.costTotal);
}

/**
 * Pozisyonlardan portföy özeti. Fiyatı bilinmeyen AÇIK pozisyonlar değer/kâr
 * toplamına katılmaz ama maliyetleri sayılır (`missingPrices` ile raporlanır).
 * Kapanmış pozisyonlar yalnızca `realizedPnl`e katkı verir.
 */
export function portfolioSummary(positions: Position[]): PortfolioSummary {
  let costTotal = 0;
  let value = 0;
  let pricedCost = 0;
  let realizedPnl = 0;
  let missingPrices = 0;

  for (const p of positions) {
    realizedPnl += p.realizedPnl;
    if (p.quantity < QTY_EPSILON) continue; // kapanmış — açık özet dışı
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

  return { costTotal, value, pnl, pnlPct, realizedPnl, missingPrices };
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
    if (p.quantity < QTY_EPSILON) continue; // kapanmış pozisyonun günlük değişimi yok
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

// ── Portföy değer serisi (grafik) ────────────────────────────────────────────

export interface ValuePoint {
  /** ISO "YYYY-MM-DD". */
  date: string;
  /** O gün portföyün toplam değeri (TL) — fiyatı bilinen varlıklar. */
  value: number;
  /** O gün itibarıyla kalan maliyet esası (TL) — karşılaştırma çizgisi. */
  cost: number;
}

export interface ValueSeriesResult {
  points: ValuePoint[];
  /** Fiyat serisi bulunamayan (grafikten hariç) slug'lar. */
  missingSlugs: string[];
}

interface SlugTimeline {
  /** Artan tarihli [dateMs, quantity, costTotal] kırılımları. */
  steps: Array<{ time: number; quantity: number; costTotal: number }>;
}

/** Lot listesinden slug başına zaman içinde (adet, maliyet) kırılımları üretir. */
function buildTimelines(lots: LotInput[]): Map<string, SlugTimeline> {
  const bySlug = new Map<string, LotInput[]>();
  for (const lot of lots) {
    if (!Number.isFinite(lot.quantity) || !Number.isFinite(lot.unitCost)) continue;
    const list = bySlug.get(lot.slug) ?? [];
    list.push(lot);
    bySlug.set(lot.slug, list);
  }

  const result = new Map<string, SlugTimeline>();
  for (const [slug, slugLots] of bySlug) {
    const ordered = [...slugLots].sort((a, b) => lotTime(a) - lotTime(b));
    let quantity = 0;
    let costTotal = 0;
    const steps: SlugTimeline["steps"] = [];
    for (const lot of ordered) {
      if ((lot.side ?? "buy") === "sell") {
        const sellQty = Math.min(lot.quantity, quantity);
        if (sellQty <= 0) continue;
        const avg = quantity > 0 ? costTotal / quantity : 0;
        quantity -= sellQty;
        costTotal = avg * quantity;
      } else {
        quantity += lot.quantity;
        costTotal += lot.quantity * lot.unitCost;
      }
      steps.push({ time: lotTime(lot), quantity, costTotal });
    }
    result.set(slug, { steps });
  }
  return result;
}

/**
 * Portföyün zaman içindeki değerini üretir.
 *
 * `seriesBySlug`: slug → günlük fiyat Map'i ("YYYY-MM-DD" → TL; null = seri yok).
 * Tarih ekseni tüm serilerin birleşimidir; fiyatlar backward-fill edilir
 * (o güne kadar bilinen son fiyat). Bir varlığın o tarihte pozisyonu yoksa
 * katkısı 0'dır. Serisi hiç olmayan slug'lar `missingSlugs` ile raporlanır
 * ve hem değerden hem maliyet çizgisinden hariç tutulur (grafik tutarlı kalsın).
 */
export function portfolioValueSeries(
  lots: LotInput[],
  seriesBySlug: Map<string, Map<string, number> | null>
): ValueSeriesResult {
  const timelines = buildTimelines(lots);

  const missingSlugs: string[] = [];
  const usable = new Map<string, { sorted: Array<[string, number]>; timeline: SlugTimeline }>();
  const dateSet = new Set<string>();

  for (const [slug, timeline] of timelines) {
    const series = seriesBySlug.get(slug);
    if (!series || series.size === 0) {
      missingSlugs.push(slug);
      continue;
    }
    const sorted = [...series.entries()].sort(([a], [b]) => a.localeCompare(b));
    for (const [d] of sorted) dateSet.add(d);
    usable.set(slug, { sorted, timeline });
  }

  const dates = [...dateSet].sort();
  const points: ValuePoint[] = [];

  // Slug başına yürüyen imleçler — O(N) tarama.
  const priceIdx = new Map<string, number>();
  const stepIdx = new Map<string, number>();

  for (const date of dates) {
    const dayEndMs = new Date(`${date}T23:59:59Z`).getTime();
    let value = 0;
    let cost = 0;

    for (const [slug, { sorted, timeline }] of usable) {
      // Fiyat: bu tarihe kadar bilinen son değer (backward-fill).
      let pi = priceIdx.get(slug) ?? -1;
      while (pi + 1 < sorted.length && sorted[pi + 1][0] <= date) pi++;
      priceIdx.set(slug, pi);
      if (pi < 0) continue; // henüz fiyat yok
      const price = sorted[pi][1];

      // Pozisyon: bu güne kadarki son kırılım.
      let si = stepIdx.get(slug) ?? -1;
      while (si + 1 < timeline.steps.length && timeline.steps[si + 1].time <= dayEndMs) si++;
      stepIdx.set(slug, si);
      if (si < 0) continue; // henüz işlem yok
      const step = timeline.steps[si];
      if (step.quantity < QTY_EPSILON) continue;

      value += step.quantity * price;
      cost += step.costTotal;
    }

    points.push({ date, value, cost });
  }

  // Baştaki tamamen boş (henüz hiç pozisyon yok) günleri kırp.
  const firstIdx = points.findIndex((p) => p.value > 0 || p.cost > 0);
  return {
    points: firstIdx > 0 ? points.slice(firstIdx) : points,
    missingSlugs,
  };
}

import type { KeyStatistics } from "@/lib/yahoo/fundamentals";

/**
 * Hisse için basitleştirilmiş 5 eksenli görsel skor (Simply Wall St
 * "Snowflake" fikrinden esinlenilmiş, kural tabanlı — AI/tavsiye değil).
 * Her eksen 0-100 puana, sonra 1-5 yıldıza haritalanır. Finansal
 * okuryazarlığı düşük kullanıcı için ham oran tablosunu tek bakışta
 * özetlemek amaçlı; yatırım tavsiyesi değildir.
 */

export interface ScoreAxis {
  key:   string;
  label: string;
  /** 0-100. */
  score: number;
  /** 1-5. */
  stars: number;
  tier:  "Zayıf" | "Orta" | "İyi";
}

function toAxis(key: string, label: string, score: number): ScoreAxis {
  const clamped = Math.max(0, Math.min(100, score));
  const stars = Math.max(1, Math.min(5, Math.round(clamped / 20)));
  const tier = clamped >= 65 ? "İyi" : clamped >= 40 ? "Orta" : "Zayıf";
  return { key, label, score: clamped, stars, tier };
}

function avg(values: number[]): number | null {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
}

function scoreValue(pe: number | null): number {
  if (pe == null || pe <= 0) return 50;
  if (pe < 8)  return 95;
  if (pe < 12) return 80;
  if (pe < 18) return 60;
  if (pe < 25) return 40;
  if (pe < 35) return 25;
  return 10;
}

function scoreProfitability(netMargin: number | null, roe: number | null): number {
  const parts: number[] = [];
  if (netMargin != null) {
    parts.push(netMargin > 0.20 ? 90 : netMargin > 0.10 ? 70 : netMargin > 0.03 ? 50 : netMargin > 0 ? 30 : 10);
  }
  if (roe != null) {
    parts.push(roe > 0.25 ? 90 : roe > 0.15 ? 70 : roe > 0.08 ? 50 : roe > 0 ? 30 : 10);
  }
  return avg(parts) ?? 50;
}

function scoreFinancialHealth(debtToEquity: number | null, currentRatio: number | null): number {
  const parts: number[] = [];
  if (debtToEquity != null) {
    parts.push(debtToEquity < 40 ? 85 : debtToEquity < 80 ? 65 : debtToEquity < 150 ? 45 : debtToEquity < 250 ? 25 : 10);
  }
  if (currentRatio != null) {
    parts.push(currentRatio > 2 ? 90 : currentRatio > 1.5 ? 75 : currentRatio > 1 ? 55 : currentRatio > 0.7 ? 35 : 15);
  }
  return avg(parts) ?? 50;
}

function scoreDividend(dividendYield: number | null): number {
  if (dividendYield == null || dividendYield <= 0) return 20;
  const pct = dividendYield * 100;
  if (pct > 6) return 90;
  if (pct > 3) return 70;
  if (pct > 1) return 50;
  return 30;
}

function scoreMomentum(change52w: number | null): number {
  if (change52w == null) return 50;
  const pct = change52w * 100;
  if (pct > 50)  return 90;
  if (pct > 15)  return 70;
  if (pct > -10) return 50;
  if (pct > -30) return 30;
  return 15;
}

export function computeHisseScore(stats: KeyStatistics): ScoreAxis[] {
  return [
    toAxis("value",        "Değerleme",       scoreValue(stats.trailingPE ?? stats.forwardPE)),
    toAxis("profitability","Kârlılık",        scoreProfitability(stats.profitMargins, stats.returnOnEquity)),
    toAxis("health",       "Finansal Sağlık", scoreFinancialHealth(stats.debtToEquity, stats.currentRatio)),
    toAxis("dividend",     "Temettü",         scoreDividend(stats.dividendYield)),
    toAxis("momentum",     "Momentum (1 Yıl)",scoreMomentum(stats.fiftyTwoWeekChange)),
  ];
}

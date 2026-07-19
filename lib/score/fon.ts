import type { ScoreAxis } from "./hisse";

/**
 * Fon için basitleştirilmiş skor eksenleri. TEFAS'tan zaten çekilen dönem
 * getirileri ve kategori sırası üzerinden — ek veri kaynağı gerektirmez.
 */

function toAxis(key: string, label: string, score: number): ScoreAxis {
  const clamped = Math.max(0, Math.min(100, score));
  const stars = Math.max(1, Math.min(5, Math.round(clamped / 20)));
  const tier = clamped >= 65 ? "İyi" : clamped >= 40 ? "Orta" : "Zayıf";
  return { key, label, score: clamped, stars, tier };
}

function scoreReturn(pct: number | null): number {
  if (pct == null) return 50;
  if (pct > 60) return 90;
  if (pct > 30) return 70;
  if (pct > 10) return 55;
  if (pct > 0)  return 40;
  return 15;
}

function scoreCategoryRank(rank: number | null, total: number | null): number {
  if (rank == null || total == null || total <= 0) return 50;
  const percentile = 1 - (rank - 1) / total; // 1 = en iyi
  if (percentile > 0.8) return 90;
  if (percentile > 0.6) return 70;
  if (percentile > 0.4) return 50;
  if (percentile > 0.2) return 30;
  return 15;
}

export function computeFonScore(input: {
  getiri3a: number | null;
  getiri1y: number | null;
  kategoriDerece: number | null;
  kategoriFonSay: number | null;
}): ScoreAxis[] {
  return [
    toAxis("shortTerm", "Kısa Vadeli Getiri (3 Ay)", scoreReturn(input.getiri3a)),
    toAxis("longTerm",  "Uzun Vadeli Getiri (1 Yıl)", scoreReturn(input.getiri1y)),
    toAxis("rank",      "Kategorisindeki Sırası",     scoreCategoryRank(input.kategoriDerece, input.kategoriFonSay)),
  ];
}

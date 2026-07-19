interface StreakLot {
  side:     string;
  boughtAt: Date;
}

/**
 * Kaç aydır kesintisiz en az bir alım yapılmış (yatırım alışkanlığı serisi).
 * Şema değişikliği gerektirmez — mevcut PortfolioLot.boughtAt üzerinden
 * hesaplanır. İçinde bulunulan ay henüz bitmediği için (kullanıcı bu ay
 * henüz alım yapmamış olabilir) seriyi bozmaz; bir önceki tamamlanmış aydan
 * geriye doğru sayar.
 */
export function computeContributionStreak(lots: StreakLot[], now = new Date()): number {
  const buyMonths = new Set<string>();
  for (const l of lots) {
    if (l.side !== "buy") continue;
    const d = new Date(l.boughtAt);
    buyMonths.add(`${d.getFullYear()}-${d.getMonth()}`);
  }

  const key = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;
  const startOffset = buyMonths.has(key(now)) ? 0 : 1;

  let streak = 0;
  for (let i = startOffset; ; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    if (buyMonths.has(key(d))) streak++;
    else break;
  }
  return streak;
}

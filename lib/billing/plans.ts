/**
 * Abonelik plan katalogu — TEK doğruluk kaynağı.
 *
 * Premium sayfası, checkout route'u ve (ileride) PSP fiyat eşlemesi buradan okur.
 * Fiyatı kuruş (integer) tutuyoruz — float para hatası olmasın; UI `priceLabel`
 * kullanır.
 */

export type PlanId = "monthly" | "yearly";

export interface Plan {
  id: PlanId;
  name: string;
  /** Kuruş cinsinden — 9900 = 99,00 ₺. PSP'ye bu gönderilir. */
  priceKurus: number;
  /** UI etiketi — "99 ₺". */
  priceLabel: string;
  /** "/ay" | "/yıl". */
  period: string;
  /** Kart altı küçük açıklama. */
  sub: string;
  /** Dönem uzunluğu (ay) — periodEnd hesabı için. */
  intervalMonths: number;
  /** "En popüler" vurgusu. */
  highlight: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "monthly",
    name: "Aylık",
    priceKurus: 9900,
    priceLabel: "99 ₺",
    period: "/ay",
    sub: "İstediğin zaman iptal et",
    intervalMonths: 1,
    highlight: false,
  },
  {
    id: "yearly",
    name: "Yıllık",
    priceKurus: 99000,
    priceLabel: "990 ₺",
    period: "/yıl",
    sub: "Aylık 82,5 ₺ — 2 ay hediye",
    intervalMonths: 12,
    highlight: true,
  },
];

export const PLAN_MAP: Record<PlanId, Plan> = Object.fromEntries(
  PLANS.map((p) => [p.id, p])
) as Record<PlanId, Plan>;

export function isPlanId(value: unknown): value is PlanId {
  return value === "monthly" || value === "yearly";
}

export function getPlan(id: string | null | undefined): Plan | null {
  return isPlanId(id) ? PLAN_MAP[id] : null;
}

/**
 * Başlangıç tarihinden planın dönem bitişini hesaplar.
 * Ay sonu taşmasını (31 Ocak + 1 ay) güvenli biçimde ele alır: hedef ayda gün
 * yoksa o ayın son gününe sabitlenir.
 */
export function periodEndFrom(start: Date, plan: Plan): Date {
  const d = new Date(start);
  const targetMonth = d.getMonth() + plan.intervalMonths;
  const end = new Date(d);
  end.setDate(1);
  end.setMonth(targetMonth);
  const lastDay = new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate();
  end.setDate(Math.min(d.getDate(), lastDay));
  return end;
}

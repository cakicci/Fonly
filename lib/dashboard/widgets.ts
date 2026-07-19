/**
 * Dashboard widget kaydı + kullanıcı yerleşimi (göster/gizle + sıra).
 *
 * Yerleşim `User.dashboardLayout` alanında JSON olarak saklanır:
 *   { order: WidgetKey[], hidden: WidgetKey[] }
 *
 * Saf modül (server + API + client ortak kullanır) — DB/ağ bağımlılığı yok.
 * parse/serialize bilinmeyen anahtarları eler ve yeni eklenen widget'ları
 * varsayılan sırayla sona ekler; böylece eski kayıtlar bozulmadan büyür.
 */

export const DASHBOARD_WIDGETS = [
  { key: "portfolio", label: "Portföy özeti" },
  { key: "netWorth", label: "Net değer (Premium)" },
  { key: "allocation", label: "Varlık dağılımı & performans" },
  { key: "goals", label: "Hedefler & gelişmeler" },
  { key: "riskBudget", label: "Risk profili & bütçe" },
  { key: "watchlistAlerts", label: "İzleme listesi & alarmlar" },
  { key: "income", label: "Gelir girişi" },
  { key: "recommendations", label: "Kişisel öneriler" },
] as const;

export type WidgetKey = (typeof DASHBOARD_WIDGETS)[number]["key"];

export const DEFAULT_ORDER: WidgetKey[] = DASHBOARD_WIDGETS.map((w) => w.key);

const KNOWN = new Set<string>(DEFAULT_ORDER);

export function widgetLabel(key: WidgetKey): string {
  return DASHBOARD_WIDGETS.find((w) => w.key === key)?.label ?? key;
}

export interface DashboardLayout {
  order: WidgetKey[];
  hidden: WidgetKey[];
}

/** Ham JSON'ı güvenle yerleşime çevirir; bozuk/eksik veride varsayılana düşer. */
export function parseDashboardLayout(raw: string | null | undefined): DashboardLayout {
  let order: WidgetKey[] = [];
  let hidden: WidgetKey[] = [];

  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { order?: unknown; hidden?: unknown };
      if (Array.isArray(parsed.order)) {
        order = parsed.order.filter((k): k is WidgetKey => typeof k === "string" && KNOWN.has(k));
      }
      if (Array.isArray(parsed.hidden)) {
        hidden = parsed.hidden.filter((k): k is WidgetKey => typeof k === "string" && KNOWN.has(k));
      }
    } catch {
      /* bozuk JSON → varsayılan */
    }
  }

  // Eksik (yeni eklenmiş) widget'ları varsayılan sırayla sona ekle.
  const seen = new Set(order);
  for (const k of DEFAULT_ORDER) if (!seen.has(k)) order.push(k);

  // hidden'ı order'a göre sırala/temizle.
  const hiddenSet = new Set(hidden);
  hidden = order.filter((k) => hiddenSet.has(k));

  return { order, hidden };
}

/** Yerleşimi normalize edip JSON string'e çevirir (DB'ye yazmak için). */
export function serializeDashboardLayout(order: WidgetKey[], hidden: WidgetKey[]): string {
  const ord = order.filter((k) => KNOWN.has(k));
  const seen = new Set(ord);
  for (const k of DEFAULT_ORDER) if (!seen.has(k)) ord.push(k);

  const ordSet = new Set(ord);
  const hid = hidden.filter((k) => KNOWN.has(k) && ordSet.has(k));

  return JSON.stringify({ order: ord, hidden: hid });
}

/**
 * Global site navigation tabs — investing.com tarzı üst bar.
 *
 * Üst satır (`MAIN_NAV_ITEMS`): Piyasalar mega-menü + flat linkler.
 * Alt satır (`SUB_NAV_ITEMS`): hızlı kategori atlamaları.
 *
 * Pattern: components/chart/SubNav.tsx ile aynı — `href` site-relative.
 */

export interface MarketsMegaItem {
  /** Kategori başlığı (örn. "Döviz"). */
  label: string;
  href: string;
  description: string;
}

export interface MainNavItem {
  label: string;
  /** Eğer `mega` set ise href yok, hover/click ile dropdown açılır. */
  href?: string;
  mega?: MarketsMegaItem[];
  /** Sağda turuncu/yeşil "Premium" rozeti gibi vurgu. */
  highlight?: boolean;
  /** Henüz mevcut değil — disabled görünüm + "Yakında" rozeti. */
  comingSoon?: boolean;
}

export const MARKETS_MEGA: MarketsMegaItem[] = [
  {
    label: "Döviz Kurları",
    href: "/doviz",
    description: "30 döviz, canlı alış/satış",
  },
  {
    label: "Altın & Gümüş",
    href: "/altin",
    description: "Gram, çeyrek, antika ve ayar",
  },
  {
    label: "BIST Hisseleri",
    href: "/hisseler",
    description: "~300 hisse, anlık fiyat",
  },
  {
    label: "TEFAS Fonları",
    href: "/fonlar",
    description: "~2100 yatırım fonu",
  },
];

export const MAIN_NAV_ITEMS: MainNavItem[] = [
  { label: "Piyasalar", mega: MARKETS_MEGA },
  { label: "İzleme Listem", href: "#watchlist" },
  { label: "Portföyüm", href: "/portfoy" },
  { label: "Rehber", href: "/rehber" },
  { label: "Risk Testi", href: "/risk-test" },
  { label: "Premium", href: "/premium", highlight: true },
];

export interface SubNavItem {
  label: string;
  href: string;
  comingSoon?: boolean;
}

export const SUB_NAV_ITEMS: SubNavItem[] = [
  { label: "Döviz Kurları", href: "/doviz" },
  { label: "Türk Hisseleri", href: "/hisseler" },
  { label: "Altın & Emtia", href: "/altin" },
  { label: "TEFAS Fonları", href: "/fonlar" },
  { label: "Rehber", href: "/rehber" },
  { label: "Risk Testi", href: "/risk-test" },
  { label: "Ekonomik Takvim", href: "#", comingSoon: true },
];

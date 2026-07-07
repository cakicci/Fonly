/**
 * Detay sayfaları için alt-sekme tanımları.
 * Her asset tipinin alt-route seti farklı (hisse en kapsamlı, fon TEFAS-spesifik).
 *
 * `href: ""` → kök "Genel" sayfası (örn. /hisse/ASELS).
 * Diğer href'ler base path'in altına eklenir.
 */
export interface SubNavTab {
  href:  string;
  label: string;
  /**
   * Premium gerektirir mi (UI'da küçük kilit/sparkle gösterimi için).
   * Faz 0 için: AI sekmesi yok, ileride eklenirse buradan işaretlenir.
   */
  premium?: boolean;
}

export const HISSE_SUBNAV: SubNavTab[] = [
  { href: "",            label: "Genel" },
  { href: "grafik",      label: "Grafik" },
  { href: "teknik",      label: "Teknik" },
  { href: "finansallar", label: "Finansallar" },
  { href: "profil",      label: "Profil" },
  { href: "sahiplik",    label: "Sahiplik" },
  { href: "temettu",     label: "Temettü" },
  { href: "bolunmeler",  label: "Bölünmeler" },
  { href: "haberler",    label: "Haberler" },
  { href: "tarihsel",    label: "Tarihsel" },
];

export const DOVIZ_SUBNAV: SubNavTab[] = [
  { href: "",         label: "Genel" },
  { href: "grafik",   label: "Grafik" },
  { href: "teknik",   label: "Teknik" },
  { href: "haberler", label: "Haberler" },
  { href: "tarihsel", label: "Tarihsel" },
];

export const ALTIN_SUBNAV: SubNavTab[] = [
  { href: "",         label: "Genel" },
  { href: "grafik",   label: "Grafik" },
  { href: "teknik",   label: "Teknik" },
  { href: "haberler", label: "Haberler" },
  { href: "tarihsel", label: "Tarihsel" },
];

// NOT: "Dağılım"/"Portföy" sekmeleri kaldırıldı — 2026-04 TEFAS geçişinden
// sonra varlık dağılımı hiçbir JSON endpoint'inde yok; SSR sayfası Akamai bot
// korumalı olduğundan sunucudan kazınamıyor (bkz. borsapy get_allocation).
export const FON_SUBNAV: SubNavTab[] = [
  { href: "",          label: "Genel" },
  { href: "grafik",    label: "Grafik" },
  { href: "teknik",    label: "Teknik" },
  { href: "getiriler", label: "Getiriler" },
  { href: "haberler",  label: "Haberler" },
  { href: "tarihsel",  label: "Tarihsel" },
];

import type { MetadataRoute } from "next";
import { CURRENCIES } from "@/data/currencies";
import { GOLD_TYPES } from "@/data/gold-types";
import { BIST_TICKERS } from "@/data/bist-tickers";
import { GUIDE_CHAPTERS } from "@/data/guide";
import { LEGAL_PAGES } from "@/data/legal";
import { fetchAllFundReturns } from "@/lib/tefas";
import { SITE_URL } from "@/lib/site";

// Fon listesi TEFAS'tan gelir; günde bir yenilemek yeterli.
export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/doviz`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE_URL}/altin`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE_URL}/hisseler`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE_URL}/fonlar`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/rehber`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/takvim`, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE_URL}/premium`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/login`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/register`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${SITE_URL}/yasal`, changeFrequency: "yearly", priority: 0.2 },
    ...GUIDE_CHAPTERS.map((c) => ({
      url: `${SITE_URL}/rehber/${c.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...LEGAL_PAGES.map((p) => ({
      url: `${SITE_URL}/yasal/${p.slug}`,
      changeFrequency: "yearly" as const,
      priority: 0.2,
    })),
  ];

  const assetRoutes: MetadataRoute.Sitemap = [
    ...CURRENCIES.map((c) => ({
      url: `${SITE_URL}/doviz/${c.code}`,
      lastModified: now,
      changeFrequency: "hourly" as const,
      priority: 0.8,
    })),
    ...GOLD_TYPES.map((g) => ({
      url: `${SITE_URL}/altin/${g.type}`,
      lastModified: now,
      changeFrequency: "hourly" as const,
      priority: 0.8,
    })),
    ...BIST_TICKERS.map((t) => ({
      url: `${SITE_URL}/hisse/${t.symbol}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
  ];

  // TEFAS erişilemezse fonsuz sitemap döndür — build asla bu yüzden kırılmasın.
  let fundRoutes: MetadataRoute.Sitemap = [];
  try {
    const funds = await fetchAllFundReturns();
    fundRoutes = funds.map((f) => ({
      url: `${SITE_URL}/fon/${f.fonKodu}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.6,
    }));
  } catch {
    fundRoutes = [];
  }

  return [...staticRoutes, ...assetRoutes, ...fundRoutes];
}

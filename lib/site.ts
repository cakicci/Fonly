/**
 * Site kökü — metadataBase, sitemap ve robots mutlak URL'leri buradan üretir.
 * Prod'da `APP_URL` env'i (örn. https://fonly.com.tr) set edilmeli;
 * şifre sıfırlama linkleri de aynı env'i kullanır (lib/mail/mailer.ts).
 */
export const SITE_URL =
  process.env.APP_URL?.replace(/\/+$/, "") || "http://localhost:3000";

import * as Sentry from "@sentry/nextjs";

/**
 * Tarayıcı tarafı Sentry. `NEXT_PUBLIC_SENTRY_DSN` boşsa tamamen devre dışı —
 * hesap açılmadan da kod güvenle deploy edilebilir.
 */
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  // Hata örnekleme: hepsi. Performans izleme: düşük oran (ücretsiz kota).
  tracesSampleRate: 0.1,
  replaysOnErrorSampleRate: 0,
  replaysSessionSampleRate: 0,
});

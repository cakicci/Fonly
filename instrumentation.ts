import * as Sentry from "@sentry/nextjs";

/**
 * Next.js instrumentation hook (next.config.mjs → experimental.instrumentationHook).
 *
 * 1. Sentry init — runtime'a göre server/edge konfigürasyonu yüklenir
 *    (DSN boşsa her ikisi de no-op).
 * 2. Prod'da (`next start`) 5 dakikada bir tüm aktif fiyat alarmlarını kontrol
 *    eder — kullanıcı sitede olmasa da alarm tetiklenir ve e-posta gider.
 *    Dev'de çalışmaz (lazy kontrol + /api/cron/alerts yeterli); serverless
 *    dağıtımda da uzun ömürlü process olmadığından /api/cron/alerts kullanılmalı.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
    return;
  }
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  await import("./sentry.server.config");

  if (process.env.NODE_ENV !== "production") return;

  // Hot-reload/çoklu register'a karşı tek interval garantisi.
  const g = globalThis as { __fonlyAlertInterval?: ReturnType<typeof setInterval> };
  if (g.__fonlyAlertInterval) return;

  const { checkAllActiveAlerts } = await import("@/lib/chart/alerts");

  const INTERVAL_MS = 5 * 60_000;
  g.__fonlyAlertInterval = setInterval(() => {
    checkAllActiveAlerts()
      .then(({ checked, triggered }) => {
        if (triggered > 0) {
          console.log(`[alerts] ${checked} alarm kontrol edildi, ${triggered} tetiklendi.`);
        }
      })
      .catch((err) => {
        console.error("[alerts] zamanlanmış kontrol hatası:", err);
        Sentry.captureException(err);
      });
  }, INTERVAL_MS);

  console.log("[alerts] zamanlanmış alarm kontrolü aktif (5 dk).");
}

/** Next.js sunucu render/route hatalarını Sentry'ye iletir. */
export const onRequestError = Sentry.captureRequestError;

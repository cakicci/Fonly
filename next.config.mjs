import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // instrumentation.ts'in çalışması için (Sentry + alarm kontrol interval'ı).
    // Next 15'te varsayılan açık; 14'te experimental bayrak gerekiyor.
    instrumentationHook: true,
  },
};

export default withSentryConfig(nextConfig, {
  // Sourcemap yükleme SENTRY_AUTH_TOKEN gerektirir; hesap açılınca org/project
  // ile birlikte etkinleştirilebilir. Şimdilik kapalı — build temiz kalsın.
  sourcemaps: { disable: true },
  silent: true,
});

import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // instrumentation.ts'in çalışması için (Sentry + alarm kontrol interval'ı).
    // Next 15'te varsayılan açık; 14'te experimental bayrak gerekiyor.
    instrumentationHook: true,
  },
  webpack: (config, { isServer }) => {
    // web-push (→ http_ece) Node'un yerleşik crypto modülünü kullanıyor.
    // instrumentation.ts özel bir webpack hedefinde derleniyor ve
    // serverComponentsExternalPackages onu kapsamıyor — "Can't resolve
    // 'crypto'" hatasıyla tüm uygulama 500 dönüyordu. web-push'u native
    // require olarak dışarıda bırakmak sorunu çözüyor (bkz. lib/push/send.ts).
    if (isServer) {
      config.externals = [...(config.externals || []), "web-push"];
    }
    return config;
  },
};

export default withSentryConfig(nextConfig, {
  // Sourcemap yükleme SENTRY_AUTH_TOKEN gerektirir; hesap açılınca org/project
  // ile birlikte etkinleştirilebilir. Şimdilik kapalı — build temiz kalsın.
  sourcemaps: { disable: true },
  silent: true,
});

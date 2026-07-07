import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Info } from "lucide-react";

export const metadata: Metadata = {
  title: "Ekonomik Takvim — TCMB, Fed, ECB Kararları",
  description:
    "Türkiye ve dünya ekonomik takvimi: enflasyon verileri, faiz kararları, işsizlik ve büyüme açıklamaları — tarih ve beklentilerle.",
};

/**
 * Ekonomik takvim — Investing.com'un ücretsiz gömülebilir widget'ı (iframe).
 * Kendi veri kaynağımız yok (ücretsiz/güvenilir ekonomik takvim API'si
 * bulunmuyor); widget Türkçe (lang=10), TR+ABD+Euro Bölgesi (countries=63,5,72),
 * haftalık görünüm. Attribution (Investing.com linki) kullanım şartı gereği.
 */
export default function TakvimPage() {
  const src =
    "https://sslecal2.investing.com?columns=exc_flags,exc_currency,exc_importance,exc_actual,exc_forecast,exc_previous" +
    "&features=datepicker,timezone&countries=63,5,72&calType=week&timeZone=63&lang=10";

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <nav className="mb-6 flex items-center gap-2 text-sm text-mist/45">
          <Link href="/" className="transition hover:text-white">Ana Sayfa</Link>
          <span>/</span>
          <span className="text-white">Ekonomik Takvim</span>
        </nav>

        <div className="mb-6">
          <p className="flex items-center gap-2 text-sm font-medium text-emerald-200">
            <CalendarDays className="h-4 w-4" />
            Ekonomik Takvim
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">
            Bu hafta piyasaları ne bekliyor?
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-mist/64">
            Türkiye, ABD ve Euro Bölgesi&apos;nin önemli ekonomik açıklamaları: enflasyon,
            faiz kararları, işsizlik ve büyüme verileri — gerçekleşen, beklenti ve önceki
            değerlerle birlikte.
          </p>
        </div>

        <div className="glass-card overflow-hidden rounded-[1.75rem] p-2 sm:p-3">
          <iframe
            src={src}
            title="Ekonomik Takvim"
            className="h-[640px] w-full rounded-2xl border-0 bg-white"
            loading="lazy"
          />
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-2xl border border-white/6 bg-white/[0.015] p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-mist/35" />
          <p className="text-xs leading-5 text-mist/40">
            Takvim verileri{" "}
            <a
              href="https://tr.investing.com/economic-calendar/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-mist/25 underline-offset-2 transition hover:text-mist/70"
            >
              Investing.com
            </a>{" "}
            tarafından sağlanmaktadır. Yüksek önem dereceli (üç boğa) olaylar piyasalarda
            sert hareketlere yol açabilir; veriler bilgilendirme amaçlıdır.
          </p>
        </div>
      </div>
    </main>
  );
}

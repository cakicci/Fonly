"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { UserPlus } from "lucide-react";

// Bu sayfalarda zaten kayıt/giriş akışının içindeyiz — banner tekrar göstermez.
const HIDDEN_PREFIXES = ["/login", "/register", "/forgot-password", "/reset-password"];

/**
 * Site genelinde (footer üstünde) anonim kullanıcılara gösterilen kayıt CTA'sı.
 * İzleme listesi, alarm, portföy, hedefler gibi interaktif özellikler zaten
 * component/route seviyesinde girişe kilitli (bkz. AssetHeaderActions,
 * PriceAlertModal, middleware.ts) — bu banner sadece o kilide gelmeden önce
 * proaktif bir öneri sunar.
 */
export function RegisterCTA() {
  const { status } = useSession();
  const pathname = usePathname();

  if (status !== "unauthenticated") return null;
  if (HIDDEN_PREFIXES.some((p) => pathname?.startsWith(p))) return null;

  return (
    <section className="mx-auto mt-16 max-w-6xl px-4 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-section border border-emerald-200/18 bg-cta p-6 shadow-glow sm:p-8">
        <div className="absolute right-8 top-6 h-32 w-32 rounded-full bg-cyan-300/12 blur-3xl" />
        <div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-300 text-ink-fixed">
              <UserPlus className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-semibold text-white sm:text-3xl">
              Fiyat alarmı kur, portföyünü takip et
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">
              İzleme listesi, fiyat alarmları, portföy takibi ve birikim hedefleri
              ücretsizdir — sadece bir hesap oluşturman yeterli, kart bilgisi istemiyoruz.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/register" className="btn btn-lg btn-primary">
              Ücretsiz Kayıt Ol
            </Link>
            <Link href="/login" className="btn btn-lg btn-secondary text-white">
              Giriş Yap
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

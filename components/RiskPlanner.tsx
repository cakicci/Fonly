"use client";

import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Gauge, WalletCards } from "lucide-react";

const riskProfiles = {
  low: {
    label: "Düşük risk",
    monthlyShare: 0.08,
    tone: "Sakin ilerlemek istiyorsun. Öncelik büyük düşüşlerden kaçınmak.",
    mix: "Daha çok düşük riskli fonlar, para piyasası benzeri sakin seçenekler ve küçük oranda hisse."
  },
  medium: {
    label: "Orta risk",
    monthlyShare: 0.12,
    tone: "Biraz dalgalanmayı kabul ediyorsun. Ama tüm paranı tek fikre bağlamak istemiyorsun.",
    mix: "Dengeli fonlar, uzun vadeli fonlar ve sınırlı sayıda hisse."
  },
  high: {
    label: "Yüksek risk",
    monthlyShare: 0.16,
    tone: "Düşüş dönemlerinde paniğe kapılmadan bekleyebileceğini düşünüyorsun.",
    mix: "Büyüme odaklı fonlar ve hisseler, ama acil ihtiyaç parası ayrı tutulmalı."
  }
};

type RiskKey = keyof typeof riskProfiles;

function formatLira(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0
  }).format(value);
}

export function RiskPlanner() {
  const [income, setIncome] = useState(30000);
  const [risk, setRisk] = useState<RiskKey>("medium");

  const profile = riskProfiles[risk];
  const suggestedAmount = useMemo(() => Math.round(income * profile.monthlyShare), [income, profile.monthlyShare]);
  const safetyAmount = Math.round(income * 3);

  return (
    <section id="risk-planner" className="glass-card rounded-section p-5 sm:p-6">
      <div className="mb-6 flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-medium text-emerald-200">Risk ve bütçe rehberi</p>
          <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
            Gelirine göre ne kadar ayırmak mantıklı?
          </h2>
        </div>
        <p className="max-w-lg text-sm leading-6 text-mist-3">
          Bu bölüm yatırım tavsiyesi değildir. Ama finans okuryazarlığı düşük biri için güvenli düşünme çerçevesi verir.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-card border border-white/8 bg-white/[0.04] p-5">
          <label className="text-sm font-medium text-mist-2" htmlFor="income">
            Aylık gelirini seç
          </label>
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
            <WalletCards className="h-5 w-5 text-emerald-200" />
            <input
              id="income"
              type="number"
              min={5000}
              step={1000}
              value={income}
              onChange={(event) => setIncome(Number(event.target.value) || 0)}
              className="w-full bg-transparent text-lg font-semibold text-white outline-none"
            />
            <span className="text-sm text-mist-3">TL</span>
          </div>

          <div className="mt-5">
            <p className="mb-3 text-sm font-medium text-mist-2">Risk grubunu seç</p>
            <div className="grid gap-2">
              {(Object.keys(riskProfiles) as RiskKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setRisk(key)}
                  className={`flex min-h-12 items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                    risk === key
                      ? "border-emerald-200/40 bg-emerald-300/12 text-white"
                      : "border-white/8 bg-white/[0.03] text-mist-2 hover:bg-white/[0.06]"
                  }`}
                >
                  <span className="text-sm font-semibold">{riskProfiles[key].label}</span>
                  {risk === key ? <CheckCircle2 className="h-5 w-5 text-emerald-200" /> : null}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-card border border-emerald-200/14 bg-[linear-gradient(135deg,rgba(45,227,168,0.12),rgba(255,255,255,0.035))] p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-emerald-300/12 p-3 text-emerald-200">
              <Gauge className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-mist-3">Seçilen profil</p>
              <h3 className="mt-1 text-2xl font-semibold text-white">{profile.label}</h3>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/8 bg-white/[0.05] p-4">
              <p className="text-xs text-mist-3">Aylık ayrılabilecek örnek tutar</p>
              <p className="mt-2 text-3xl font-semibold text-emerald-200">{formatLira(suggestedAmount)}</p>
              <p className="mt-2 text-xs leading-5 text-mist-3">
                Gelirin yaklaşık %{Math.round(profile.monthlyShare * 100)} kadarı.
              </p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.05] p-4">
              <p className="text-xs text-mist-3">Önce kenarda durması iyi olan para</p>
              <p className="mt-2 text-3xl font-semibold text-cyan-200">{formatLira(safetyAmount)}</p>
              <p className="mt-2 text-xs leading-5 text-mist-3">
                En az 3 aylık gelir kadar acil durum alanı.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3 text-sm leading-6 text-mist-2">
            <p>{profile.tone}</p>
            <p>{profile.mix}</p>
            <p className="flex gap-2 rounded-2xl border border-amber-200/14 bg-amber-300/8 p-3 text-amber-50/84">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              Kira, fatura ve borçlardan sonra kalan parayı düşün. Kredi borcu varken yüksek risk almak genelde sağlıklı değildir.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

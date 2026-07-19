"use client";

import { useMemo, useState } from "react";
import { Calculator, ChevronDown, ChevronUp } from "lucide-react";

function tl(n: number): string {
  return n.toLocaleString("tr-TR", { maximumFractionDigits: 0 });
}

/** Aylık düzenli katkının gelecekteki değeri. i = aylık faiz oranı (0 = büyümesiz). */
function futureValue(monthly: number, months: number, annualRatePct: number): number {
  if (months <= 0 || monthly <= 0) return 0;
  const i = annualRatePct / 100 / 12;
  if (i === 0) return monthly * months;
  return monthly * ((Math.pow(1 + i, months) - 1) / i);
}

/**
 * "Ayda 500 TL biriktirirsem 5 yılda ne kadar birikir?" hesaplayıcısı.
 * Hem düz birikimi hem de varsayılan bir getiri oranıyla bileşik büyümeyi
 * yan yana gösterir — bileşik getirinin etkisini somutlaştırmak için
 * (bkz. Rehber, "Uzun Vadeyi Benimse" bölümü).
 */
export function SavingsProjectionCalculator() {
  const [open, setOpen]     = useState(false);
  const [monthly, setMonthly] = useState("500");
  const [years, setYears]     = useState("5");
  const [ratePct, setRatePct] = useState("30");

  const result = useMemo(() => {
    const m = parseFloat(monthly.replace(",", "."));
    const y = parseFloat(years.replace(",", "."));
    const r = parseFloat(ratePct.replace(",", "."));
    if (!Number.isFinite(m) || m <= 0 || !Number.isFinite(y) || y <= 0) return null;
    const months = y * 12;
    const flat   = futureValue(m, months, 0);
    const grown  = Number.isFinite(r) ? futureValue(m, months, r) : flat;
    return { flat, grown, totalDeposited: m * months };
  }, [monthly, years, ratePct]);

  return (
    <div className="glass-card rounded-2xl p-5">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between gap-3"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-mist">
          <Calculator className="h-4 w-4 text-emerald-200" />
          Birikim hesaplayıcı
        </span>
        {open ? <ChevronUp className="h-4 w-4 text-mist-3" /> : <ChevronDown className="h-4 w-4 text-mist-3" />}
      </button>

      {open && (
        <div className="mt-4">
          <p className="text-xs text-mist-3">
            Her ay düzenli bir tutar ayırırsan, belirlediğin sürede ne kadar birikeceğini gör.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-mist-3">
                Aylık tutar (TL)
              </label>
              <input
                value={monthly}
                onChange={e => setMonthly(e.target.value)}
                inputMode="decimal"
                className="w-full rounded-xl border border-line bg-white/[0.03] px-3 py-2.5 text-sm text-mist outline-none focus:border-emerald-300/40"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-mist-3">
                Süre (yıl)
              </label>
              <input
                value={years}
                onChange={e => setYears(e.target.value)}
                inputMode="decimal"
                className="w-full rounded-xl border border-line bg-white/[0.03] px-3 py-2.5 text-sm text-mist outline-none focus:border-emerald-300/40"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-mist-3">
                Varsayılan yıllık getiri (%)
              </label>
              <input
                value={ratePct}
                onChange={e => setRatePct(e.target.value)}
                inputMode="decimal"
                className="w-full rounded-xl border border-line bg-white/[0.03] px-3 py-2.5 text-sm text-mist outline-none focus:border-emerald-300/40"
              />
            </div>
          </div>

          {result ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-line bg-white/[0.03] px-4 py-3">
                <p className="text-[11px] font-medium uppercase tracking-wider text-mist-3">
                  Sadece biriktirirsen (getirisiz)
                </p>
                <p className="mt-1 text-lg font-semibold text-mist">{tl(result.flat)} TL</p>
                <p className="mt-0.5 text-[11px] text-mist-3">Toplam yatırdığın: {tl(result.totalDeposited)} TL</p>
              </div>
              <div className="rounded-xl border border-emerald-300/15 bg-emerald-300/[0.05] px-4 py-3">
                <p className="text-[11px] font-medium uppercase tracking-wider text-emerald-200/70">
                  %{ratePct} yıllık getiriyle yatırırsan
                </p>
                <p className="mt-1 text-lg font-semibold text-emerald-200">{tl(result.grown)} TL</p>
                <p className="mt-0.5 text-[11px] text-mist-3">
                  Bileşik getirinin farkı: +{tl(Math.max(result.grown - result.flat, 0))} TL
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-mist-3">Geçerli bir tutar ve süre gir.</p>
          )}

          <p className="mt-3 text-[11px] leading-relaxed text-mist-3">
            Bu bir tahmindir, gerçek getiri piyasa koşullarına göre değişir ve garanti edilmez.
            Bileşik getiri hakkında daha fazlası için{" "}
            <a href="/rehber/5" className="text-emerald-200 hover:text-emerald-100">
              rehberdeki ilgili bölüme
            </a>{" "}
            bakabilirsin.
          </p>
        </div>
      )}
    </div>
  );
}

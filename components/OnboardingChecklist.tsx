import Link from "next/link";
import { Check, Circle, Rocket } from "lucide-react";

export interface OnboardingStep {
  label: string;
  href: string;
  cta: string;
  done: boolean;
}

/**
 * Kuruluma yön veren ilerleme listesi. Tüm adımlar tamamlandığında kendini gizler
 * (yerleşmiş kullanıcıyı rahatsız etmesin). Adım durumları sayfa tarafında hesaplanır.
 */
export function OnboardingChecklist({ steps }: { steps: OnboardingStep[] }) {
  const done = steps.filter((s) => s.done).length;
  const total = steps.length;
  if (done >= total) return null;

  const pct = Math.round((done / total) * 100);

  return (
    <div className="rounded-[1.75rem] border border-emerald-200/15 bg-[linear-gradient(135deg,rgba(45,227,168,0.10),rgba(12,24,22,0.5))] p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-300/15 text-emerald-200">
            <Rocket className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Fonly&apos;yi kurmayı tamamla</h2>
            <p className="text-xs text-mist/55">{done}/{total} adım tamamlandı</p>
          </div>
        </div>
        <span className="text-sm font-semibold tabular-nums text-emerald-200">%{pct}</span>
      </div>

      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-emerald-300 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {steps.map((s) =>
          s.done ? (
            <li
              key={s.label}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-mist/45"
            >
              <Check className="h-4 w-4 shrink-0 text-emerald-300" />
              <span className="line-through">{s.label}</span>
            </li>
          ) : (
            <li key={s.label}>
              <Link
                href={s.href}
                className="group flex items-center justify-between gap-2 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-mist/80 transition hover:border-emerald-300/30 hover:text-white"
              >
                <span className="flex items-center gap-2">
                  <Circle className="h-4 w-4 shrink-0 text-mist/30" />
                  {s.label}
                </span>
                <span className="shrink-0 text-xs font-semibold text-emerald-200">{s.cta} →</span>
              </Link>
            </li>
          )
        )}
      </ul>
    </div>
  );
}

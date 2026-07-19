"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useMounted } from "@/lib/hooks/useMounted";

/**
 * Açık/koyu mod arasında kaydırmalı (switch) geçiş. Mount öncesi tema
 * bilinmediği için (next-themes SSR'da bilmiyor) boş bir yer tutucu render
 * edilir — böylece hydration mismatch veya yanlış konumun anlık görünmesi
 * olmaz. Topuz her zaman ink-fixed + beyaz ikon kullanır: bu ikisi zaten
 * "her iki modda da koyu kalan" sabit bir çift olduğu için accent gibi
 * tema-bağımlı bir tona göre kontrast hesaplamaya gerek kalmıyor.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();

  if (!mounted) {
    return <div className="h-8 w-14 shrink-0" aria-hidden="true" />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="group relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border border-line bg-white/[0.04] px-1 transition hover:bg-white/[0.08]"
      aria-label={isDark ? "Açık temaya geç" : "Koyu temaya geç"}
    >
      <Sun className="pointer-events-none absolute left-1.5 h-3.5 w-3.5 text-mist-3" />
      <Moon className="pointer-events-none absolute right-1.5 h-3.5 w-3.5 text-mist-3" />
      <span
        className={`relative z-10 inline-flex h-6 w-6 items-center justify-center rounded-full bg-ink-fixed text-white shadow-card transition-transform duration-base ${
          isDark ? "translate-x-6" : "translate-x-0"
        }`}
      >
        {isDark ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
      </span>
    </button>
  );
}

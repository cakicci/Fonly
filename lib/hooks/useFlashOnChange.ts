"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Bir sayısal değer değiştiğinde kısa süreli "up"/"down" sinyali döner.
 * Investing.com tarzı yeşil/kırmızı flash efekti için kullanılır.
 *
 * - İlk değer ya da `null/undefined` flash tetiklemez (mount'ta her şey yanıp sönmesin).
 * - Aynı değere set edilirse flash atlanır.
 * - `blinkCount` kere arka arkaya yanıp söner; süre bitmeden tekrar değişirse
 *   önceki tüm timeout'lar temizlenip yenisi başlar.
 */
export function useFlashOnChange(
  value: number | null | undefined,
  onMs = 380,
  blinkCount = 3
): "up" | "down" | null {
  const prevRef = useRef<number | null>(null);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    if (value == null || !Number.isFinite(value)) return;
    const prev = prevRef.current;
    prevRef.current = value;
    if (prev == null) return;        // ilk geçerli değer — flash yok
    if (value === prev) return;

    const direction = value > prev ? "up" : "down";
    const offMs = Math.round(onMs * 0.55);
    const cycleMs = onMs + offMs;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    setFlash(direction);
    timeouts.push(setTimeout(() => setFlash(null), onMs));
    for (let i = 1; i < blinkCount; i++) {
      timeouts.push(setTimeout(() => setFlash(direction), i * cycleMs));
      timeouts.push(setTimeout(() => setFlash(null), i * cycleMs + onMs));
    }
    return () => timeouts.forEach(clearTimeout);
  }, [value, onMs, blinkCount]);

  return flash;
}

/**
 * `useFlashOnChange`'in className üreten kısa-yol versiyonu. Fiyat hücresinin
 * etrafına bg/ring uygular; transition geçişiyle yumuşak çıkış.
 *
 * Kullanım:
 *   <span className={`transition-colors duration-300 ${flashClass(price)}`}>
 */
export function useFlashClass(
  value: number | null | undefined,
  onMs = 400,
  blinkCount = 3
): string {
  const flash = useFlashOnChange(value, onMs, blinkCount);
  if (!flash) return "";
  return flash === "up"
    ? "bg-emerald-400/20 ring-1 ring-emerald-300/40 rounded"
    : "bg-rose-400/20 ring-1 ring-rose-300/40 rounded";
}

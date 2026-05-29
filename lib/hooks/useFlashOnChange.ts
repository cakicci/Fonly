"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Bir sayısal değer değiştiğinde kısa süreli "up"/"down" sinyali döner.
 * Investing.com tarzı yeşil/kırmızı flash efekti için kullanılır.
 *
 * - İlk değer ya da `null/undefined` flash tetiklemez (mount'ta her şey yanıp sönmesin).
 * - Aynı değere set edilirse flash atlanır.
 * - Süre bitmeden tekrar değişirse önceki timeout temizlenip yenisi başlar.
 */
export function useFlashOnChange(
  value: number | null | undefined,
  durationMs = 600
): "up" | "down" | null {
  const prevRef = useRef<number | null>(null);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    if (value == null || !Number.isFinite(value)) return;
    const prev = prevRef.current;
    prevRef.current = value;
    if (prev == null) return;        // ilk geçerli değer — flash yok
    if (value === prev) return;
    setFlash(value > prev ? "up" : "down");
    const t = setTimeout(() => setFlash(null), durationMs);
    return () => clearTimeout(t);
  }, [value, durationMs]);

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
  durationMs = 600
): string {
  const flash = useFlashOnChange(value, durationMs);
  if (!flash) return "";
  return flash === "up"
    ? "bg-emerald-400/20 ring-1 ring-emerald-300/40 rounded"
    : "bg-rose-400/20 ring-1 ring-rose-300/40 rounded";
}

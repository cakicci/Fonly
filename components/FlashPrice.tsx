"use client";

import { ReactNode } from "react";
import { useFlashClass } from "@/lib/hooks/useFlashOnChange";

/**
 * Fiyat görüntüsünün etrafında investing.com tarzı yeşil/kırmızı flash uygular.
 * `value` numerik karşılaştırma için kullanılır; `children` görsel içerik
 * (TL simgesi, badge vb. dahil edilebilir).
 */
export function FlashPrice({
  value,
  className = "",
  children,
}: {
  value: number | null | undefined;
  className?: string;
  children: ReactNode;
}) {
  const flash = useFlashClass(value);
  return (
    <span
      className={`inline-block rounded transition-colors duration-150 ${flash} ${className}`}
    >
      {children}
    </span>
  );
}

/**
 * Türkçe formatlanmış fiyat string'ini sayıya çevirir.
 * "296,75" → 296.75, "13.663,45" → 13663.45, "13.663" → 13663.
 * Geçersizse 0 döner.
 */
export function parseTrPrice(s: string | undefined | null): number {
  if (!s) return 0;
  const cleaned = s.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

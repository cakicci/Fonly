"use client";

import { useEffect, useState } from "react";

/**
 * next-themes tabanlı tema bilgisi SSR/hydration'da hazır değildir; JS renk
 * sabitleri (grafikler) veya tema-bağımlı ikon seçen bileşenler bu guard'la
 * mount sonrasına ertelenir, hydration mismatch önlenir.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}

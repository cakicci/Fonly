import type { Metadata } from "next";
import type { ReactNode } from "react";

// Liste sayfası "use client" olduğu için metadata bu segment layout'undan verilir.
export const metadata: Metadata = {
  title: "BIST Hisseleri — Canlı Borsa Fiyatları",
  description:
    "Borsa İstanbul'da işlem gören ~300 hissenin canlı fiyatları, günlük değişimleri ve risk sınıflandırmaları. Arama ve filtreleme ile hisse keşfet.",
};

export default function HisselerSegmentLayout({ children }: { children: ReactNode }) {
  return children;
}

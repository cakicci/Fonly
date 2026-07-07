import type { Metadata } from "next";
import type { ReactNode } from "react";

// Liste sayfası "use client" olduğu için metadata bu segment layout'undan verilir.
export const metadata: Metadata = {
  title: "Döviz Kurları — Canlı Alış Satış",
  description:
    "30 döviz kurunda canlı alış/satış fiyatları: dolar, euro, sterlin ve daha fazlası. 5 saniyede bir güncellenen kurlar, geçmiş grafikler ve analiz.",
};

export default function DovizSegmentLayout({ children }: { children: ReactNode }) {
  return children;
}

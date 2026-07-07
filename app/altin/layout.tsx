import type { Metadata } from "next";
import type { ReactNode } from "react";

// Liste sayfası "use client" olduğu için metadata bu segment layout'undan verilir.
export const metadata: Metadata = {
  title: "Altın Fiyatları — Gram, Çeyrek, Cumhuriyet",
  description:
    "Canlı altın fiyatları: gram, çeyrek, yarım, tam altın; Cumhuriyet, Ata, Reşat gibi antika altınlar; 14-18 ayar ve gümüş. Anlık alış/satış ve grafikler.",
};

export default function AltinSegmentLayout({ children }: { children: ReactNode }) {
  return children;
}

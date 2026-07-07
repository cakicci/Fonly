import type { Metadata } from "next";
import type { ReactNode } from "react";

// Liste sayfası "use client" olduğu için metadata bu segment layout'undan verilir.
export const metadata: Metadata = {
  title: "TEFAS Yatırım Fonları — Getiri ve Karşılaştırma",
  description:
    "2100'den fazla TEFAS yatırım fonu: güncel fiyatlar, risk seviyeleri, 1 aylık / yıl başı / 1 yıllık getiriler. Kategoriye göre filtrele, getiriye göre sırala.",
};

export default function FonlarSegmentLayout({ children }: { children: ReactNode }) {
  return children;
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { AlertBadge } from "@/components/chart/AlertBadge";

const inter = Inter({ subsets: ["latin", "latin-ext"], display: "swap" });

export const metadata: Metadata = {
  title: "Fonly | Basit yatırım rehberi",
  description:
    "Fonly, fonları ve hisseleri finans bilgisi az olan kullanıcılar için sade Türkçe ile açıklar."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={inter.className}>
        <Providers>
          {children}
          <AlertBadge />
        </Providers>
      </body>
    </html>
  );
}

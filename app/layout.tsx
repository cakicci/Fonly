import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { AlertBadge } from "@/components/chart/AlertBadge";
import { GlobalWatchlistDrawer } from "@/components/chart/GlobalWatchlistDrawer";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SITE_URL } from "@/lib/site";

const inter = Inter({ subsets: ["latin", "latin-ext"], display: "swap" });

const SITE_DESCRIPTION =
  "Fonly; döviz, altın, BIST hisseleri ve TEFAS fonlarını finans bilgisi az olan kullanıcılar için sade Türkçe ile açıklar. Canlı fiyatlar, grafikler, portföy takibi ve yatırım rehberi.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Fonly | Basit yatırım rehberi",
    template: "%s — Fonly"
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: "Fonly",
    locale: "tr_TR",
    title: "Fonly | Basit yatırım rehberi",
    description: SITE_DESCRIPTION,
    images: [{ url: "/Fonly_Logo.png", alt: "Fonly" }]
  },
  twitter: {
    card: "summary",
    title: "Fonly | Basit yatırım rehberi",
    description: SITE_DESCRIPTION,
    images: ["/Fonly_Logo.png"]
  },
  icons: {
    icon: "/Fonly_Favicon.png",
    shortcut: "/Fonly_Favicon.png",
    apple: "/Fonly_Favicon.png"
  }
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
          <SiteHeader />
          {children}
          <SiteFooter />
          <AlertBadge />
          <GlobalWatchlistDrawer />
        </Providers>
      </body>
    </html>
  );
}

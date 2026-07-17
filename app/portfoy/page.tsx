import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PortfolioClient } from "@/components/portfolio/PortfolioClient";

export const metadata: Metadata = {
  title: "Portföyüm",
  description: "Yatırımlarını kaydet, canlı fiyatlarla kâr/zararını takip et.",
};

export default async function PortfolioPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/portfoy");

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-white sm:text-3xl">Portföyüm</h1>
          <p className="mt-1 text-sm text-mist-3">
            Alımlarını ekle; döviz, altın, hisse ve fonlarını canlı fiyatlarla tek ekranda takip et.
          </p>
        </header>

        <PortfolioClient />
      </div>
    </main>
  );
}

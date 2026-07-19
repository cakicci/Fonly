import { notFound } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { fetchCompanyProfile } from "@/lib/yahoo/profile";
import { CompanyProfileSection } from "@/components/profile/CompanyProfileSection";
import { BIST_TICKERS } from "@/data/bist-tickers";

type Params = { symbol: string };

export default async function HisseProfilPage({ params }: { params: Params }) {
  const symbol = params.symbol.toUpperCase();
  const meta   = BIST_TICKERS.find(t => t.symbol === symbol);
  if (!meta) notFound();

  const profile = await fetchCompanyProfile(symbol);

  if (!profile) {
    return (
      <div className="glass-card flex items-start gap-3 rounded-2xl p-6">
        <div className="rounded-lg bg-rose-300/10 p-2">
          <AlertTriangle className="h-4 w-4 text-rose-200" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-mist">Profil bulunamadı</h2>
          <p className="mt-1 text-sm text-mist-3">
            Yahoo Finance {symbol} için profil verisi sunmuyor.
          </p>
        </div>
      </div>
    );
  }

  return <CompanyProfileSection profile={profile} companyName={meta.name} />;
}

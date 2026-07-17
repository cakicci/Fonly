import { notFound } from "next/navigation";
import { Info } from "lucide-react";
import { fetchOwnership } from "@/lib/yahoo/ownership";
import { OwnershipSection } from "@/components/ownership/OwnershipSection";
import { BIST_TICKERS } from "@/data/bist-tickers";

type Params = { symbol: string };

export default async function HisseSahiplikPage({ params }: { params: Params }) {
  const symbol = params.symbol.toUpperCase();
  if (!BIST_TICKERS.find(t => t.symbol === symbol)) notFound();

  const data = await fetchOwnership(symbol);

  if (!data) {
    return (
      <div className="glass-card flex items-start gap-3 rounded-2xl p-6">
        <div className="rounded-lg bg-amber-300/10 p-2">
          <Info className="h-4 w-4 text-amber-200" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">Sahiplik verisi yok</h2>
          <p className="mt-1 text-sm text-mist-3">
            Yahoo Finance {symbol} için sahiplik kompozisyonu sunmuyor. Bu hisse
            için ortaklık yapısı KAP entegrasyonuyla (Faz 6.5) eklenecek.
          </p>
        </div>
      </div>
    );
  }

  return <OwnershipSection data={data} />;
}

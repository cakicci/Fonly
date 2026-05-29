import { notFound } from "next/navigation";
import { HistoricalTable } from "@/components/historical/HistoricalTable";
import { CURRENCY_MAP } from "@/data/currencies";

type Params = { code: string };

export default function DovizTarihselPage({ params }: { params: Params }) {
  const code = params.code.toUpperCase();
  const currency = CURRENCY_MAP[code];
  if (!currency) notFound();
  return <HistoricalTable slug={`doviz-${code}`} assetName={currency.shortName} />;
}

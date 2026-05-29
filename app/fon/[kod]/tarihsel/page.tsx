import { fetchFundDetail } from "@/lib/tefas";
import { HistoricalTable } from "@/components/historical/HistoricalTable";

type Params = { kod: string };

export default async function FonTarihselPage({ params }: { params: Params }) {
  const kod = params.kod.toUpperCase();
  const detail = await fetchFundDetail(kod);
  return <HistoricalTable slug={`fon-${kod}`} assetName={detail?.fonUnvan ?? kod} />;
}

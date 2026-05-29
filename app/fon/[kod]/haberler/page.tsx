import { fetchAllFundReturns, fetchFundDetail } from "@/lib/tefas";
import { fetchNews } from "@/lib/news/fetchNews";
import { NewsSection } from "@/components/news/NewsSection";

type Params = { kod: string };

export default async function FonHaberlerPage({ params }: { params: Params }) {
  const kod = params.kod.toUpperCase();
  const [detail, allReturns] = await Promise.all([
    fetchFundDetail(kod).catch(() => null),
    fetchAllFundReturns("YAT").catch(() => []),
  ]);
  const returnRow = allReturns.find((r) => r.fonKodu === kod);

  const result = await fetchNews({
    type:     "fon",
    kod,
    fonAdi:   detail?.fonUnvan,
    kategori: returnRow?.fonTurAciklama,
  });
  return <NewsSection result={result} />;
}

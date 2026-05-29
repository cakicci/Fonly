import { notFound } from "next/navigation";
import { BIST_TICKERS } from "@/data/bist-tickers";
import { fetchNews } from "@/lib/news/fetchNews";
import { NewsSection } from "@/components/news/NewsSection";

type Params = { symbol: string };

export default async function HisseHaberlerPage({ params }: { params: Params }) {
  const symbol = params.symbol.toUpperCase();
  if (!BIST_TICKERS.find(t => t.symbol === symbol)) notFound();
  const result = await fetchNews({ type: "hisse", symbol });
  return <NewsSection result={result} />;
}

import { notFound } from "next/navigation";
import { CURRENCY_MAP } from "@/data/currencies";
import { fetchNews } from "@/lib/news/fetchNews";
import { NewsSection } from "@/components/news/NewsSection";

type Params = { code: string };

export default async function DovizHaberlerPage({ params }: { params: Params }) {
  const code = params.code.toUpperCase();
  if (!CURRENCY_MAP[code]) notFound();
  const result = await fetchNews({ type: "doviz", code });
  return <NewsSection result={result} />;
}

import { notFound } from "next/navigation";
import { GOLD_TYPE_MAP } from "@/data/gold-types";
import { fetchNews } from "@/lib/news/fetchNews";
import { NewsSection } from "@/components/news/NewsSection";

type Params = { type: string };

export default async function AltinHaberlerPage({ params }: { params: Params }) {
  const goldType = params.type.toLowerCase();
  if (!GOLD_TYPE_MAP[goldType]) notFound();
  const result = await fetchNews({ type: "altin", goldType });
  return <NewsSection result={result} />;
}

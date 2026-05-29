import { notFound } from "next/navigation";
import { TechnicalSection } from "@/components/chart/TechnicalSection";
import { CURRENCY_MAP } from "@/data/currencies";

type Params = { code: string };

export default function DovizTeknikPage({ params }: { params: Params }) {
  const code = params.code.toUpperCase();
  if (!CURRENCY_MAP[code]) notFound();
  return <TechnicalSection slug={`doviz-${code}`} defaultTf="1D" />;
}

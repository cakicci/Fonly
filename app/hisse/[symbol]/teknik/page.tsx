import { TechnicalSection } from "@/components/chart/TechnicalSection";

type Params = { symbol: string };

export default function HisseTeknikPage({ params }: { params: Params }) {
  const slug = `hisse-${params.symbol.toUpperCase()}`;
  return <TechnicalSection slug={slug} defaultTf="1D" />;
}

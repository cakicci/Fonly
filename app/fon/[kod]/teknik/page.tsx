import { auth } from "@/auth";
import { isPremium } from "@/lib/auth/premium";
import { TechnicalSection } from "@/components/chart/TechnicalSection";
import { TechnicalLocked } from "@/components/billing/TechnicalLocked";

type Params = { kod: string };

export default async function FonTeknikPage({ params }: { params: Params }) {
  const kod = params.kod.toUpperCase();

  const session = await auth();
  const premium = await isPremium(session?.user?.id);

  if (!premium) return <TechnicalLocked assetName={kod} />;

  return <TechnicalSection slug={`fon-${kod}`} defaultTf="1D" />;
}

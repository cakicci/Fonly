import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { auth } from "@/auth";
import { isPlanId } from "@/lib/billing/plans";
import { PLAN_MAP } from "@/lib/billing/plans";
import { initializeSubscriptionCheckout } from "@/lib/billing/providers/iyzico";
import { IyzicoFormEmbed } from "@/components/billing/IyzicoFormEmbed";

export const metadata: Metadata = {
  title: "Güvenli Ödeme",
  robots: { index: false },
};

/**
 * iyzico abonelik formu embed sayfası.
 *
 * /api/checkout → createCheckout buraya yönlendirir; sayfa render sırasında
 * iyzico'dan `checkoutFormContent` alır ve client bileşeniyle enjekte eder.
 * Yalnızca PAYMENT_PROVIDER=iyzico iken anlamlıdır.
 */
export default async function IyzicoCheckoutPage({
  searchParams,
}: {
  searchParams: { plan?: string };
}) {
  if (process.env.PAYMENT_PROVIDER !== "iyzico") redirect("/premium");

  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    redirect("/login?callbackUrl=/premium");
  }

  const planId = searchParams.plan;
  if (!isPlanId(planId)) redirect("/premium");
  const plan = PLAN_MAP[planId];

  let content: string;
  try {
    const result = await initializeSubscriptionCheckout(
      { id: session.user.id, email: session.user.email, name: session.user.name },
      planId
    );
    content = result.checkoutFormContent;
  } catch (err) {
    console.error("[iyzico:checkout] form başlatılamadı:", err);
    redirect("/premium?payment=init_failed");
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-xl">
        <Link
          href="/premium"
          className="mb-6 inline-flex items-center gap-2 text-sm text-mist-3 transition hover:text-mist"
        >
          <ArrowLeft className="h-4 w-4" />
          Premium sayfasına dön
        </Link>

        <div className="glass-card rounded-section p-6">
          <div className="mb-5">
            <p className="flex items-center gap-2 text-sm font-medium text-emerald-200">
              <ShieldCheck className="h-4 w-4" />
              Güvenli ödeme — iyzico
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-mist">
              FonlyPro {plan.name} — {plan.priceLabel}
              <span className="text-base font-normal text-mist-3">{plan.period}</span>
            </h1>
            <p className="mt-2 text-xs leading-5 text-mist-3">
              Kart bilgilerin Fonly&apos;ye ulaşmaz; ödeme iyzico&apos;nun güvenli altyapısında
              gerçekleşir. Aboneliğini dilediğin zaman Hesabım &gt; Abonelik&apos;ten
              iptal edebilirsin.
            </p>
          </div>

          <IyzicoFormEmbed content={content} />
        </div>
      </div>
    </main>
  );
}

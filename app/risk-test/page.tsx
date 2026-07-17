import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { RiskTestForm } from "@/components/RiskTestForm";

export const metadata: Metadata = {
  title: "Risk Profili Testi",
  description: "Kısa bir testle yatırımcı risk profilini öğren; sana uygun varlık önerileri al.",
};

export default async function RiskTestPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <p className="text-sm font-medium text-emerald-200">Risk profili testi</p>
          <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
            Sana uygun riski keşfet
          </h1>
          <p className="mt-3 text-sm leading-6 text-mist-2">
            5 kısa soru ile yatırım tarzına en uygun risk grubunu belirleyelim.
          </p>
        </div>
        <RiskTestForm />
      </div>
    </main>
  );
}

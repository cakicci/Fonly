import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles, ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isPremium } from "@/lib/auth/premium";
import { PLAN_MAP } from "@/lib/billing/plans";
import { Tabs } from "@/components/chart/Tabs";
import { ProfileSection } from "@/components/account/ProfileSection";
import { SecuritySection } from "@/components/account/SecuritySection";
import { DangerZone } from "@/components/account/DangerZone";
import { ManageSubscription } from "@/components/billing/ManageSubscription";

export const metadata: Metadata = {
  title: "Hesabım — Fonly",
};

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/hesap");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      passwordHash: true,
      accounts: { select: { provider: true } },
      subscription: {
        select: { plan: true, status: true, currentPeriodEnd: true, cancelAtPeriodEnd: true },
      },
    },
  });

  if (!user) redirect("/login");

  const premium = await isPremium(session.user.id);
  const hasPassword = !!user.passwordHash;
  const googleConnected = user.accounts.some((a) => a.provider === "google");

  const subscriptionContent =
    premium && user.subscription ? (
      <ManageSubscription
        planName={PLAN_MAP[user.subscription.plan as keyof typeof PLAN_MAP]?.name ?? user.subscription.plan}
        periodEnd={user.subscription.currentPeriodEnd.toISOString()}
        cancelAtPeriodEnd={user.subscription.cancelAtPeriodEnd}
      />
    ) : (
      <div className="glass-card rounded-2xl p-6 ring-1 ring-fuchsia-300/20">
        <div className="flex items-center gap-2 text-fuchsia-200">
          <Sparkles className="h-4 w-4" />
          <h2 className="text-sm font-semibold">Ücretsiz plan</h2>
        </div>
        <p className="mt-2 text-sm text-mist/60">
          FonlyPro ile AI destekli analiz, kısa vadeli zaman dilimleri ve daha fazlasına eriş.
        </p>
        <Link
          href="/premium"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-300/80 to-emerald-300/80 px-4 py-2 text-sm font-semibold text-ink transition hover:from-fuchsia-200 hover:to-emerald-200"
        >
          Premium’a yükselt
        </Link>
      </div>
    );

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-mist/50 transition hover:text-mist/80"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Panele dön
        </Link>

        <header className="mb-6 mt-3">
          <h1 className="text-2xl font-semibold text-white sm:text-3xl">Hesabım</h1>
          <p className="mt-1 text-sm text-mist/55">Profil, güvenlik ve abonelik ayarların.</p>
        </header>

        <Tabs
          defaultKey="profile"
          tabs={[
            { key: "profile", label: "Profil", content: <ProfileSection initialName={user.name ?? ""} email={user.email ?? ""} /> },
            { key: "security", label: "Güvenlik", content: <SecuritySection hasPassword={hasPassword} googleConnected={googleConnected} /> },
            { key: "subscription", label: "Abonelik", content: subscriptionContent },
            { key: "danger", label: "Tehlikeli bölge", content: <DangerZone /> },
          ]}
        />
      </div>
    </main>
  );
}

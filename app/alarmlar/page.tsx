import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { AlertsManager } from "@/components/alerts/AlertsManager";

export const metadata: Metadata = {
  title: "Alarmlarım",
};

export default async function AlertsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/alarmlar");

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
          <h1 className="text-2xl font-semibold text-white sm:text-3xl">Fiyat Alarmlarım</h1>
          <p className="mt-1 text-sm text-mist/55">
            Kurduğun tüm alarmları tek yerden gör ve yönet. Yeni alarmı varlık sayfalarından ekleyebilirsin.
          </p>
        </header>

        <AlertsManager />
      </div>
    </main>
  );
}

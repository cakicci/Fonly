import type { Metadata } from "next";
import { LoginForm } from "@/components/LoginForm";
import { googleAuthEnabled } from "@/auth";

export const metadata: Metadata = {
  title: "Giriş Yap",
  description: "Fonly hesabına giriş yap; portföyünü, izleme listeni ve alarmlarını yönet.",
};

export default function LoginPage({
  searchParams
}: {
  searchParams: { error?: string; callbackUrl?: string };
}) {
  return (
    <main className="flex min-h-screen flex-col px-4 py-6 sm:px-6 lg:px-8">
      <section className="flex flex-1 items-center justify-center py-10">
        <LoginForm
          googleEnabled={googleAuthEnabled}
          oauthError={searchParams.error}
          callbackUrl={searchParams.callbackUrl}
        />
      </section>
    </main>
  );
}

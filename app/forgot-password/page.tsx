import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Şifremi Unuttum",
  robots: { index: false },
};

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen flex-col px-4 py-6 sm:px-6 lg:px-8">
      <section className="flex flex-1 items-center justify-center py-10">
        <ForgotPasswordForm />
      </section>
    </main>
  );
}

import type { Metadata } from "next";
import { RegisterForm } from "@/components/RegisterForm";
import { googleAuthEnabled } from "@/auth";

export const metadata: Metadata = {
  title: "Kayıt Ol",
  description: "Ücretsiz Fonly hesabı aç; risk profilini öğren, portföyünü takip et, fiyat alarmı kur.",
};

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen flex-col px-4 py-6 sm:px-6 lg:px-8">
      <section className="flex flex-1 items-center justify-center py-10">
        <RegisterForm googleEnabled={googleAuthEnabled} />
      </section>
    </main>
  );
}

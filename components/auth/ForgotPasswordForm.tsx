"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Mail, MailCheck } from "lucide-react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        setError(data?.message ?? "İstek gönderilemedi. Lütfen tekrar dene.");
        return;
      }
      setSent(true);
    } catch {
      setError("Bağlantı hatası. Lütfen tekrar dene.");
    } finally {
      setIsLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="glass-card mx-auto w-full max-w-md rounded-[1.75rem] p-6">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-300/15">
            <MailCheck className="h-6 w-6 text-emerald-200" />
          </span>
          <h1 className="mt-4 text-2xl font-semibold text-white">Posta kutunu kontrol et</h1>
          <p className="mt-3 text-sm leading-6 text-mist/64">
            Eğer <span className="text-mist">{email}</span> adresi kayıtlıysa, şifre sıfırlama
            bağlantısını gönderdik. Bağlantı 1 saat geçerli. Gelen kutunda yoksa spam klasörüne bak.
          </p>
        </div>
        <Link
          href="/login"
          className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-mist/14 bg-white/5 px-5 py-3 text-sm font-semibold text-mist transition hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4" />
          Girişe dön
        </Link>
      </div>
    );
  }

  return (
    <div className="glass-card mx-auto w-full max-w-md rounded-[1.75rem] p-6">
      <div className="mb-6">
        <p className="text-sm font-medium text-emerald-200">Şifre sıfırlama</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Şifreni mi unuttun?</h1>
        <p className="mt-3 text-sm leading-6 text-mist/64">
          Hesabının e-posta adresini gir, sana sıfırlama bağlantısı gönderelim.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-sm font-medium text-mist/72">Email</span>
          <span className="mt-2 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
            <Mail className="h-5 w-5 text-mist/46" />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full bg-transparent text-white outline-none placeholder:text-mist/32"
              placeholder="ornek@mail.com"
            />
          </span>
        </label>

        {error ? (
          <p className="rounded-2xl border border-rose-200/14 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-300 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Sıfırlama bağlantısı gönder
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-mist/58">
        <Link className="font-semibold text-emerald-200 hover:text-emerald-100" href="/login">
          Girişe dön
        </Link>
      </p>
    </div>
  );
}

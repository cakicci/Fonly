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
      <div className="glass-card mx-auto w-full max-w-md rounded-section p-6">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-300/15">
            <MailCheck className="h-6 w-6 text-emerald-200" />
          </span>
          <h1 className="mt-4 text-2xl font-semibold text-mist">Posta kutunu kontrol et</h1>
          <p className="mt-3 text-sm leading-6 text-mist-2">
            Eğer <span className="text-mist">{email}</span> adresi kayıtlıysa, şifre sıfırlama
            bağlantısını gönderdik. Bağlantı 1 saat geçerli. Gelen kutunda yoksa spam klasörüne bak.
          </p>
        </div>
        <Link
          href="/login"
          className="btn btn-lg btn-secondary mt-6 w-full"
        >
          <ArrowLeft className="h-4 w-4" />
          Girişe dön
        </Link>
      </div>
    );
  }

  return (
    <div className="glass-card mx-auto w-full max-w-md rounded-section p-6">
      <div className="mb-6">
        <p className="text-sm font-medium text-emerald-200">Şifre sıfırlama</p>
        <h1 className="mt-2 text-3xl font-semibold text-mist">Şifreni mi unuttun?</h1>
        <p className="mt-3 text-sm leading-6 text-mist-2">
          Hesabının e-posta adresini gir, sana sıfırlama bağlantısı gönderelim.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-sm font-medium text-mist-2">Email</span>
          <span className="mt-2 flex items-center gap-3 rounded-2xl border border-line bg-white/[0.04] px-4 py-3">
            <Mail className="h-5 w-5 text-mist-3" />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full bg-transparent text-mist outline-none placeholder:text-mist-3"
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
          className="btn btn-lg btn-primary w-full"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Sıfırlama bağlantısı gönder
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-mist-3">
        <Link className="font-semibold text-emerald-200 hover:text-emerald-100" href="/login">
          Girişe dön
        </Link>
      </p>
    </div>
  );
}

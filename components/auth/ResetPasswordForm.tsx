"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Loader2, LockKeyhole } from "lucide-react";

interface ResetPasswordFormProps {
  /** URL'deki ?token= değeri (server component'ten geçer). */
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Şifre en az 8 karakter olmalı.");
      return;
    }
    if (password !== confirm) {
      setError("Şifreler eşleşmiyor.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        setError(data?.message ?? "Şifre güncellenemedi. Lütfen tekrar dene.");
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setError("Bağlantı hatası. Lütfen tekrar dene.");
    } finally {
      setIsLoading(false);
    }
  }

  // Token yoksa form gösterme — bozuk/eksik bağlantı.
  if (!token) {
    return (
      <div className="glass-card mx-auto w-full max-w-md rounded-[1.75rem] p-6 text-center">
        <h1 className="text-2xl font-semibold text-white">Geçersiz bağlantı</h1>
        <p className="mt-3 text-sm leading-6 text-mist/64">
          Bu sıfırlama bağlantısı eksik veya hatalı. Lütfen yeni bir sıfırlama isteği oluştur.
        </p>
        <Link
          href="/forgot-password"
          className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-300 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-emerald-200"
        >
          Yeni bağlantı iste
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="glass-card mx-auto w-full max-w-md rounded-[1.75rem] p-6">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-300/15">
            <Check className="h-6 w-6 text-emerald-200" />
          </span>
          <h1 className="mt-4 text-2xl font-semibold text-white">Şifren güncellendi</h1>
          <p className="mt-3 text-sm leading-6 text-mist/64">
            Yeni şifrenle giriş yapabilirsin. Birazdan giriş sayfasına yönlendirileceksin.
          </p>
        </div>
        <Link
          href="/login"
          className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-300 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-emerald-200"
        >
          Girişe git
        </Link>
      </div>
    );
  }

  return (
    <div className="glass-card mx-auto w-full max-w-md rounded-[1.75rem] p-6">
      <div className="mb-6">
        <p className="text-sm font-medium text-emerald-200">Şifre sıfırlama</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Yeni şifre belirle</h1>
        <p className="mt-3 text-sm leading-6 text-mist/64">
          Hesabın için yeni bir şifre oluştur. En az 8 karakter olmalı.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-sm font-medium text-mist/72">Yeni şifre</span>
          <span className="mt-2 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
            <LockKeyhole className="h-5 w-5 text-mist/46" />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full bg-transparent text-white outline-none placeholder:text-mist/32"
              placeholder="En az 8 karakter"
            />
          </span>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-mist/72">Yeni şifre (tekrar)</span>
          <span className="mt-2 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
            <LockKeyhole className="h-5 w-5 text-mist/46" />
            <input
              type="password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full bg-transparent text-white outline-none placeholder:text-mist/32"
              placeholder="Şifreni tekrar gir"
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
          Şifreyi güncelle
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-mist/58">
        <Link className="inline-flex items-center gap-1 font-semibold text-emerald-200 hover:text-emerald-100" href="/login">
          <ArrowLeft className="h-3.5 w-3.5" />
          Girişe dön
        </Link>
      </p>
    </div>
  );
}

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
      <div className="glass-card mx-auto w-full max-w-md rounded-section p-6 text-center">
        <h1 className="text-2xl font-semibold text-mist">Geçersiz bağlantı</h1>
        <p className="mt-3 text-sm leading-6 text-mist-2">
          Bu sıfırlama bağlantısı eksik veya hatalı. Lütfen yeni bir sıfırlama isteği oluştur.
        </p>
        <Link
          href="/forgot-password"
          className="btn btn-lg btn-primary mt-6 w-full"
        >
          Yeni bağlantı iste
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="glass-card mx-auto w-full max-w-md rounded-section p-6">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-300/15">
            <Check className="h-6 w-6 text-emerald-200" />
          </span>
          <h1 className="mt-4 text-2xl font-semibold text-mist">Şifren güncellendi</h1>
          <p className="mt-3 text-sm leading-6 text-mist-2">
            Yeni şifrenle giriş yapabilirsin. Birazdan giriş sayfasına yönlendirileceksin.
          </p>
        </div>
        <Link
          href="/login"
          className="btn btn-lg btn-primary mt-6 w-full"
        >
          Girişe git
        </Link>
      </div>
    );
  }

  return (
    <div className="glass-card mx-auto w-full max-w-md rounded-section p-6">
      <div className="mb-6">
        <p className="text-sm font-medium text-emerald-200">Şifre sıfırlama</p>
        <h1 className="mt-2 text-3xl font-semibold text-mist">Yeni şifre belirle</h1>
        <p className="mt-3 text-sm leading-6 text-mist-2">
          Hesabın için yeni bir şifre oluştur. En az 8 karakter olmalı.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-sm font-medium text-mist-2">Yeni şifre</span>
          <span className="mt-2 flex items-center gap-3 rounded-2xl border border-line bg-white/[0.04] px-4 py-3">
            <LockKeyhole className="h-5 w-5 text-mist-3" />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full bg-transparent text-mist outline-none placeholder:text-mist-3"
              placeholder="En az 8 karakter"
            />
          </span>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-mist-2">Yeni şifre (tekrar)</span>
          <span className="mt-2 flex items-center gap-3 rounded-2xl border border-line bg-white/[0.04] px-4 py-3">
            <LockKeyhole className="h-5 w-5 text-mist-3" />
            <input
              type="password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full bg-transparent text-mist outline-none placeholder:text-mist-3"
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
          className="btn btn-lg btn-primary w-full"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Şifreyi güncelle
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-mist-3">
        <Link className="inline-flex items-center gap-1 font-semibold text-emerald-200 hover:text-emerald-100" href="/login">
          <ArrowLeft className="h-3.5 w-3.5" />
          Girişe dön
        </Link>
      </p>
    </div>
  );
}

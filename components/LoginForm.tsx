"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Chrome, Loader2, LockKeyhole, Mail } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false
    });

    setIsLoading(false);

    if (result?.error) {
      setError("Email veya şifre hatalı. Bilgilerini kontrol edip tekrar dene.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="glass-card mx-auto w-full max-w-md rounded-[1.75rem] p-6">
      <div className="mb-6">
        <p className="text-sm font-medium text-emerald-200">Fonly hesabına giriş</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Tekrar hoş geldin</h1>
        <p className="mt-3 text-sm leading-6 text-mist/64">
          Risk profilini ve kişisel rehberini görmek için hesabına giriş yap.
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

        <label className="block">
          <span className="text-sm font-medium text-mist/72">Şifre</span>
          <span className="mt-2 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
            <LockKeyhole className="h-5 w-5 text-mist/46" />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              className="w-full bg-transparent text-white outline-none placeholder:text-mist/32"
              placeholder="En az 8 karakter"
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
          Giriş Yap
        </button>
      </form>

      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
        className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-mist/14 bg-white/5 px-5 py-3 text-sm font-semibold text-mist transition hover:bg-white/10"
      >
        <Chrome className="h-4 w-4" />
        Google ile giriş yap
      </button>

      <p className="mt-5 text-center text-sm text-mist/58">
        Hesabın yok mu?{" "}
        <Link className="font-semibold text-emerald-200 hover:text-emerald-100" href="/register">
          Kayıt ol
        </Link>
      </p>
    </div>
  );
}

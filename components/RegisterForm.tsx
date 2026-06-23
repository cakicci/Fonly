"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Chrome, Loader2, LockKeyhole, Mail, UserRound } from "lucide-react";

interface RegisterFormProps {
  /** Google provider env'i dolu mu — false ise buton gizlenir. */
  googleEnabled?: boolean;
}

export function RegisterForm({ googleEnabled = false }: RegisterFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsLoading(true);

    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });

    const data = (await response.json().catch(() => null)) as { message?: string } | null;

    if (!response.ok) {
      setMessage(data?.message ?? "Kayıt oluşturulamadı. Bilgileri kontrol et.");
      setIsLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false
    });

    setIsLoading(false);

    if (result?.error) {
      router.push("/login");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="glass-card mx-auto w-full max-w-md rounded-[1.75rem] p-6">
      <div className="mb-6">
        <p className="text-sm font-medium text-emerald-200">Fonly hesabı oluştur</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Sade bir başlangıç yap</h1>
        <p className="mt-3 text-sm leading-6 text-mist/64">
          Hesabın, risk ve bütçe rehberini kişisel hale getirmek için kullanılacak.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-sm font-medium text-mist/72">Ad</span>
          <span className="mt-2 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
            <UserRound className="h-5 w-5 text-mist/46" />
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              minLength={2}
              className="w-full bg-transparent text-white outline-none placeholder:text-mist/32"
              placeholder="Adın"
            />
          </span>
        </label>

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

        {message ? (
          <p className="rounded-2xl border border-amber-200/14 bg-amber-300/10 px-4 py-3 text-sm text-amber-50">
            {message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-300 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Kayıt Ol
        </button>
      </form>

      {googleEnabled ? (
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-mist/14 bg-white/5 px-5 py-3 text-sm font-semibold text-mist transition hover:bg-white/10"
        >
          <Chrome className="h-4 w-4" />
          Google ile kayıt ol
        </button>
      ) : null}

      <p className="mt-5 text-center text-sm text-mist/58">
        Zaten hesabın var mı?{" "}
        <Link className="font-semibold text-emerald-200 hover:text-emerald-100" href="/login">
          Giriş yap
        </Link>
      </p>
    </div>
  );
}

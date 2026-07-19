"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Chrome, Loader2, LockKeyhole, Mail } from "lucide-react";

interface LoginFormProps {
  /** Google provider env'i dolu mu — false ise buton gizlenir. */
  googleEnabled?: boolean;
  /** NextAuth'un OAuth sonrası yönlendirdiği ?error= kodu. */
  oauthError?: string;
  /** Giriş sonrası dönülecek sayfa (middleware ?callbackUrl= ile ekler). */
  callbackUrl?: string;
}

/** OAuth (Google) hata kodlarını kullanıcıya Türkçe mesaja çevirir. */
function oauthErrorMessage(code: string | undefined): string {
  if (!code) return "";
  switch (code) {
    case "OAuthAccountNotLinked":
      return "Bu e-posta başka bir giriş yöntemiyle kayıtlı. Önce e-posta ve şifrenle giriş yap.";
    case "AccessDenied":
      return "Google girişine izin verilmedi.";
    default:
      return "Google ile giriş yapılamadı. Lütfen tekrar dene.";
  }
}

export function LoginForm({ googleEnabled = false, oauthError, callbackUrl }: LoginFormProps) {
  const router = useRouter();
  const target = callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(() => oauthErrorMessage(oauthError));
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
      setError(
        result.code === "rate_limited"
          ? "Çok fazla giriş denemesi yaptın. Güvenlik için birkaç dakika bekleyip tekrar dene."
          : "Email veya şifre hatalı. Bilgilerini kontrol edip tekrar dene."
      );
      return;
    }

    router.push(target);
    router.refresh();
  }

  return (
    <div className="glass-card mx-auto w-full max-w-md rounded-section p-6">
      <div className="mb-6">
        <p className="text-sm font-medium text-emerald-200">Fonly hesabına giriş</p>
        <h1 className="mt-2 text-3xl font-semibold text-mist">Tekrar hoş geldin</h1>
        <p className="mt-3 text-sm leading-6 text-mist-2">
          Risk profilini ve kişisel rehberini görmek için hesabına giriş yap.
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

        <label className="block">
          <span className="text-sm font-medium text-mist-2">Şifre</span>
          <span className="mt-2 flex items-center gap-3 rounded-2xl border border-line bg-white/[0.04] px-4 py-3">
            <LockKeyhole className="h-5 w-5 text-mist-3" />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              className="w-full bg-transparent text-mist outline-none placeholder:text-mist-3"
              placeholder="En az 8 karakter"
            />
          </span>
        </label>

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-mist-3 transition hover:text-emerald-200"
          >
            Şifreni mi unuttun?
          </Link>
        </div>

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
          Giriş Yap
        </button>
      </form>

      {googleEnabled ? (
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: target })}
          className="btn btn-lg btn-secondary mt-3 w-full"
        >
          <Chrome className="h-4 w-4" />
          Google ile giriş yap
        </button>
      ) : null}

      <p className="mt-5 text-center text-sm text-mist-3">
        Hesabın yok mu?{" "}
        <Link className="font-semibold text-emerald-200 hover:text-emerald-100" href="/register">
          Kayıt ol
        </Link>
      </p>
    </div>
  );
}

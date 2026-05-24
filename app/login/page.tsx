import Link from "next/link";
import Image from "next/image";
import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col px-4 py-6 sm:px-6 lg:px-8">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between">
        <Link href="/" className="flex items-center gap-3" aria-label="Fonly ana sayfa">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/8 p-1 shadow-glow">
            <Image src="/fonly-logo.png" alt="Fonly logosu" width={32} height={32} className="h-8 w-8 object-contain" />
          </span>
          <span className="text-xl font-semibold text-white">Fonly</span>
        </Link>
        <Link className="text-sm font-medium text-mist/64 transition hover:text-white" href="/">
          Ana sayfa
        </Link>
      </header>
      <section className="flex flex-1 items-center justify-center py-10">
        <LoginForm />
      </section>
    </main>
  );
}

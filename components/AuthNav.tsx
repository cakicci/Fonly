import Link from "next/link";
import { LogIn, LogOut, UserRound } from "lucide-react";
import { auth, signOut } from "@/auth";

export async function AuthNav() {
  const session = await auth();

  if (!session?.user) {
    return (
      <Link
        href="/login"
        className="btn btn-sm btn-secondary px-4"
      >
        <LogIn className="h-4 w-4" />
        Giriş Yap
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/dashboard"
        className="hidden items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-2 text-sm text-mist-2 transition hover:text-white sm:inline-flex"
      >
        <UserRound className="h-4 w-4" />
        {session.user.name ?? session.user.email ?? "Hesabım"}
      </Link>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}
      >
        <button className="btn btn-sm btn-secondary px-4">
          <LogOut className="h-4 w-4" />
          Çıkış Yap
        </button>
      </form>
    </div>
  );
}

"use client";

import { Sparkles } from "lucide-react";
import { useSession } from "next-auth/react";

/**
 * Header/profil alanında premium kullanıcılar için gösterilecek küçük rozet.
 * Premium değilse veya auth yoksa hiçbir şey render etmez.
 */
export function PremiumBadge() {
  const { data: session } = useSession();
  if (session?.user?.isPremium !== true) return null;

  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-fuchsia-300/20 to-emerald-300/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-fuchsia-100">
      <Sparkles className="h-2.5 w-2.5" />
      Premium
    </span>
  );
}

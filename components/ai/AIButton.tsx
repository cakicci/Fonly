"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { Lock, Sparkles } from "lucide-react";
import { UpgradeModal } from "@/components/billing/UpgradeModal";
import { AIDrawer } from "./AIDrawer";
import type { AIContext, AIPromptType } from "./types";

export interface AIButtonProps {
  type:    AIPromptType;
  context: AIContext;
  label:   string;
  /** "sm" daha kompakt — toolbar içi kullanım için. */
  size?:    "sm" | "md";
  /** "primary" gradient + ikon, "ghost" sade. */
  variant?: "primary" | "ghost";
  /** İkon sağa konumlansın mı (toolbar'da padding düzgün dursun diye). */
  iconRight?: boolean;
}

/**
 * Premium-aware AI tetikleyici buton.
 *
 *  - Anonim kullanıcı → /login'e yönlendirir
 *  - Free kullanıcı   → UpgradeModal açar
 *  - Premium          → AIDrawer açar (Faz 12 öncesi: stub içerik)
 */
export function AIButton({
  type, context, label,
  size = "md", variant = "primary",
  iconRight = false,
}: AIButtonProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [drawerOpen,  setDrawerOpen]  = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const onClick = () => {
    if (status === "loading") return;
    if (!session?.user) {
      router.push("/login");
      return;
    }
    if (session.user.isPremium !== true) {
      setUpgradeOpen(true);
      return;
    }
    setDrawerOpen(true);
  };

  const sizeCls = size === "sm"
    ? "px-2.5 py-1 text-[11px]"
    : "px-3 py-1.5 text-xs";

  const variantCls = variant === "primary"
    ? "border-fuchsia-300/30 bg-gradient-to-r from-fuchsia-300/12 to-emerald-300/12 text-fuchsia-100 hover:from-fuchsia-300/22 hover:to-emerald-300/22"
    : "border-white/8 bg-white/[0.02] text-mist/55 hover:bg-white/[0.05] hover:text-white";

  const showLock = status !== "loading"
    && session?.user
    && session.user.isPremium !== true;

  return (
    <>
      <button
        onClick={onClick}
        title={showLock ? "Premium özellik — yükseltmek için tıkla" : label}
        className={`inline-flex items-center gap-1.5 rounded-xl border font-semibold transition ${sizeCls} ${variantCls}`}
      >
        {!iconRight && <Sparkles className="h-3.5 w-3.5" />}
        <span>{label}</span>
        {showLock && <Lock className="h-3 w-3 opacity-60" />}
        {iconRight && <Sparkles className="h-3.5 w-3.5" />}
      </button>

      {drawerOpen && (
        <AIDrawer
          type={type}
          context={context}
          label={label}
          onClose={() => setDrawerOpen(false)}
        />
      )}
      {upgradeOpen && (
        <UpgradeModal feature={label} onClose={() => setUpgradeOpen(false)} />
      )}
    </>
  );
}

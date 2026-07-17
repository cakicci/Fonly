"use client";

import { ReactNode, useState } from "react";
import { useSession } from "next-auth/react";
import { Lock, Sparkles } from "lucide-react";
import { UpgradeModal } from "./UpgradeModal";

interface PremiumGateProps {
  /** Yükseltme modal'ında gösterilecek özellik adı. */
  feature: string;
  children: ReactNode;
  /**
   * true → içerik blur'lu render edilir, üstüne kilit overlay binder.
   * false (varsayılan) → sadece kilit butonu gösterilir, içerik render edilmez.
   */
  preview?: boolean;
}

/**
 * Premium-only içeriği saran wrapper.
 *
 * Kullanım:
 *   <PremiumGate feature="AI Şirket Özeti">
 *     <AISummaryCard ... />
 *   </PremiumGate>
 */
export function PremiumGate({ feature, children, preview = false }: PremiumGateProps) {
  const { data: session, status } = useSession();
  const [modalOpen, setModalOpen] = useState(false);

  // Auth yükleniyor — boş ver, hiçbir şey gösterme (flash önler)
  if (status === "loading") return null;

  const isPremium = session?.user?.isPremium === true;
  if (isPremium) return <>{children}</>;

  return (
    <>
      <div className="relative">
        {preview && (
          <div className="pointer-events-none select-none blur-[6px] opacity-60">
            {children}
          </div>
        )}
        <div
          className={
            preview
              ? "absolute inset-0 flex items-center justify-center"
              : "flex items-center justify-center"
          }
        >
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-fuchsia-300/30 bg-gradient-to-r from-fuchsia-300/10 to-emerald-300/10 px-4 py-2.5 text-sm font-semibold text-fuchsia-100 transition hover:from-fuchsia-300/20 hover:to-emerald-300/20"
          >
            <Lock className="h-3.5 w-3.5" />
            <Sparkles className="h-3.5 w-3.5" />
            <span>{feature}</span>
            <span className="text-mist-3">·</span>
            <span className="text-mist-2">Premium</span>
          </button>
        </div>
      </div>
      {modalOpen && (
        <UpgradeModal feature={feature} onClose={() => setModalOpen(false)} />
      )}
    </>
  );
}

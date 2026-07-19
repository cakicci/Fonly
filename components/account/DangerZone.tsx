"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Download, Trash2, Loader2, AlertTriangle } from "lucide-react";

const CONFIRM_WORD = "SİL";

export function DangerZone() {
  const [confirm, setConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function deleteAccount() {
    if (confirm.trim().toUpperCase() !== CONFIRM_WORD) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch("/api/user", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.message ?? "Hesap silinemedi.");
        setDeleting(false);
        return;
      }
      await signOut({ callbackUrl: "/" });
    } catch {
      setError("Bağlantı hatası.");
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Veri indir */}
      <div className="glass-card flex flex-col gap-3 rounded-2xl p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-mist">Verilerimi indir</p>
          <p className="mt-1 text-xs text-mist-3">
            Hesabına ait tüm veriyi (profil, izleme listesi, alarmlar, portföy) JSON olarak indir.
          </p>
        </div>
        <a
          href="/api/user/export"
          className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-line bg-white/[0.04] px-4 py-2 text-sm font-medium text-mist-2 transition hover:bg-white/[0.08]"
        >
          <Download className="h-4 w-4" />
          İndir (JSON)
        </a>
      </div>

      {/* Hesap sil */}
      <div className="rounded-2xl border border-rose-300/25 bg-rose-300/[0.04] p-6">
        <div className="flex items-center gap-2 text-rose-200">
          <AlertTriangle className="h-4 w-4" />
          <h2 className="text-sm font-semibold">Hesabı sil</h2>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-mist-3">
          Bu işlem geri alınamaz. Profilin, izleme listen, alarmların, portföyün ve aboneliğin
          kalıcı olarak silinir. Onaylamak için aşağıya <strong className="text-rose-200">{CONFIRM_WORD}</strong> yaz.
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={CONFIRM_WORD}
            className="w-full rounded-xl border border-rose-300/20 bg-ink px-3 py-2 text-sm text-mist outline-none focus:border-rose-300/50 sm:max-w-[140px]"
          />
          <button
            onClick={deleteAccount}
            disabled={confirm.trim().toUpperCase() !== CONFIRM_WORD || deleting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-400/90 px-4 py-2 text-sm font-semibold text-mist transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Hesabı kalıcı olarak sil
          </button>
        </div>

        {error && <p className="mt-3 text-xs text-rose-300">{error}</p>}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Loader2, Check, KeyRound, ShieldCheck } from "lucide-react";

interface SecuritySectionProps {
  /** Kullanıcının zaten bir şifresi var mı (Credentials). Yoksa OAuth-only → ilk şifre belirleme. */
  hasPassword: boolean;
  /** Google hesabı bağlı mı (bilgilendirme). */
  googleConnected: boolean;
}

export function SecuritySection({ hasPassword, googleConnected }: SecuritySectionProps) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setDone(false);

    if (next.length < 8) return setError("Yeni şifre en az 8 karakter olmalı.");
    if (next !== confirm) return setError("Yeni şifreler eşleşmiyor.");
    if (hasPassword && !current) return setError("Mevcut şifreni gir.");

    setSaving(true);
    try {
      const res = await fetch("/api/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: hasPassword ? current : undefined,
          newPassword: next,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.message ?? "Şifre güncellenemedi.");
        return;
      }
      setDone(true);
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="glass-card rounded-2xl p-6 ring-1 ring-white/8">
        <div className="flex items-center gap-2 text-white">
          <KeyRound className="h-4 w-4 text-emerald-200" />
          <h2 className="text-sm font-semibold">{hasPassword ? "Şifre değiştir" : "Şifre belirle"}</h2>
        </div>
        {!hasPassword && (
          <p className="mt-2 text-xs text-mist/55">
            Hesabın Google ile açılmış. Bir şifre belirlersen e-posta + şifre ile de giriş yapabilirsin.
          </p>
        )}

        <div className="mt-5 grid gap-4 sm:max-w-md">
          {hasPassword && (
            <label className="text-xs text-mist/55">
              Mevcut şifre
              <input
                type="password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                autoComplete="current-password"
                className="mt-1 w-full rounded-xl border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none focus:border-emerald-300/40"
              />
            </label>
          )}
          <label className="text-xs text-mist/55">
            Yeni şifre
            <input
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              autoComplete="new-password"
              className="mt-1 w-full rounded-xl border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none focus:border-emerald-300/40"
            />
          </label>
          <label className="text-xs text-mist/55">
            Yeni şifre (tekrar)
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              className="mt-1 w-full rounded-xl border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none focus:border-emerald-300/40"
            />
          </label>
        </div>

        {error && <p className="mt-3 text-xs text-rose-300">{error}</p>}
        {done && <p className="mt-3 text-xs text-emerald-300">Şifren güncellendi.</p>}

        <button
          type="submit"
          disabled={saving}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-300/85 px-4 py-2 text-sm font-semibold text-ink transition hover:bg-emerald-200 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : done ? <Check className="h-4 w-4" /> : null}
          {hasPassword ? "Şifreyi güncelle" : "Şifre belirle"}
        </button>
      </form>

      <div className="glass-card flex items-center gap-3 rounded-2xl p-5 ring-1 ring-white/8">
        <ShieldCheck className={`h-5 w-5 ${googleConnected ? "text-emerald-200" : "text-mist/35"}`} />
        <div>
          <p className="text-sm font-medium text-white">Google hesabı</p>
          <p className="text-xs text-mist/50">
            {googleConnected ? "Bağlı — Google ile giriş yapabilirsin." : "Bağlı değil."}
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Loader2, Check } from "lucide-react";

interface ProfileSectionProps {
  initialName: string;
  email: string;
}

/** İsim baş harflerinden avatar. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ProfileSection({ initialName, email }: ProfileSectionProps) {
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = name.trim() !== initialName.trim();

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!dirty) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.message ?? "Kaydedilemedi.");
        return;
      }
      setSaved(true);
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="glass-card rounded-2xl p-6 ring-1 ring-white/8">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-300/30 to-cyan-300/20 text-xl font-semibold text-white">
          {initials(name || email)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">{name || "—"}</p>
          <p className="truncate text-xs text-mist/50">{email}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:max-w-md">
        <label className="text-xs text-mist/55">
          Ad
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSaved(false);
            }}
            maxLength={80}
            className="mt-1 w-full rounded-xl border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none focus:border-emerald-300/40"
          />
        </label>

        <label className="text-xs text-mist/40">
          E-posta
          <input
            value={email}
            disabled
            className="mt-1 w-full cursor-not-allowed rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2 text-sm text-mist/50"
          />
          <span className="mt-1 block text-[11px] text-mist/35">
            E-posta değişikliği şimdilik desteklenmiyor.
          </span>
        </label>
      </div>

      {error && <p className="mt-3 text-xs text-rose-300">{error}</p>}

      <button
        type="submit"
        disabled={!dirty || saving}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-300/85 px-4 py-2 text-sm font-semibold text-ink transition hover:bg-emerald-200 disabled:opacity-50"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null}
        {saved && !dirty ? "Kaydedildi" : "Kaydet"}
      </button>
    </form>
  );
}

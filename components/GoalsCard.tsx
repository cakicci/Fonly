"use client";

import { useState } from "react";
import { Target, Plus, Trash2, Loader2, X, Check } from "lucide-react";

export interface GoalDTO {
  id: string;
  title: string;
  target: number;
  targetDate: string | null;
}

interface GoalsCardProps {
  initialGoals: GoalDTO[];
  /** Canlı portföy değeri — ilerleme bunun üzerinden hesaplanır. */
  portfolioValue: number;
  /** Aylık ayrılabilir tutar (varsa) — tempo tahmini için. */
  monthlySuggested: number | null;
}

function formatLira(value: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(iso)
  );
}

export function GoalsCard({ initialGoals, portfolioValue, monthlySuggested }: GoalsCardProps) {
  const [goals, setGoals] = useState<GoalDTO[]>(initialGoals);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [date, setDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const t = title.trim();
    const amount = Number(target.replace(/[^\d]/g, ""));
    if (!t) return setError("Hedef adı gir.");
    if (!Number.isFinite(amount) || amount <= 0) return setError("Geçerli bir tutar gir.");

    setSubmitting(true);
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: t,
          target: amount,
          targetDate: date ? new Date(date).toISOString() : undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.message ?? "Eklenemedi.");
        return;
      }
      setGoals((prev) => [data.goal, ...prev]);
      setTitle("");
      setTarget("");
      setDate("");
      setOpen(false);
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/goals?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (res.ok) setGoals((prev) => prev.filter((g) => g.id !== id));
    } catch {
      /* sessizce geç */
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <article className="glass-card rounded-[1.5rem] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-emerald-200" />
          <h3 className="text-sm font-semibold text-white">Hedeflerim</h3>
          {goals.length > 0 && <span className="text-xs text-mist/40">({goals.length})</span>}
        </div>
        <button
          onClick={() => {
            setOpen((v) => !v);
            setError(null);
          }}
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-200 transition hover:text-emerald-100"
        >
          {open ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {open ? "Vazgeç" : "Hedef ekle"}
        </button>
      </div>

      {open && (
        <form onSubmit={submit} className="mb-4 grid gap-2.5 rounded-2xl border border-white/8 bg-white/[0.03] p-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Hedef adı (örn. Acil durum fonu)"
            maxLength={60}
            className="w-full rounded-xl border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none focus:border-emerald-300/40"
          />
          <div className="grid gap-2.5 sm:grid-cols-2">
            <input
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              inputMode="numeric"
              placeholder="Hedef tutar (₺)"
              className="w-full rounded-xl border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none focus:border-emerald-300/40"
            />
            <input
              value={date}
              onChange={(e) => setDate(e.target.value)}
              type="date"
              className="w-full rounded-xl border border-white/10 bg-ink px-3 py-2 text-sm text-mist outline-none focus:border-emerald-300/40"
            />
          </div>
          {error && <p className="text-xs text-rose-300">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-300/85 px-4 py-2 text-sm font-semibold text-ink transition hover:bg-emerald-200 disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Hedefi kaydet
          </button>
        </form>
      )}

      {goals.length > 0 ? (
        <ul className="space-y-3">
          {goals.map((g) => {
            const reached = portfolioValue >= g.target;
            const pct = g.target > 0 ? Math.min((portfolioValue / g.target) * 100, 100) : 0;
            const remaining = Math.max(g.target - portfolioValue, 0);
            const months =
              !reached && monthlySuggested && monthlySuggested > 0
                ? Math.ceil(remaining / monthlySuggested)
                : null;

            return (
              <li key={g.id} className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{g.title}</p>
                    <p className="mt-0.5 text-[11px] tabular-nums text-mist/50">
                      {formatLira(portfolioValue >= g.target ? g.target : portfolioValue)} /{" "}
                      {formatLira(g.target)}
                      {g.targetDate && ` · ${formatDate(g.targetDate)}`}
                    </p>
                  </div>
                  <button
                    onClick={() => remove(g.id)}
                    disabled={deletingId === g.id}
                    aria-label="Hedefi sil"
                    className="shrink-0 rounded-lg p-1.5 text-mist/40 transition hover:bg-rose-300/10 hover:text-rose-300 disabled:opacity-50"
                  >
                    {deletingId === g.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>

                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className={`h-full rounded-full transition-all ${reached ? "bg-emerald-300" : "bg-emerald-300/70"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-mist/55">
                  {reached ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-300" />
                      <span className="text-emerald-300">Hedefe ulaşıldı</span>
                    </>
                  ) : (
                    <>
                      <span className="tabular-nums text-mist/65">%{pct.toFixed(0)}</span>
                      <span>· kalan {formatLira(remaining)}</span>
                      {months != null && <span>· bu tempoyla ~{months} ay</span>}
                    </>
                  )}
                </p>
              </li>
            );
          })}
        </ul>
      ) : (
        !open && (
          <p className="text-xs leading-5 text-mist/50">
            Bir birikim hedefi koy (örn. &quot;1 yılda 100.000 ₺&quot;), portföyün ilerledikçe ne kadar
            yaklaştığını burada gör.
          </p>
        )
      )}
    </article>
  );
}

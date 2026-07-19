"use client";

import { useState } from "react";
import { Landmark, Plus, Trash2, Loader2, X } from "lucide-react";

export interface OtherAssetDTO {
  id: number;
  name: string;
  kind: "asset" | "liability" | string;
  value: number;
}

interface NetWorthCardProps {
  initialItems: OtherAssetDTO[];
  /** Canlı portföy değeri — net değere dahil edilir. */
  portfolioValue: number;
}

function formatLira(value: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(value);
}

export function NetWorthCard({ initialItems, portfolioValue }: NetWorthCardProps) {
  const [items, setItems] = useState<OtherAssetDTO[]>(initialItems);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<"asset" | "liability">("asset");
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const otherAssetsTotal = items
    .filter((i) => i.kind === "asset")
    .reduce((sum, i) => sum + i.value, 0);
  const liabilitiesTotal = items
    .filter((i) => i.kind === "liability")
    .reduce((sum, i) => sum + i.value, 0);
  const netWorth = portfolioValue + otherAssetsTotal - liabilitiesTotal;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const n = name.trim();
    const amount = Number(value.replace(/[^\d.,]/g, "").replace(",", "."));
    if (!n) return setError("Ad gir.");
    if (!Number.isFinite(amount) || amount <= 0) return setError("Geçerli bir tutar gir.");

    setSubmitting(true);
    try {
      const res = await fetch("/api/net-worth", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name: n, kind, value: amount }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.message ?? "Eklenemedi.");
        return;
      }
      setItems((prev) => [data.item, ...prev]);
      setName("");
      setValue("");
      setKind("asset");
      setOpen(false);
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(id: number) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/net-worth?id=${id}`, { method: "DELETE" });
      if (res.ok) setItems((prev) => prev.filter((i) => i.id !== id));
    } catch {
      /* sessizce geç */
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <article className="glass-card rounded-panel p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Landmark className="h-4 w-4 text-emerald-200" />
          <h3 className="text-sm font-semibold text-mist">Net Değer</h3>
        </div>
        <button
          onClick={() => {
            setOpen((v) => !v);
            setError(null);
          }}
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-200 transition hover:text-emerald-100"
        >
          {open ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {open ? "Vazgeç" : "Kalem ekle"}
        </button>
      </div>

      <p className="text-2xl font-semibold tabular-nums text-mist">{formatLira(netWorth)}</p>
      <p className="mt-1 text-[11px] text-mist-3">
        Portföy {formatLira(portfolioValue)}
        {otherAssetsTotal > 0 && ` + diğer varlıklar ${formatLira(otherAssetsTotal)}`}
        {liabilitiesTotal > 0 && ` − borçlar ${formatLira(liabilitiesTotal)}`}
      </p>

      {open && (
        <form onSubmit={submit} className="mt-4 grid gap-2.5 rounded-2xl border border-line bg-white/[0.03] p-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Kalem adı (örn. Ev, Nakit, Kredi kartı borcu)"
            maxLength={60}
            className="w-full rounded-xl border border-line bg-ink px-3 py-2 text-sm text-mist outline-none focus:border-emerald-300/40"
          />
          <div className="grid gap-2.5 sm:grid-cols-2">
            <div className="inline-flex rounded-xl border border-line p-0.5" role="group" aria-label="Tür">
              <button
                type="button"
                onClick={() => setKind("asset")}
                className={`flex-1 rounded-[10px] px-3 py-1.5 text-xs font-semibold transition ${
                  kind === "asset" ? "bg-emerald-300/85 text-ink-fixed" : "text-mist-3 hover:text-mist"
                }`}
              >
                Varlık
              </button>
              <button
                type="button"
                onClick={() => setKind("liability")}
                className={`flex-1 rounded-[10px] px-3 py-1.5 text-xs font-semibold transition ${
                  kind === "liability" ? "bg-rose-300/85 text-ink-fixed" : "text-mist-3 hover:text-mist"
                }`}
              >
                Borç
              </button>
            </div>
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              inputMode="decimal"
              placeholder="Tutar (₺)"
              className="w-full rounded-xl border border-line bg-ink px-3 py-2 text-sm text-mist outline-none focus:border-emerald-300/40"
            />
          </div>
          {error && <p className="text-xs text-rose-300">{error}</p>}
          <button type="submit" disabled={submitting} className="btn btn-sm btn-primary">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Kaydet
          </button>
        </form>
      )}

      {items.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {items.map((i) => (
            <li
              key={i.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-line bg-white/[0.02] px-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <span
                  className={`mr-2 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                    i.kind === "liability"
                      ? "bg-rose-300/12 text-rose-200"
                      : "bg-emerald-300/12 text-emerald-200"
                  }`}
                >
                  {i.kind === "liability" ? "Borç" : "Varlık"}
                </span>
                <span className="truncate text-mist">{i.name}</span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="tabular-nums text-mist-2">{formatLira(i.value)}</span>
                <button
                  onClick={() => remove(i.id)}
                  disabled={deletingId === i.id}
                  aria-label="Kalemi sil"
                  className="rounded-lg p-1.5 text-mist-3 transition hover:bg-rose-300/10 hover:text-rose-300 disabled:opacity-50"
                >
                  {deletingId === i.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        !open && (
          <p className="mt-4 text-xs leading-5 text-mist-3">
            Ev, nakit, mevduat gibi portföy dışı varlıklarını ve kredi/kart borçlarını ekle —
            gerçek net değerini gör.
          </p>
        )
      )}
    </article>
  );
}

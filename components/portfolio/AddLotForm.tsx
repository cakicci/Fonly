"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { CURRENCIES } from "@/data/currencies";
import { GOLD_TYPES } from "@/data/gold-types";
import { BIST_TICKERS } from "@/data/bist-tickers";
import { ASSET_TYPE_LABELS, type AssetType } from "@/lib/portfolio/asset";

interface AddLotFormProps {
  onAdded: () => void;
}

const TYPES: AssetType[] = ["hisse", "doviz", "altin", "fon"];

export function AddLotForm({ onAdded }: AddLotFormProps) {
  const [type, setType] = useState<AssetType>("hisse");
  const [code, setCode] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function changeType(t: AssetType) {
    setType(t);
    setCode("");
    setError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const qty = Number(quantity.replace(",", "."));
    const cost = Number(unitCost.replace(",", "."));
    if (!code.trim()) return setError("Varlık seç.");
    if (!Number.isFinite(qty) || qty <= 0) return setError("Geçerli bir adet gir.");
    if (!Number.isFinite(cost) || cost < 0) return setError("Geçerli bir maliyet gir.");

    const slug = `${type}-${code.trim()}`;
    setSubmitting(true);
    try {
      const res = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, quantity: qty, unitCost: cost }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.message ?? "Eklenemedi.");
        return;
      }
      setCode("");
      setQuantity("");
      setUnitCost("");
      onAdded();
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="glass-card rounded-2xl p-5 ring-1 ring-white/8">
      <h2 className="text-sm font-semibold text-white">Alım ekle</h2>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Tip */}
        <label className="text-xs text-mist/55">
          Tür
          <select
            value={type}
            onChange={(e) => changeType(e.target.value as AssetType)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none focus:border-emerald-300/40"
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {ASSET_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </label>

        {/* Varlık seçici */}
        <label className="text-xs text-mist/55">
          Varlık
          {type === "altin" ? (
            <select
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none focus:border-emerald-300/40"
            >
              <option value="">Seç…</option>
              {GOLD_TYPES.map((g) => (
                <option key={g.type} value={g.type}>
                  {g.name}
                </option>
              ))}
            </select>
          ) : (
            <>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                list={type === "fon" ? undefined : `assets-${type}`}
                placeholder={type === "fon" ? "Fon kodu (örn. AAK)" : "Ara / seç…"}
                className="mt-1 w-full rounded-xl border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none focus:border-emerald-300/40"
              />
              {type === "hisse" && (
                <datalist id="assets-hisse">
                  {BIST_TICKERS.map((t) => (
                    <option key={t.symbol} value={t.symbol}>
                      {t.name}
                    </option>
                  ))}
                </datalist>
              )}
              {type === "doviz" && (
                <datalist id="assets-doviz">
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </datalist>
              )}
            </>
          )}
        </label>

        {/* Adet */}
        <label className="text-xs text-mist/55">
          Adet / birim
          <input
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            inputMode="decimal"
            placeholder="0"
            className="mt-1 w-full rounded-xl border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none focus:border-emerald-300/40"
          />
        </label>

        {/* Birim maliyet */}
        <label className="text-xs text-mist/55">
          Alış fiyatı (₺)
          <input
            value={unitCost}
            onChange={(e) => setUnitCost(e.target.value)}
            inputMode="decimal"
            placeholder="0,00"
            className="mt-1 w-full rounded-xl border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none focus:border-emerald-300/40"
          />
        </label>
      </div>

      {error && <p className="mt-3 text-xs text-rose-300">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-300/85 px-4 py-2 text-sm font-semibold text-ink transition hover:bg-emerald-200 disabled:opacity-60"
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Ekle
      </button>
    </form>
  );
}

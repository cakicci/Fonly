"use client";

import { useState } from "react";
import { Plus, Loader2, TriangleAlert } from "lucide-react";
import { CURRENCIES } from "@/data/currencies";
import { GOLD_TYPES } from "@/data/gold-types";
import { BIST_TICKERS } from "@/data/bist-tickers";
import { ASSET_TYPE_LABELS, type AssetType } from "@/lib/portfolio/asset";
import type { Position } from "@/lib/portfolio/aggregate";

interface AddLotFormProps {
  onAdded: () => void;
  /** Guardrail uyarısı için: açık pozisyonlar ve toplam portföy değeri. */
  openPositions?: Position[];
  portfolioValue?: number;
  /** true ise işlem deneme portföyüne eklenir — gerçek K/Z'yi etkilemez. */
  isDemo?: boolean;
}

const TYPES: AssetType[] = ["hisse", "doviz", "altin", "fon"];

/** Bu yüzdenin üzerinde tek varlık ağırlığı → alım öncesi onay iste. */
const CONCENTRATION_WARN_PCT = 50;

export function AddLotForm({ onAdded, openPositions = [], portfolioValue = 0, isDemo = false }: AddLotFormProps) {
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [type, setType] = useState<AssetType>("hisse");
  const [code, setCode] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Guardrail onayı bekleyen işlemin tahmini yoğunlaşma yüzdesi. */
  const [confirmPct, setConfirmPct] = useState<number | null>(null);

  function changeType(t: AssetType) {
    setType(t);
    setCode("");
    setError(null);
    setConfirmPct(null);
  }

  /**
   * Bu alımdan sonra tek bir varlığın portföy içindeki tahmini ağırlığı.
   * Kullanıcının ilk pozisyonuysa (başka değerli varlık yoksa) uyarmaz —
   * herkesin ilk işlemi zaten %100'dür, bu bir risk sinyali değildir.
   */
  function projectedConcentrationPct(slug: string, qty: number, cost: number): number | null {
    const newValue = qty * cost;
    if (newValue <= 0) return null;
    const existing = openPositions.find(p => p.slug === slug)?.value ?? 0;
    const otherValue = Math.max(portfolioValue - existing, 0);
    if (otherValue <= 0) return null;
    const projectedTotal = otherValue + existing + newValue;
    if (projectedTotal <= 0) return null;
    return ((existing + newValue) / projectedTotal) * 100;
  }

  async function performSubmit(slug: string, qty: number, cost: number) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, side, quantity: qty, unitCost: cost, isDemo }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.message ?? "Eklenemedi.");
        return;
      }
      setCode("");
      setQuantity("");
      setUnitCost("");
      setConfirmPct(null);
      onAdded();
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setSubmitting(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const qty = Number(quantity.replace(",", "."));
    const cost = Number(unitCost.replace(",", "."));
    if (!code.trim()) return setError("Varlık seç.");
    if (!Number.isFinite(qty) || qty <= 0) return setError("Geçerli bir adet gir.");
    if (!Number.isFinite(cost) || cost < 0) return setError("Geçerli bir fiyat gir.");

    const slug = `${type}-${code.trim()}`;

    if (side === "buy") {
      const concentration = projectedConcentrationPct(slug, qty, cost);
      if (concentration != null && concentration >= CONCENTRATION_WARN_PCT) {
        setConfirmPct(concentration);
        return;
      }
    }

    await performSubmit(slug, qty, cost);
  }

  function confirmAnyway() {
    const qty = Number(quantity.replace(",", "."));
    const cost = Number(unitCost.replace(",", "."));
    performSubmit(`${type}-${code.trim()}`, qty, cost);
  }

  return (
    <form onSubmit={submit} className="glass-card rounded-2xl p-5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold text-mist">İşlem ekle</h2>
        <div className="flex rounded-xl border border-line p-0.5" role="group" aria-label="İşlem yönü">
          <button
            type="button"
            onClick={() => { setSide("buy"); setConfirmPct(null); }}
            className={`rounded-[10px] px-3 py-1 text-xs font-semibold transition ${
              side === "buy" ? "bg-emerald-300/85 text-ink-fixed" : "text-mist-3 hover:text-mist"
            }`}
          >
            Alış
          </button>
          <button
            type="button"
            onClick={() => { setSide("sell"); setConfirmPct(null); }}
            className={`rounded-[10px] px-3 py-1 text-xs font-semibold transition ${
              side === "sell" ? "bg-rose-300/85 text-ink-fixed" : "text-mist-3 hover:text-mist"
            }`}
          >
            Satış
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Tip */}
        <label className="text-xs text-mist-3">
          Tür
          <select
            value={type}
            onChange={(e) => changeType(e.target.value as AssetType)}
            className="mt-1 w-full rounded-xl border border-line bg-ink px-3 py-2 text-sm text-mist outline-none focus:border-emerald-300/40"
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {ASSET_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </label>

        {/* Varlık seçici */}
        <label className="text-xs text-mist-3">
          Varlık
          {type === "altin" ? (
            <select
              value={code}
              onChange={(e) => { setCode(e.target.value); setConfirmPct(null); }}
              className="mt-1 w-full rounded-xl border border-line bg-ink px-3 py-2 text-sm text-mist outline-none focus:border-emerald-300/40"
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
                onChange={(e) => { setCode(e.target.value.toUpperCase()); setConfirmPct(null); }}
                list={type === "fon" ? undefined : `assets-${type}`}
                placeholder={type === "fon" ? "Fon kodu (örn. AAK)" : "Ara / seç…"}
                className="mt-1 w-full rounded-xl border border-line bg-ink px-3 py-2 text-sm text-mist outline-none focus:border-emerald-300/40"
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
        <label className="text-xs text-mist-3">
          Adet / birim
          <input
            value={quantity}
            onChange={(e) => { setQuantity(e.target.value); setConfirmPct(null); }}
            inputMode="decimal"
            placeholder="0"
            className="mt-1 w-full rounded-xl border border-line bg-ink px-3 py-2 text-sm text-mist outline-none focus:border-emerald-300/40"
          />
        </label>

        {/* Birim fiyat */}
        <label className="text-xs text-mist-3">
          {side === "buy" ? "Alış fiyatı (₺)" : "Satış fiyatı (₺)"}
          <input
            value={unitCost}
            onChange={(e) => { setUnitCost(e.target.value); setConfirmPct(null); }}
            inputMode="decimal"
            placeholder="0,00"
            className="mt-1 w-full rounded-xl border border-line bg-ink px-3 py-2 text-sm text-mist outline-none focus:border-emerald-300/40"
          />
        </label>
      </div>

      {confirmPct != null && (
        <div className="mt-3 flex flex-col gap-2 rounded-xl border border-amber-300/30 bg-amber-300/[0.06] p-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2 text-xs leading-relaxed text-amber-100">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            Bu işlem sonrası portföyünün yaklaşık %{confirmPct.toFixed(0)}&apos;i bu tek varlıkta
            olacak. Tüm parayı tek bir sepete koymak riski artırır — emin misin?
          </p>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => setConfirmPct(null)}
              className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-mist-2 transition hover:bg-white/5"
            >
              Vazgeç
            </button>
            <button
              type="button"
              onClick={confirmAnyway}
              disabled={submitting}
              className="rounded-lg bg-amber-300/85 px-3 py-1.5 text-xs font-semibold text-ink-fixed transition hover:brightness-105"
            >
              Yine de ekle
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-3 text-xs text-rose-300">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className={`btn btn-sm mt-4 ${side === "buy" ? "btn-primary" : "btn-danger"}`}
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        {side === "buy" ? "Alış ekle" : "Satış ekle"}
      </button>
    </form>
  );
}

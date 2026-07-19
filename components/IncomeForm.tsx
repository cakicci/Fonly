"use client";

import { useState } from "react";
import { Loader2, WalletCards } from "lucide-react";

interface IncomeFormProps {
  currentIncome: number | null;
}

export function IncomeForm({ currentIncome }: IncomeFormProps) {
  const [income, setIncome] = useState(currentIncome?.toString() ?? "");
  const [isLoading, setIsLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    const value = parseInt(income);
    if (!value || value < 0) return;

    setIsLoading(true);
    setSaved(false);

    await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ monthlyIncome: value })
    });

    setIsLoading(false);
    setSaved(true);

    // Sayfayı yenile ki bütçe hesabı güncellensin
    setTimeout(() => {
      window.location.reload();
    }, 800);
  }

  return (
    <div className="glass-card rounded-section p-5 sm:p-6">
      <div className="mb-5">
        <p className="text-sm font-medium text-emerald-200">Gelir bilgisi</p>
        <h2 className="mt-2 text-2xl font-semibold text-mist">Aylık gelirini gir</h2>
        <p className="mt-2 text-sm leading-6 text-mist-3">
          Girdiğin gelire ve risk profiline göre aylık ayrılabilir tutar hesaplanır.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-mist-2 mb-2" htmlFor="income-input">
            Aylık net gelir (TL)
          </label>
          <div className="flex items-center gap-3 rounded-2xl border border-line bg-white/[0.04] px-4 py-3">
            <WalletCards className="h-5 w-5 text-emerald-200 shrink-0" />
            <input
              id="income-input"
              type="number"
              min={0}
              step={1000}
              value={income}
              onChange={(e) => { setIncome(e.target.value); setSaved(false); }}
              placeholder="Örn: 30000"
              className="w-full bg-transparent text-lg font-semibold text-mist outline-none placeholder:text-mist-3"
            />
            <span className="text-sm text-mist-3 shrink-0">TL</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isLoading || !income}
          className="btn btn-lg btn-primary px-6 sm:shrink-0"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            "Kaydedildi ✓"
          ) : (
            "Kaydet"
          )}
        </button>
      </div>
    </div>
  );
}

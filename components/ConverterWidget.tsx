"use client";

import { useMemo, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import type { MarketResponse } from "@/app/api/market/route";
import { CURRENCY_MAP } from "@/data/currencies";

interface ConverterAsset {
  id: string;
  label: string;
  shortLabel: string;
  /** 1 birimin TL karşılığı. */
  rawValue: number;
  group: string;
}

interface ConverterWidgetProps {
  data: MarketResponse | null;
  /** Varsayılan hedef varlık id'si (örn. "fx:USD", "gold:gram"). */
  defaultToId?: string;
}

const GROUP_ORDER = ["Türk Lirası", "Yaygın Dövizler", "Diğer Dövizler", "Altın & Gümüş"];

function buildAssets(data: MarketResponse | null): ConverterAsset[] {
  const assets: ConverterAsset[] = [
    { id: "TRY", label: "Türk Lirası", shortLabel: "TL", rawValue: 1, group: "Türk Lirası" },
  ];
  if (!data) return assets;

  for (const c of data.doviz) {
    if (c.rawValue <= 0) continue;
    const meta = CURRENCY_MAP[c.code];
    assets.push({
      id: `fx:${c.code}`,
      label: `${c.flag} ${c.shortName} (${c.code})`,
      shortLabel: c.code,
      rawValue: c.rawValue,
      group: meta?.category === "major" ? "Yaygın Dövizler" : "Diğer Dövizler",
    });
  }

  for (const g of data.tumAltin) {
    if (g.rawValue <= 0) continue;
    assets.push({
      id: `gold:${g.type}`,
      label: `🪙 ${g.name}`,
      shortLabel: g.nameShort,
      rawValue: g.rawValue,
      group: "Altın & Gümüş",
    });
  }

  return assets;
}

/**
 * "5000 TL kaç dolar/gram altın eder" — herhangi bir para birimi veya altın
 * türü arasında hızlı, tek ekranlık dönüşüm. Ebeveyn sayfanın zaten
 * poll'ladığı MarketResponse'u prop olarak alır; kendi fetch/polling'i yok.
 */
export function ConverterWidget({ data, defaultToId = "fx:USD" }: ConverterWidgetProps) {
  const assets = useMemo(() => buildAssets(data), [data]);
  const [amount, setAmount] = useState("1000");
  const [fromId, setFromId] = useState("TRY");
  const [toId, setToId] = useState(defaultToId);

  const from = assets.find(a => a.id === fromId);
  const to = assets.find(a => a.id === toId);

  const result = useMemo(() => {
    const n = parseFloat(amount.replace(",", "."));
    if (!from || !to || !Number.isFinite(n)) return null;
    return (n * from.rawValue) / to.rawValue;
  }, [amount, from, to]);

  function swap() {
    setFromId(toId);
    setToId(fromId);
  }

  const grouped = useMemo(
    () =>
      GROUP_ORDER.map(group => ({
        group,
        items: assets.filter(a => a.group === group),
      })).filter(g => g.items.length > 0),
    [assets]
  );

  if (!data) {
    return (
      <div className="glass-card animate-pulse rounded-2xl p-5">
        <div className="h-4 w-32 rounded bg-white/8" />
        <div className="mt-4 h-11 rounded-xl bg-white/8" />
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-5">
      <p className="text-sm font-semibold text-mist">Hızlı Çevirici</p>
      <p className="mt-1 text-xs text-mist-3">
        Elindeki tutarın başka bir para birimi veya altın cinsinden ne kadar ettiğini gör.
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-mist-3">
            Tutar
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="1000"
            className="w-full rounded-xl border border-line bg-white/[0.03] px-3 py-2.5 text-sm text-mist outline-none focus:border-emerald-300/40"
          />
        </div>

        <div className="flex-1">
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-mist-3">
            Ne
          </label>
          <select
            value={fromId}
            onChange={e => setFromId(e.target.value)}
            className="w-full rounded-xl border border-line bg-white/[0.03] px-3 py-2.5 text-sm text-mist outline-none focus:border-emerald-300/40"
          >
            {grouped.map(g => (
              <optgroup key={g.group} label={g.group}>
                {g.items.map(a => (
                  <option key={a.id} value={a.id} className="bg-[#0d1430]">
                    {a.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={swap}
          aria-label="Yönü değiştir"
          className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl border border-line bg-white/[0.03] text-mist-2 transition hover:border-emerald-300/30 hover:text-emerald-200"
        >
          <ArrowLeftRight className="h-4 w-4" />
        </button>

        <div className="flex-1">
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-mist-3">
            Neye
          </label>
          <select
            value={toId}
            onChange={e => setToId(e.target.value)}
            className="w-full rounded-xl border border-line bg-white/[0.03] px-3 py-2.5 text-sm text-mist outline-none focus:border-emerald-300/40"
          >
            {grouped.map(g => (
              <optgroup key={g.group} label={g.group}>
                {g.items.map(a => (
                  <option key={a.id} value={a.id} className="bg-[#0d1430]">
                    {a.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-emerald-300/15 bg-emerald-300/[0.05] px-4 py-3">
        {result != null && from && to ? (
          <p className="text-lg font-semibold text-mist">
            {amount || 0} {from.shortLabel} ≈{" "}
            <span className="text-emerald-200">
              {result.toLocaleString("tr-TR", { maximumFractionDigits: result < 1 ? 6 : 2 })}
            </span>{" "}
            {to.shortLabel}
          </p>
        ) : (
          <p className="text-sm text-mist-3">Geçerli bir tutar gir.</p>
        )}
      </div>
    </div>
  );
}

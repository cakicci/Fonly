"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  SlidersHorizontal,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Loader2,
  X,
  RotateCcw,
} from "lucide-react";
import { DEFAULT_ORDER, widgetLabel, type WidgetKey } from "@/lib/dashboard/widgets";

export interface CustomizerWidget {
  key: WidgetKey;
  label: string;
  visible: boolean;
}

export function DashboardCustomizer({ widgets }: { widgets: CustomizerWidget[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<CustomizerWidget[]>(widgets);
  const [saving, setSaving] = useState(false);

  function start() {
    setItems(widgets); // her açılışta sunucudaki güncel haliyle başla
    setOpen(true);
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = items.slice();
    [next[i], next[j]] = [next[j], next[i]];
    setItems(next);
  }

  function toggle(i: number) {
    const next = items.slice();
    next[i] = { ...next[i], visible: !next[i].visible };
    setItems(next);
  }

  function reset() {
    setItems(DEFAULT_ORDER.map((k) => ({ key: k, label: widgetLabel(k), visible: true })));
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/user/dashboard-layout", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order: items.map((i) => i.key),
          hidden: items.filter((i) => !i.visible).map((i) => i.key),
        }),
      });
      if (res.ok) {
        setOpen(false);
        router.refresh();
      }
    } catch {
      /* sessizce geç */
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        onClick={start}
        className="btn btn-sm btn-secondary px-4"
      >
        <SlidersHorizontal className="h-4 w-4" /> Özelleştir
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            aria-label="Kapat"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink/70 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-surface p-5 shadow-glow">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-white">Paneli özelleştir</h2>
                <p className="mt-0.5 text-xs text-mist-3">Kartları gizle veya sırasını değiştir.</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Kapat"
                className="rounded-lg p-1.5 text-mist-3 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <ul className="mt-4 space-y-2">
              {items.map((it, i) => (
                <li
                  key={it.key}
                  className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2"
                >
                  <button
                    onClick={() => toggle(i)}
                    aria-label={it.visible ? "Gizle" : "Göster"}
                    className={`rounded-lg p-1.5 transition ${
                      it.visible
                        ? "text-emerald-200 hover:bg-emerald-300/10"
                        : "text-mist-3 hover:bg-white/10"
                    }`}
                  >
                    {it.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <span
                    className={`flex-1 truncate text-sm ${
                      it.visible ? "text-white" : "text-mist-3 line-through"
                    }`}
                  >
                    {it.label}
                  </span>
                  <button
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label="Yukarı taşı"
                    className="rounded-lg p-1.5 text-mist-3 transition hover:bg-white/10 hover:text-white disabled:opacity-25"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => move(i, 1)}
                    disabled={i === items.length - 1}
                    aria-label="Aşağı taşı"
                    className="rounded-lg p-1.5 text-mist-3 transition hover:bg-white/10 hover:text-white disabled:opacity-25"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>

            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                onClick={reset}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-mist-3 transition hover:text-white"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Varsayılana dön
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="btn btn-sm btn-primary px-5"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

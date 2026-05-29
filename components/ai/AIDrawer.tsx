"use client";

import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";
import type { AIContext, AIPromptType } from "./types";

interface AIResponse {
  status?: "coming_soon" | "ok" | "error";
  message?: string;
  content?: string;
}

interface AIDrawerProps {
  type:    AIPromptType;
  context: AIContext;
  label:   string;
  onClose: () => void;
}

/**
 * Sağdan açılan AI sonuç drawer'ı.
 * Faz 0: /api/ai/[type] stub döner ("yakında" mesajı).
 * Faz 12: gerçek Claude streaming buraya bağlanır.
 */
export function AIDrawer({ type, context, label, onClose }: AIDrawerProps) {
  const [data, setData]       = useState<AIResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/ai/${type}`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ context }),
    })
      .then(async r => {
        const json = (await r.json()) as AIResponse;
        if (cancelled) return;
        if (!r.ok) {
          setError(json.message ?? "Bir hata oluştu.");
        } else {
          setData(json);
        }
      })
      .catch(() => { if (!cancelled) setError("Bağlantı hatası."); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [type, context]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} aria-hidden />

      <div className="relative h-full w-full max-w-md overflow-y-auto border-l border-white/10 bg-ink shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-ink/95 px-5 py-4 backdrop-blur">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-gradient-to-br from-fuchsia-300/25 to-emerald-300/20 p-1.5">
              <Sparkles className="h-4 w-4 text-fuchsia-200" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">{label}</h2>
              <p className="text-[11px] text-mist/45">{context.assetName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Kapat"
            className="rounded-lg p-1.5 text-mist/55 transition hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-mist/55">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-fuchsia-300/30 border-t-fuchsia-300" />
              AI analiz ediyor...
            </div>
          )}

          {!loading && error && (
            <div className="rounded-xl border border-rose-300/20 bg-rose-300/[0.05] p-4">
              <p className="text-sm text-rose-200">{error}</p>
            </div>
          )}

          {!loading && data && !error && (
            <div className="space-y-3">
              <div className="rounded-xl border border-fuchsia-300/20 bg-fuchsia-300/[0.04] p-4">
                <p className="whitespace-pre-line text-sm leading-6 text-mist/75">
                  {data.content ?? data.message ?? "İçerik bulunamadı."}
                </p>
              </div>
              {data.status === "coming_soon" && (
                <p className="text-[11px] leading-relaxed text-mist/40">
                  AI motoru henüz devreye girmedi. Aboneliğin aktif, motor hazır olduğunda
                  bu özellikleri otomatik kullanabileceksin.
                </p>
              )}
              {data.status === "ok" && (
                <p className="text-[11px] leading-relaxed text-mist/40">
                  AI içerik üretildi. Bilgiler bilgilendirme amaçlıdır, yatırım tavsiyesi değildir.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

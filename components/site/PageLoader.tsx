import { Loader2 } from "lucide-react";

/**
 * Segment loading.tsx dosyalarının ortak gövdesi. Yavaş dış kaynaklara
 * (TEFAS ~2100 fon, BIST batch fetch) giden sayfalarda anında görünür.
 */
export function PageLoader({ label = "Yükleniyor…" }: { label?: string }) {
  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-300" />
        <p className="text-sm text-mist-3">{label}</p>
      </div>
    </main>
  );
}

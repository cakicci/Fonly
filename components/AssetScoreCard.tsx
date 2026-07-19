import { Star } from "lucide-react";
import type { ScoreAxis } from "@/lib/score/hisse";

interface AssetScoreCardProps {
  axes: ScoreAxis[];
  /** Üstte küçük ek not (örn. risk kategorisi). */
  note?: string;
}

const TIER_COLOR: Record<ScoreAxis["tier"], string> = {
  İyi:  "text-emerald-300",
  Orta: "text-amber-200",
  Zayıf:"text-rose-300",
};

/**
 * Ham oran tablosunu tek bakışta özetleyen basit, yıldızlı skor kartı
 * (Simply Wall St "Snowflake" fikrinden esinlenilmiş, kural tabanlı).
 * Sunucu bileşeni — herhangi bir client hook kullanmaz.
 */
export function AssetScoreCard({ axes, note }: AssetScoreCardProps) {
  const overall = axes.length
    ? Math.round(axes.reduce((sum, a) => sum + a.score, 0) / axes.length)
    : 0;
  const overallStars = Math.max(1, Math.min(5, Math.round(overall / 20)));

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-mist">Hızlı Skor Kartı</p>
        <StarRow count={overallStars} size="h-4 w-4" />
      </div>

      {note && <p className="mb-3 text-xs text-mist-3">{note}</p>}

      <div className="space-y-3">
        {axes.map(a => (
          <div key={a.key} className="flex items-center justify-between gap-3">
            <span className="text-xs text-mist-3">{a.label}</span>
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-medium ${TIER_COLOR[a.tier]}`}>{a.tier}</span>
              <StarRow count={a.stars} size="h-3 w-3" />
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-[11px] leading-relaxed text-mist-3">
        Bu skor kural tabanlı basit bir özettir, yatırım tavsiyesi değildir. Ham sayıları görmek için
        &quot;Gelişmiş görünüm&quot;ü açabilirsin.
      </p>
    </div>
  );
}

function StarRow({ count, size }: { count: number; size: string }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${count} / 5 yıldız`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${size} ${i < count ? "fill-amber-300 text-amber-300" : "text-white/15"}`}
        />
      ))}
    </div>
  );
}

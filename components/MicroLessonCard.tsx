"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Lightbulb, X } from "lucide-react";

interface MicroLessonCardProps {
  /** localStorage anahtarı için benzersiz id (örn. "fon"). */
  id: string;
  title: string;
  body: string;
  guideHref: string;
}

const STORAGE_PREFIX = "fonly:mikroders:";

/**
 * Varlık detay sayfalarında ilk ziyarette gösterilen, kapatılabilir kısa
 * bilgi kartı ("Fon nedir?" gibi). Kapatılınca localStorage'a yazılır ve
 * bir daha gösterilmez. SSR'da localStorage yok — sunucu hiçbir şey render
 * etmez, istemci mount olduğunda görünürlüğe karar verir (hydration
 * uyuşmazlığı olmadan doğal bir "sonradan beliren" davranış).
 */
export function MicroLessonCard({ id, title, body, guideHref }: MicroLessonCardProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(!localStorage.getItem(STORAGE_PREFIX + id));
    } catch {
      setVisible(false);
    }
  }, [id]);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_PREFIX + id, "1");
    } catch {
      /* sessiz — localStorage kapalıysa sadece bu oturumda gösterilmeye devam eder */
    }
  }

  if (!visible) return null;

  return (
    <div className="glass-card flex items-start gap-3 rounded-2xl border border-cyan-200/15 bg-cyan-300/[0.04] p-4">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cyan-300/15 text-cyan-200">
        <Lightbulb className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-mist">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-mist-2">{body}</p>
        <Link
          href={guideHref}
          className="mt-2 inline-block text-xs font-medium text-cyan-200 transition hover:text-cyan-100"
        >
          Rehberde devamını oku →
        </Link>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Kapat, bir daha gösterme"
        className="shrink-0 rounded-lg p-1 text-mist-3 transition hover:bg-white/5 hover:text-mist"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

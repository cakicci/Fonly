"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { AlertTriangle, RotateCcw } from "lucide-react";

/**
 * Segment-level hata sınırı. Dış veri kaynakları (truncgil/Yahoo/TEFAS) veya
 * beklenmedik render hataları buraya düşer — kullanıcı Next.js'in ham hata
 * ekranı yerine tekrar deneyebileceği bir sayfa görür.
 */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
    Sentry.captureException(error); // DSN boşsa no-op
  }, [error]);

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="glass-card w-full max-w-lg rounded-section p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-300/10">
          <AlertTriangle className="h-7 w-7 text-rose-200" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold text-white">Bir şeyler ters gitti</h1>
        <p className="mt-3 text-sm leading-6 text-mist-2">
          Sayfa yüklenirken beklenmedik bir hata oluştu. Piyasa verisi sağlayan
          kaynaklardan biri geçici olarak yanıt vermiyor olabilir — genellikle
          tekrar denemek sorunu çözer.
        </p>
        {error.digest ? (
          <p className="mt-2 text-xs text-mist-3">Hata kodu: {error.digest}</p>
        ) : null}

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="btn btn-sm btn-primary"
          >
            <RotateCcw className="h-4 w-4" />
            Tekrar dene
          </button>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-mist-2 transition hover:bg-white/[0.08] hover:text-white"
          >
            Ana sayfaya dön
          </Link>
        </div>
      </div>
    </main>
  );
}

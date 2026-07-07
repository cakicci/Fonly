"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

/**
 * Kök layout'un kendisi çökerse devreye giren son savunma hattı.
 * Root layout'u (ve globals.css'i) değiştirdiği için stiller inline —
 * Tailwind class'ları burada çalışmaz.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error); // DSN boşsa no-op
  }, [error]);
  return (
    <html lang="tr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b1026",
          color: "#ecfff9",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "1rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>Bir şeyler ters gitti</h1>
          <p style={{ color: "rgba(216,247,238,0.64)", fontSize: "0.875rem", lineHeight: 1.6 }}>
            Uygulama beklenmedik bir hatayla karşılaştı.
            {error.digest ? ` (Hata kodu: ${error.digest})` : ""}
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              padding: "0.75rem 1.5rem",
              borderRadius: "1rem",
              border: "none",
              background: "#6ee7b7",
              color: "#0b1026",
              fontWeight: 600,
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            Tekrar dene
          </button>
        </div>
      </body>
    </html>
  );
}

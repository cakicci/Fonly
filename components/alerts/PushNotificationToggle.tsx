"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing, Loader2 } from "lucide-react";

type Status = "unsupported" | "checking" | "denied" | "off" | "on";

/** Web Push VAPID public key'i URL-safe base64'ten Uint8Array'e çevirir. */
function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

/**
 * Alarmlar sayfasında tarayıcı push bildirimini açıp kapatan basit anahtar.
 * VAPID public key ortam değişkeninde yoksa hiç render edilmez (özellik
 * kapalı sayılır — dev'de kurulmamışsa sessizce gizlenir).
 */
export function PushNotificationToggle() {
  const [status, setStatus] = useState<Status>("checking");
  const [busy, setBusy] = useState(false);
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  useEffect(() => {
    if (!publicKey || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    navigator.serviceWorker.getRegistration().then(async (reg) => {
      const sub = await reg?.pushManager.getSubscription();
      setStatus(sub ? "on" : "off");
    });
  }, [publicKey]);

  if (!publicKey || status === "unsupported") return null;

  async function enable() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey!),
      });
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      setStatus("on");
    } catch {
      setStatus("off");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setStatus("off");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-line bg-white/[0.03] px-4 py-3">
      <div className="flex items-center gap-2.5">
        {status === "on" ? (
          <BellRing className="h-4 w-4 shrink-0 text-emerald-300" />
        ) : (
          <BellOff className="h-4 w-4 shrink-0 text-mist-3" />
        )}
        <div>
          <p className="text-sm font-medium text-mist">Tarayıcı bildirimleri</p>
          <p className="text-xs text-mist-3">
            {status === "denied"
              ? "Bildirim izni tarayıcı ayarlarından engellenmiş."
              : status === "on"
                ? "Alarmların tetiklendiğinde bu tarayıcıya bildirim gelir."
                : "Alarmların tetiklendiğinde e-postaya ek olarak anında haber al."}
          </p>
        </div>
      </div>

      {status !== "denied" && (
        <button
          type="button"
          onClick={status === "on" ? disable : enable}
          disabled={busy || status === "checking"}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
            status === "on"
              ? "border-line bg-white/[0.04] text-mist-2 hover:bg-white/[0.08]"
              : "border-emerald-300/35 bg-emerald-300/12 text-emerald-100 hover:bg-emerald-300/20"
          }`}
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : status === "on" ? <Bell className="h-3.5 w-3.5" /> : <BellRing className="h-3.5 w-3.5" />}
          {status === "on" ? "Kapat" : "Aç"}
        </button>
      )}
    </div>
  );
}

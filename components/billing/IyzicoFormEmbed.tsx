"use client";

import { useEffect, useRef } from "react";

/**
 * iyzico `checkoutFormContent` enjektörü.
 *
 * İçerik bir <script> bloğudur; React'in dangerouslySetInnerHTML'i script'leri
 * ÇALIŞTIRMAZ. Bu bileşen script'i gerçek bir <script> düğümü olarak DOM'a
 * ekler — iyzico formu `#iyzipay-checkout-form` div'ine render olur.
 */
export function IyzicoFormEmbed({ content }: { content: string }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const parsed = new DOMParser().parseFromString(content, "text/html");
    const appended: HTMLScriptElement[] = [];

    parsed.querySelectorAll("script").forEach((original) => {
      const script = document.createElement("script");
      for (const attr of Array.from(original.attributes)) {
        script.setAttribute(attr.name, attr.value);
      }
      script.text = original.text;
      host.appendChild(script);
      appended.push(script);
    });

    return () => {
      appended.forEach((s) => s.remove());
    };
  }, [content]);

  return (
    <div ref={hostRef}>
      <div id="iyzipay-checkout-form" className="responsive" />
    </div>
  );
}

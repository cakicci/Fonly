import type { MetadataRoute } from "next";

/** PWA manifest — mobilde "ana ekrana ekle" kurulabilirliği sağlar. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Fonly — Basit Yatırım Rehberi",
    short_name: "Fonly",
    description:
      "Döviz, altın, BIST hisseleri ve TEFAS fonları: canlı fiyatlar, grafikler, portföy takibi ve sade Türkçe yatırım rehberi.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b1026",
    theme_color: "#0b1026",
    lang: "tr",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

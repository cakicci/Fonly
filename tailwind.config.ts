import type { Config } from "tailwindcss";

/**
 * Fonly tasarım token'ları — kaynak: design-system/fonly/MASTER.md
 * Buradaki değerler MASTER.md ile senkron tutulmalı. Bileşenlere ham
 * hex/rgba gömmek yerine bu token'lar kullanılır.
 */
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./data/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0b1026",
          deep: "#070b1d",
          light: "#101a3a"
        },
        mist: {
          DEFAULT: "#d8f7ee",
          // Metin hiyerarşisi yalnız bu 3 kademe: mist (birincil),
          // mist-2 (ikincil/gövde), mist-3 (etiket/meta).
          2: "rgba(216, 247, 238, 0.7)",
          3: "rgba(216, 247, 238, 0.5)"
        },
        surface: {
          DEFAULT: "#10172f",
          2: "rgba(255, 255, 255, 0.04)"
        },
        line: {
          DEFAULT: "rgba(216, 247, 238, 0.12)",
          strong: "rgba(216, 247, 238, 0.2)"
        },
        accent: {
          DEFAULT: "#6ee7b7", // emerald-300 — primary CTA
          soft: "#a7f3d0" // emerald-200 — vurgu metni
        },
        positive: "#6ee7b7", // kâr/artış (emerald-300)
        negative: "#fda4af" // zarar/satış (rose-300)
      },
      borderRadius: {
        card: "1.25rem", // içerik kartları
        panel: "1.5rem", // panel/iç bölme
        section: "1.75rem", // sayfa bölümleri
        hero: "2rem" // hero vitrin
      },
      backgroundImage: {
        hero: "var(--gradient-hero)", // hero vitrin zemini
        cta: "var(--gradient-cta)" // emerald parıltılı CTA bölümü
      },
      boxShadow: {
        glow: "0 0 44px rgba(40, 230, 164, 0.18)",
        card: "0 20px 80px rgba(0, 0, 0, 0.28)"
      },
      transitionDuration: {
        fast: "150ms",
        base: "250ms",
        slow: "400ms"
      }
    }
  },
  plugins: []
};

export default config;

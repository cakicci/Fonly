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
          DEFAULT: "var(--bg)",
          deep: "var(--bg-deep)",
          light: "var(--bg-light)",
          // Tema-bağımsız sabit: parlak accent üzerinde duran metin (ör. rozet
          // ikon kutuları) her iki modda da koyu kalmalı — bkz. text-ink-fixed.
          fixed: "#0b1026"
        },
        mist: {
          DEFAULT: "var(--text)",
          // Metin hiyerarşisi yalnız bu 3 kademe: mist (birincil),
          // mist-2 (ikincil/gövde), mist-3 (etiket/meta).
          2: "var(--text-2)",
          3: "var(--text-3)"
        },
        surface: {
          DEFAULT: "var(--surface)",
          2: "var(--surface-2)"
        },
        line: {
          DEFAULT: "var(--line)",
          strong: "var(--line-strong)"
        },
        accent: {
          DEFAULT: "var(--accent)", // emerald-300 (dark) / emerald-700 (light) — primary CTA
          soft: "var(--accent-soft)" // emerald-200 (dark) / emerald-800 (light) — vurgu/hover
        },
        positive: "var(--positive)", // kâr/artış
        negative: "var(--negative)", // zarar/satış

        // "Aktif rozet" / kimlik metni: bg-{hue}-300/opacity + text-{hue}-100
        // veya text-{hue}-200 ikilisinin bu iki pastel kademesi tema-bağımlı
        // hale getirilir (dark: Tailwind varsayılanı, light: okunur -700 tonu).
        // Diğer tüm shade'ler (50-900, 300 dahil) dokunulmadan Tailwind
        // varsayılanından gelir — theme.extend yalnız 100/200'ü ezer.
        // İstisna: components/Hero.tsx (1) ve app/premium/page.tsx'teki kalıcı
        // koyu ada içindeki kullanımlar (3) bilinçli olarak bu token'ları
        // DEĞİL, ham hex'i kullanır — bkz. dosyalardaki yorumlar.
        emerald: { 100: "var(--chip-emerald-100)", 200: "var(--chip-emerald-200)" },
        rose: { 100: "var(--chip-rose-100)", 200: "var(--chip-rose-200)" },
        amber: { 100: "var(--chip-amber-100)", 200: "var(--chip-amber-200)" },
        cyan: { 100: "var(--chip-cyan-100)", 200: "var(--chip-cyan-200)" },
        fuchsia: { 100: "var(--chip-fuchsia-100)", 200: "var(--chip-fuchsia-200)" },
        violet: { 100: "var(--chip-violet-100)", 200: "var(--chip-violet-200)" },
        sky: { 100: "var(--chip-sky-100)", 200: "var(--chip-sky-200)" }
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
        glow: "0 0 44px var(--shadow-glow-color)",
        card: "0 20px 80px var(--shadow-card-color)"
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

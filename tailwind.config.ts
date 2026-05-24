import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./data/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0b1026",
        mist: "#d8f7ee",
        surface: "#10172f",
        line: "rgba(216, 247, 238, 0.12)"
      },
      boxShadow: {
        glow: "0 0 44px rgba(40, 230, 164, 0.18)",
        card: "0 20px 80px rgba(0, 0, 0, 0.28)"
      }
    }
  },
  plugins: []
};

export default config;

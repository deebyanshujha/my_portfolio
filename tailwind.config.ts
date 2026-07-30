import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        card: "var(--card)",
        surface: "var(--surface)",
        canvas: "var(--canvas)",
        primary: "var(--primary-text)",
        secondary: "var(--secondary-text)",
        muted: "var(--muted-text)",
        "border-subtle": "var(--border-subtle)",
        "border-strong": "var(--border-strong)",
        "glass-bg": "var(--glass-bg)",
        "glass-border": "var(--glass-border)",
        "hover-bg": "var(--hover-bg)",
        electric: "var(--brand-electric)",
        violet: "var(--brand-violet)",
        mint: "var(--brand-mint)",
        amberline: "var(--brand-amber)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: [
          "Space Grotesk",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        glow: "var(--shadow-glow)",
        violet: "var(--shadow-violet)",
        soft: "var(--shadow-soft)",
      },
      backgroundImage: {
        "hero-grid": "var(--hero-grid)",
        "text-gradient":
          "linear-gradient(135deg, #FFFFFF 0%, #C4B5FD 42%, #93C5FD 72%, #D9F99D 100%)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
      },
      animation: {
        shimmer: "shimmer 9s ease infinite",
        scan: "scan 5s linear infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;

export default config;

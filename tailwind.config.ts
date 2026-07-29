import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#09090B",
        surface: "#111111",
        glass: "rgba(24,24,27,0.75)",
        electric: "#3B82F6",
        violet: "#8B5CF6",
        mint: "#34D399",
        amberline: "#F59E0B",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        glow: "0 0 40px rgba(59,130,246,0.18)",
        violet: "0 0 44px rgba(139,92,246,0.16)",
        soft: "0 24px 80px rgba(9,9,11,0.42)",
      },
      backgroundImage: {
        "hero-grid":
          "linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)",
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

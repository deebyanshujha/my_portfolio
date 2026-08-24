import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ground: "var(--ground)",
        "ground-2": "var(--ground-2)",
        ink: "var(--ink)",
        "ink-2": "var(--ink-2)",
        "ink-3": "var(--ink-3)",
        hair: "var(--hair)",
        "hair-strong": "var(--hair-strong)",
        accent: "var(--accent)",
        "accent-dim": "var(--accent-dim)",
        win: "var(--win-bg)",
        "win-border": "var(--win-border)",
        chrome: "var(--chrome-bg)",
      },
      fontFamily: {
        display: ["Archivo", "system-ui", "sans-serif"],
        editorial: ["Instrument Serif", "Georgia", "serif"],
        ui: ["Inter Tight", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        tightest: "-0.055em",
        meta: "0.14em",
      },
      borderRadius: {
        win: "12px",
      },
      transitionTimingFunction: {
        cine: "cubic-bezier(0.76, 0, 0.24, 1)",
        out: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      zIndex: {
        desktop: "10",
        windows: "100",
        dock: "900",
        menubar: "1000",
        overlay: "1100",
        boot: "1200",
      },
    },
  },
  plugins: [],
};

export default config;

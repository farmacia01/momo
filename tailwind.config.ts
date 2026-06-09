import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-outfit)", "Outfit", "system-ui", "sans-serif"],
        display: ["var(--font-syne)", "Syne", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#fff4ed",
          100: "#ffe6d5",
          200: "#ffccaa",
          300: "#ffa574",
          400: "#ff7433",
          500: "#ff6500",
          600: "#e55a00",
          700: "#cc4c00",
          800: "#a33c00",
          900: "#7a2e00",
        },
        ember: "var(--color-ember)",
        "ember-light": "var(--color-ember-light)",
        "ember-dim": "var(--color-ember-dim)",
        surface: "var(--color-surface)",
        "surface-mid": "var(--color-surface-mid)",
        "surface-border": "var(--color-surface-border)",
        bg: "var(--color-bg)",
        text: "var(--color-text)",
        muted: "var(--color-text-muted)",
        dim: "var(--color-text-dim)",
        // Keep forest as alias to ember for compatibility
        forest: "var(--color-ember)",
        "forest-light": "var(--color-ember-light)",
      },
      boxShadow: {
        premium: "var(--shadow-card)",
        dose: "var(--shadow-ember)",
        ember: "var(--shadow-ember)",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        emberPulse: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(255,101,0,0.4)" },
          "50%": { boxShadow: "0 0 0 8px rgba(255,101,0,0)" },
        },
      },
      animation: {
        "fade-up": "fadeUp 0.5s ease-out forwards",
        "ember-pulse": "emberPulse 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;

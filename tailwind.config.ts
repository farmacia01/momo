import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      maxWidth: {
        'screen': '100vw',
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "DM Sans", "system-ui", "sans-serif"],
      },
      colors: {
        // Medical green palette built around the brand color #16a34a.
        brand: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
        },
        forest: "#1c4d2e",
        "forest-light": "#2d7a4f",
        surface: "#e8f5ee",
        "surface-mid": "#cce8d9",
        bg: "#f2f2f7",
      },
      boxShadow: {
        'premium': '0 2px 16px rgba(0,0,0,0.07)',
        'dose': '0 4px 16px rgba(0,0,0,0.2)',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease-out forwards',
      }
    },
  },
  plugins: [],
};

export default config;

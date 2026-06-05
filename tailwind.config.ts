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
        primary: '#1F6B43',
        'primary-dark': '#155734',
        background: '#F6F7FB',
        card: '#FFFFFF',
        'text-primary': '#111827',
        'text-secondary': '#6B7280',
        error: '#EF4444',
        success: '#22C55E',
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

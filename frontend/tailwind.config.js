/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
        display: ["Fraunces", "Georgia", "serif"],
      },
      colors: {
        app: {
          DEFAULT: "rgb(var(--app-bg) / <alpha-value>)",
          muted: "rgb(var(--app-muted) / <alpha-value>)",
        },
        ink: {
          DEFAULT: "rgb(var(--ink) / <alpha-value>)",
          soft: "rgb(var(--ink-soft) / <alpha-value>)",
        },
        surface: {
          DEFAULT: "rgb(var(--surface) / <alpha-value>)",
          strong: "rgb(var(--surface-strong) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          muted: "rgb(var(--accent-muted) / <alpha-value>)",
        },
        value: {
          DEFAULT: "rgb(var(--value) / <alpha-value>)",
        },
        brand: {
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
        },
      },
      boxShadow: {
        glass: "0 8px 32px rgb(0 0 0 / 0.12), 0 2px 8px rgb(0 0 0 / 0.06)",
        "glass-dark": "0 12px 40px rgb(0 0 0 / 0.45), inset 0 1px 0 rgb(255 255 255 / 0.06)",
        lift: "0 4px 24px rgb(var(--accent) / 0.15)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.5s ease-out forwards",
        shimmer: "shimmer 8s ease-in-out infinite",
        float: "float 5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Design tokens: premium dark + orange fintech
        background: {
          primary: "#080c14",
          secondary: "#0c1222",
        },
        surface: {
          DEFAULT: "#0c1222",
          card: "#111827",
          elevated: "#141c2e",
          border: "#1e293b",
          muted: "#0f172a",
        },
        border: {
          DEFAULT: "#1e293b",
          accent: "rgba(249, 115, 22, 0.4)",
        },
        accent: {
          primary: "#f97316",
          secondary: "#ea580c",
          glow: "rgba(249, 115, 22, 0.25)",
        },
        text: {
          primary: "#f8fafc",
          secondary: "#94a3b8",
          muted: "#64748b",
        },
        status: {
          success: "#22c55e",
          warning: "#f59e0b",
          danger: "#ef4444",
          info: "#3b82f6",
        },
        brand: {
          50: "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
          700: "#c2410c",
          800: "#9a3412",
          900: "#7c2d12",
          950: "#431407",
        },
        navy: {
          950: "#080c14",
          900: "#0c1222",
          800: "#111827",
          700: "#141c2e",
          600: "#1e293b",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "monospace"],
      },
      borderRadius: {
        DEFAULT: "6px",
        sm: "4px",
        md: "6px",
        lg: "8px",
      },
      boxShadow: {
        glow: "0 0 32px -8px rgba(249, 115, 22, 0.3)",
        "glow-sm": "0 0 16px -6px rgba(249, 115, 22, 0.2)",
        card: "0 2px 12px -4px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)",
        "card-hover": "0 4px 20px -4px rgba(0,0,0,0.5), 0 0 0 1px rgba(249,115,22,0.12)",
      },
      spacing: {
        section: "1.5rem",
        card: "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;

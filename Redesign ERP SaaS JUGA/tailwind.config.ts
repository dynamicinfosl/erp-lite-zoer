import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "juga-primary": "#1e40af",
        "juga-primary-light": "#3b82f6",
        "juga-primary-dark": "#1e3a8a",
        "juga-secondary": "#64748b",
        "juga-accent": "#06b6d4",
        "juga-success": "#10b981",
        "juga-warning": "#f59e0b",
        "juga-error": "#ef4444",
        "juga-surface": "#ffffff",
        "juga-surface-elevated": "#f8fafc",
        "juga-surface-card": "#ffffff",
        "juga-text-primary": "#0f172a",
        "juga-text-secondary": "#475569",
        "juga-text-muted": "#94a3b8",
        "juga-border": "#e2e8f0",
      },
      boxShadow: {
        "juga-glow": "0 0 0 1px rgba(30, 64, 175, 0.05), 0 4px 16px rgba(30, 64, 175, 0.12)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;


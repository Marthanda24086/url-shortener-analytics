import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        dark: {
          950: "#090909", // Deep Black
          900: "#151515", // Charcoal
          850: "#1D1D1D", // Dark Graphite
          800: "#242424", // Card hover
          700: "#303030", // Subtle border
          600: "#454545",
          500: "#737373",
          400: "#A1A1AA", // Muted Grey
          100: "#F5F5F5", // Off White
        },
        brand: {
          orange: "#FF6B2C", // Burnt Orange Accent
          amber: "#FF8C42",  // Amber Orange Secondary
          hover: "#E55A1F",
          dim: "#3D1F12",
          subtle: "rgba(255, 107, 44, 0.12)",
        },
      },
      fontFamily: {
        sans: ["Inter", "Geist", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      animation: {
        "fade-in": "fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-up": "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "pulse-subtle": "pulseSubtle 2.5s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSubtle: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
      },
      boxShadow: {
        "orange-glow": "0 0 20px -3px rgba(255, 107, 44, 0.25)",
        "orange-sm": "0 0 10px -2px rgba(255, 107, 44, 0.2)",
      },
    },
  },
  plugins: [],
};
export default config;

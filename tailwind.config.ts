import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#050a0e",
          secondary: "#080f14",
          card: "#0a1520",
          elevated: "#0d1e2e",
        },
        accent: {
          cyan: "#00d4ff",
          green: "#00ff88",
          amber: "#ffaa00",
          red: "#ff3366",
        },
        text: {
          primary: "#ffffff",
          secondary: "#8899aa",
          muted: "#445566",
        },
        border: {
          subtle: "#1a2a3a",
          glow: "#00d4ff33",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow": "spin 8s linear infinite",
        "spin-reverse": "spin-reverse 12s linear infinite",
        scanline: "scanline 8s linear infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        typewriter: "typewriter 0.5s steps(20, end)",
        flicker: "flicker 0.15s infinite",
      },
      keyframes: {
        "spin-reverse": {
          from: { transform: "rotate(360deg)" },
          to: { transform: "rotate(0deg)" },
        },
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "1", filter: "brightness(1)" },
          "50%": { opacity: "0.7", filter: "brightness(1.3)" },
        },
        typewriter: {
          from: { width: "0" },
          to: { width: "100%" },
        },
        flicker: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.3" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        "glow-cyan": "0 0 20px #00d4ff33, 0 0 40px #00d4ff11",
        "glow-green": "0 0 20px #00ff8833, 0 0 40px #00ff8811",
        "glow-amber": "0 0 20px #ffaa0033, 0 0 40px #ffaa0011",
        "glow-red": "0 0 20px #ff336633, 0 0 40px #ff336611",
        "inner-glow": "inset 0 0 20px #00d4ff11",
        card: "0 4px 24px #00000066",
      },
    },
  },
  plugins: [],
};

export default config;

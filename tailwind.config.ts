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
        void: "#070b14",
        surface: "#0d1424",
        elevated: "#141d33",
        cyan: { DEFAULT: "#4ccfff", dim: "rgba(76, 204, 255, 0.15)" },
        amber: { DEFAULT: "#ffb84d", dim: "rgba(255, 184, 77, 0.15)" },
        "text-primary": "#e8f0ff",
        "text-muted": "#6b7fa3",
        "text-dim": "#3d4f6f",
        success: "#4dff91",
        error: "#ff4d6a",
      },
      fontFamily: {
        display: ["Orbitron", "sans-serif"],
        body: ["Space Grotesk", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(rgba(76, 204, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(76, 204, 255, 0.03) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "40px 40px",
      },
    },
  },
  plugins: [],
};
export default config;

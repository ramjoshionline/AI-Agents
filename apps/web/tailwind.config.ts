import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "#070B0F",
        card: "#0D1420",
        card2: "#111A28",
        border: "#1C2D40",
        primary: "#FF9500",
        blue: "#3B9EFF",
        green: "#2ECC71",
        purple: "#9B59B6",
        red: "#E74C3C",
        teal: "#1ABC9C",
        yellow: "#F1C40F",
        "text-main": "#BDD0E0",
        dim: "#4A6580",
      },
      fontFamily: {
        mono: ["'IBM Plex Mono'", "'Fira Code'", "monospace"],
      },
      backgroundImage: {
        "hero-gradient":
          "linear-gradient(160deg, #070B0F 0%, #0C1A10 40%, #0C101A 100%)",
      },
    },
  },
  plugins: [],
};

export default config;

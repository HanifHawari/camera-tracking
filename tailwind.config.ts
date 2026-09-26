import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        maroon: "#7A1F2B",
        ice: "#BFE3EC",
        ink: "#2B2D31",
      },
      boxShadow: {
        panel: "0 18px 54px rgba(39, 47, 61, 0.07)",
      },
    },
  },
  plugins: [],
};

export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "monospace"]
      },
      colors: {
        ink: "#171717",
        paper: "#faf9f6",
        line: "#e9e5dc",
        muted: "#77746d",
        accent: "#355f52"
      }
    }
  },
  plugins: []
};

export default config;

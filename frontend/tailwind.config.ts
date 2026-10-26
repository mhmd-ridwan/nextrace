import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--bg)",
        surface: {
          DEFAULT: "var(--s1)",
          elevated: "var(--s2)",
          highlight: "var(--s2)",
          border: "var(--line)",
        },
        primary: {
          DEFAULT: "var(--acc)",
          foreground: "#0e1012",
          hover: "#7296be",
        },
        warning: {
          DEFAULT: "var(--mid)",
          foreground: "#0e1012",
        },
        danger: {
          DEFAULT: "var(--hi)",
          foreground: "#FFFFFF",
        },
        success: {
          DEFAULT: "var(--lo)",
          foreground: "#0e1012",
        },
        muted: {
          DEFAULT: "var(--line)",
          foreground: "var(--mute)",
        },
      },
      fontFamily: {
        sans: ["var(--f)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;

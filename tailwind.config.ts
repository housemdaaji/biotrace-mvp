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
        'mago-forest': '#2D5A2E',
        'mago-leaf': '#4A8C35',
        'mago-sky': '#1A5C8A',
        'mago-gold': '#BC9420',
        'mago-bg': '#FCFEFC',
      },
    },
  },
  plugins: [],
};
export default config;

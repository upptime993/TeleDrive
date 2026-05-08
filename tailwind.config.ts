import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
        heading: ['var(--font-sora)', 'sans-serif'],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        navy: {
          50: '#f0f3ff',
          100: '#e2e9ff',
          200: '#caddff',
          300: '#a3c0ff',
          400: '#7a9dff',
          500: '#4f72ff',
          600: '#344df3',
          700: '#2738d8',
          800: '#2130ae',
          900: '#0f172a', // Deep navy
          950: '#060a16',
        },
        cyan: {
          accent: '#06b6d4', // Electric cyan
          hover: '#22d3ee',
        },
        purple: {
          subtle: '#a855f7',
          deep: '#7e22ce',
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-gradient': 'linear-gradient(to right bottom, #0f172a, #2130ae, #7e22ce)',
      },
    },
  },
  plugins: [],
};
export default config;

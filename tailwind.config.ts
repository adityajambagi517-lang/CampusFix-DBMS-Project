import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#b9ddfd',
          300: '#7cc2fb',
          400: '#36a3f7',
          500: '#0c87eb',
          600: '#026bc9',
          700: '#0355a3',
          800: '#074886',
          900: '#0c3d6f',
          950: '#08274a',
        },
        surface: {
          bg: '#0a0e17',
          card: '#111827',
          elevated: '#172033',
          overlay: '#1e293b',
          border: 'rgba(255, 255, 255, 0.08)',
          'border-hover': 'rgba(255, 255, 255, 0.16)',
          'border-active': 'rgba(56, 189, 248, 0.4)',
        },
        status: {
          open: {
            bg: 'rgba(2, 132, 199, 0.12)',
            text: '#38bdf8',
            border: 'rgba(56, 189, 248, 0.25)',
          },
          assigned: {
            bg: 'rgba(147, 51, 234, 0.12)',
            text: '#c084fc',
            border: 'rgba(192, 132, 252, 0.25)',
          },
          in_progress: {
            bg: 'rgba(245, 158, 11, 0.12)',
            text: '#fbbf24',
            border: 'rgba(251, 191, 36, 0.25)',
          },
          resolved: {
            bg: 'rgba(16, 185, 129, 0.12)',
            text: '#34d399',
            border: 'rgba(52, 211, 153, 0.25)',
          },
          escalated: {
            bg: 'rgba(244, 63, 94, 0.12)',
            text: '#fb7185',
            border: 'rgba(251, 113, 133, 0.25)',
          },
          closed: {
            bg: 'rgba(100, 116, 139, 0.12)',
            text: '#94a3b8',
            border: 'rgba(148, 163, 184, 0.25)',
          },
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'Fira Code',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      boxShadow: {
        'glow-primary': '0 0 24px -4px rgba(12, 135, 235, 0.25)',
        'glow-emerald': '0 0 24px -4px rgba(16, 185, 129, 0.25)',
        'glow-rose': '0 0 24px -4px rgba(244, 63, 94, 0.25)',
        'glow-amber': '0 0 24px -4px rgba(245, 158, 11, 0.25)',
        'surface-elevation': '0 10px 30px -10px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.08)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-subtle': 'pulseSubtle 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
};

export default config;

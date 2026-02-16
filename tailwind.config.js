import typography from '@tailwindcss/typography'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        app: 'var(--color-bg-app)',
        surface: {
          DEFAULT: 'var(--color-bg-surface)',
          hover: 'var(--color-bg-surface-hover)',
        },
      },
      borderColor: {
        DEFAULT: 'var(--color-border)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': '1rem',
        '3xl': '1.5rem',
        full: 'var(--radius-full)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        lg: 'var(--shadow-card)',
        card: 'var(--shadow-card)',
        'glow-purple': 'var(--shadow-glow-purple)',
        'glow-orange': 'var(--shadow-glow-orange)',
        floating: 'var(--shadow-floating)',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'in': 'fadeIn 0.3s ease-out',
      },
    },
  },
  corePlugins: {
    container: false,
  },
  plugins: [typography],
}

module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter Variable', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Cal Sans', 'Inter Variable', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#e0e9ff',
          200: '#c0d2ff',
          300: '#91aaff',
          400: '#6080fa',
          500: '#3d5af1',
          600: '#2d3fe6',
          700: '#2530cc',
          800: '#2229a6',
          900: '#222783',
          950: '#15184f',
        },
        surface: {
          DEFAULT: '#0f1117',
          secondary: '#161b27',
          tertiary: '#1e2436',
          border: '#2a3147',
          hover: '#252d42',
        },
        status: {
          confirmed: '#22c55e',
          query: '#f59e0b',
          budget: '#8b5cf6',
          reserved: '#3b82f6',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}

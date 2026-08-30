/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        procure: {
          50:  '#eef5ff',
          100: '#d9e8ff',
          200: '#bcd3ff',
          300: '#8eb5fd',
          400: '#598cf9',
          500: '#3366f4',
          600: '#1d47ea',
          700: '#1535d6',
          800: '#182cad',
          900: '#1a2b88',
          950: '#141b52',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'mesh-gradient': 'linear-gradient(135deg, #1a2b88 0%, #1535d6 40%, #182cad 70%, #141b52 100%)',
      },
    },
  },
  plugins: [],
};

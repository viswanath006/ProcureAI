import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          navy: 'rgb(var(--gov-navy) / <alpha-value>)',
          blue: 'rgb(var(--gov-blue) / <alpha-value>)',
          teal: 'rgb(var(--gov-teal) / <alpha-value>)',
          gold: 'rgb(var(--gov-gold) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;

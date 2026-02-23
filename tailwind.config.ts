import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          copper: '#c87941',
          gold: '#d4a574',
          lavender: '#c4b0d4',
          charcoal: '#3a2f2a',
          body: '#5a4a3f',
          muted: '#8b6f5e',
          cream: '#fdf8f0',
          linen: '#faf5f0'
        }
      },
      fontFamily: {
        display: ['var(--font-playfair)', 'serif'],
        script: ['var(--font-dancing)', 'cursive'],
        body: ['var(--font-cormorant)', 'serif'],
        ui: ['var(--font-inter)', 'sans-serif']
      },
      boxShadow: {
        soft: '0 20px 50px rgba(120, 88, 64, 0.12)'
      }
    }
  },
  plugins: []
};

export default config;

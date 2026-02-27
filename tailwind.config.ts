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
          copper: 'var(--color-gold)',
          gold: 'var(--color-gold-light)',
          lavender: '#c4b0d4',
          charcoal: 'var(--color-text-primary)',
          body: 'var(--color-text-body)',
          muted: 'var(--color-text-muted)',
          cream: 'var(--color-midnight)',
          linen: 'var(--color-deep-plum)'
        },
        dark: {
          midnight: '#0D0A14',
          plum: '#2A1B3D',
          surface: '#1A1425',
          gold: '#D4A853',
          'gold-light': '#F0D48A',
          cream: '#FFF8F0'
        }
      },
      fontFamily: {
        display: ['var(--font-playfair)', 'serif'],
        script: ['var(--font-caveat)', 'var(--font-dancing)', 'cursive'],
        body: ['var(--font-cormorant)', 'serif'],
        ui: ['var(--font-dm-sans)', 'var(--font-inter)', 'sans-serif']
      },
      boxShadow: {
        soft: '0 20px 50px rgba(0, 0, 0, 0.40)'
      }
    }
  },
  plugins: []
};

export default config;

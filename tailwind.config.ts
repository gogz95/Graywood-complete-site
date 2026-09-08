import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        nordic: {
          canvas: '#F9F8F6',     // Warm limestone / linen background
          surface: '#FFFFFF',    // Pristine white surface panels
          muted: '#F1EFEA',      // Subtle secondary backdrops / pill controls
          border: '#E8E5DF',     // Hairline oat / clay borders
          divider: '#DDD9D0',    // Section dividers and structural accents
          ink: '#1C1B19',        // Archival charcoal text
          subtle: '#68655E',     // Secondary descriptive typography
          faint: '#9E9B93',      // Technical metadata and timestamps
          pine: '#2D3B36',       // Scandinavian pine green accent
          clay: '#C86D51',       // Terracotta highlight
        },
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;

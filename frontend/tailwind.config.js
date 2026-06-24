/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#090a0f',
        surface: 'rgba(17, 19, 31, 0.65)',
        'surface-hover': 'rgba(26, 29, 46, 0.8)',
        indigo: {
          500: '#6366f1',
        },
        purple: {
          500: '#a855f7',
        },
        emerald: {
          500: '#10b981',
        },
        rose: {
          500: '#ef4444',
        },
        cyan: {
          500: '#06b6d4',
        }
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}

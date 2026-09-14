/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pastel: {
          pink: '#FDF2F4',
          'pink-border': '#FCE7EB',
          'pink-text': '#BE185D',
          blue: '#F0F7FF',
          'blue-border': '#E0F0FE',
          'blue-text': '#0369A1',
          yellow: '#FEF9EE',
          'yellow-border': '#FEF08A',
          'yellow-text': '#B45309',
          green: '#F0FDF4',
          'green-border': '#DCFCE7',
          'green-text': '#15803D',
          purple: '#F5F3FF',
          'purple-border': '#EDE9FE',
          'purple-text': '#6D28D9',
          peach: '#FFF7ED',
          'peach-border': '#FFEDD5',
          'peach-text': '#C2410C'
        },
        brand: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.02)',
        'soft-hover': '0 10px 25px -3px rgba(0, 0, 0, 0.08), 0 4px 10px -2px rgba(0, 0, 0, 0.03)',
        'modal': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      }
    },
  },
  plugins: [],
}

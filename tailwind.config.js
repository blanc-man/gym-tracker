/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        teal: {
          700: '#0f766e',
          600: '#0d9488',
          500: '#14b8a6',
        },
        green: {
          500: '#10b981',
          400: '#34d399',
        }
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        base: ['18px', '1.6'],
        sm: ['16px', '1.5'],
        xs: ['14px', '1.4'],
        lg: ['20px', '1.5'],
        xl: ['22px', '1.4'],
        '2xl': ['26px', '1.3'],
        '3xl': ['30px', '1.2'],
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory: {
          50: '#FAF8F3',
          100: '#F6F3EA',
          200: '#ECE7DA',
          300: '#DFD8C4',
        },
        charcoal: {
          DEFAULT: '#252525',
          900: '#1A1A1A',
          800: '#252525',
          700: '#3D3D3D',
          600: '#525252',
          500: '#737373',
          400: '#999999',
          300: '#BFBFBF',
          200: '#D9D9D9',
          100: '#ECECEC',
        },
        cobalt: {
          DEFAULT: '#244DDB',
          50: '#F0F3FD',
          100: '#E1E7FB',
          200: '#C3CEF8',
          500: '#244DDB',
          600: '#1D3EB0',
          700: '#17318C',
          900: '#0F1E54',
        },
        vibrant: {
          DEFAULT: '#FF7043',
          50: '#FFF3EE',
          100: '#FFE6DC',
          200: '#FFCEBA',
          500: '#FF7043',
          600: '#E65527',
          700: '#B83E16',
          900: '#692008',
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        serif: ['"Inter"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        display: ['"Inter"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'editorial': '0 1px 3px 0 rgba(37, 37, 37, 0.08)',
        'editorial-solid': '2px 2px 0px 0px #252525',
      },
    },
  },
  plugins: [],
}

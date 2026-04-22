/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#EAF3FB',
          100: '#CFE2F4',
          200: '#9CC4E9',
          300: '#6AA6DE',
          400: '#3989D3',
          500: '#1E73BE',
          600: '#185FA0',
          700: '#134B82',
          800: '#0E3663',
          900: '#092245',
        },
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #1E73BE 0%, #134B82 100%)',
        'brand-gradient-light': 'linear-gradient(135deg, #EAF3FB 0%, #CFE2F4 100%)',
      },
    },
  },
  plugins: [],
};

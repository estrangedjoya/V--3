/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        toy: {
          red: '#E63946',
          'red-dark': '#C52A35',
          'red-darker': '#A01F28',
          blue: '#457B9D',
          'blue-dark': '#355F7A',
          'blue-darker': '#2A4A5F',
          yellow: '#FFD700',
          'yellow-dark': '#E6C200',
          'yellow-darker': '#CCA700',
          purple: '#A8DADC',
          orange: '#F4A261',
          green: '#7EC850',
        },
        sky: {
          light: '#B4E4FF',
          DEFAULT: '#87CEEB',
          bright: '#5DADE2',
        },
        cloud: {
          white: '#FFFFFF',
          light: '#F8F9FA',
        }
      },
      fontFamily: {
        playful: ['"Baloo 2"', 'cursive'],
        comic: ['"Comic Neue"', 'cursive'],
        fredoka: ['"Fredoka"', 'sans-serif'],
      },
      boxShadow: {
        'toy': '8px 8px 0px rgba(69, 123, 157, 0.3)',
        'toy-hover': '12px 12px 0px rgba(230, 57, 70, 0.3)',
        'btn-red': '0 6px 0 #A01F28',
        'btn-blue': '0 6px 0 #2A4A5F',
        'btn-yellow': '0 6px 0 #CCA700',
      },
      animation: {
        'drift': 'drift linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'bounce-in': 'bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'wobble': 'wobble 0.5s ease-in-out',
      },
      keyframes: {
        drift: {
          'from': { transform: 'translateX(-200px)' },
          'to': { transform: 'translateX(calc(100vw + 200px))' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        bounceIn: {
          '0%': {
            opacity: '0',
            transform: 'scale(0.3) rotate(-10deg)'
          },
          '50%': {
            opacity: '1',
            transform: 'scale(1.05) rotate(5deg)'
          },
          '70%': {
            transform: 'scale(0.9) rotate(-2deg)'
          },
          '100%': {
            transform: 'scale(1) rotate(0deg)'
          },
        },
        wobble: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-5deg)' },
          '75%': { transform: 'rotate(5deg)' },
        },
      },
    },
  },
  plugins: [],
}

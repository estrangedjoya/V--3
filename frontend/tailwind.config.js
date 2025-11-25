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
        neon: {
          pink: '#ff00ff',
          cyan: '#00ffff',
          green: '#00ff00',
          yellow: '#ffff00',
          orange: '#ff6600',
          purple: '#9900ff',
        },
        retro: {
          dark: '#0a0a0f',
          darker: '#050508',
          card: '#12121a',
          border: '#2a2a3a',
        }
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'cursive'],
        arcade: ['"Orbitron"', 'sans-serif'],
      },
      boxShadow: {
        'neon-pink': '0 0 5px #ff00ff, 0 0 20px #ff00ff, 0 0 40px #ff00ff',
        'neon-cyan': '0 0 5px #00ffff, 0 0 20px #00ffff, 0 0 40px #00ffff',
        'neon-green': '0 0 5px #00ff00, 0 0 20px #00ff00, 0 0 40px #00ff00',
        'neon-purple': '0 0 5px #9900ff, 0 0 20px #9900ff, 0 0 40px #9900ff',
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'flicker': 'flicker 0.15s infinite',
        'scan': 'scan 8s linear infinite',
      },
      keyframes: {
        glow: {
          '0%': { textShadow: '0 0 5px #ff00ff, 0 0 10px #ff00ff' },
          '100%': { textShadow: '0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 30px #00ffff' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
    },
  },
  plugins: [],
}

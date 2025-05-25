/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'terminal': {
          'bg': '#0a0a0a',
          'bg-secondary': '#1a1a1a',
          'text': '#00ff00',
          'text-dim': '#00aa00',
          'cyan': '#00ffff',
          'yellow': '#ffff00',
          'red': '#ff0000',
          'white': '#ffffff',
          'gray': '#808080',
        },
        'network': {
          'success': '#00ff00',
          'warning': '#ffff00',
          'error': '#ff0000',
          'timeout': '#808080',
        }
      },
      fontFamily: {
        'mono': ['Consolas', 'Monaco', 'Courier New', 'monospace'],
      },
      animation: {
        'blink': 'blink 1s linear infinite',
        'typing': 'typing 2s steps(20) infinite',
      },
      keyframes: {
        blink: {
          '0%, 50%': { opacity: '1' },
          '51%, 100%': { opacity: '0' },
        },
        typing: {
          '0%': { width: '0' },
          '100%': { width: '100%' },
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
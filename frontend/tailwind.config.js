/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#2D1B0F',
          'dark-light': '#342013',
          'wood-light': '#F6EFE2',
          'wood-medium': '#EFE7DA',
          'wood-dark': '#342013',
          surface: '#F8F4EC',
          border: '#D8C8B0',
          primary: '#A35C33',
          'primary-hover': '#8B4C28',
          secondary: '#C48B47',
          'secondary-hover': '#A87235',
          accent: '#5C7B93',
          cream: '#F6EFE2',
          'cream-light': '#FAF5EC',
          muted: '#EFE7DA',
          card: '#FFFFFF',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'warm-sm': '0 2px 8px rgba(45, 27, 15, 0.04)',
        'warm-md': '0 4px 16px rgba(45, 27, 15, 0.06)',
        'warm-lg': '0 8px 30px rgba(45, 27, 15, 0.08)',
        'wood-card': '0 8px 30px rgba(45, 27, 15, 0.06)',
        'glow-accent': '0 0 20px rgba(196, 139, 71, 0.4)',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(163, 92, 51, 0.6)' },
          '50%': { boxShadow: '0 0 0 12px rgba(163, 92, 51, 0)' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(-6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          '0%': { opacity: '0', transform: 'translateY(-100%)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s infinite ease-in-out',
        'fade-in': 'fade-in 0.2s ease-out forwards',
        'slide-down': 'slide-down 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }
    },
  },
  plugins: [],
}




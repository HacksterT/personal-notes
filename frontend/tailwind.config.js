/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Library color palette
        'library-dark': '#2c1810',
        'library-brown': '#4a3429',
        'brass': '#d4af37',
        'brass-light': '#c9b037',
        'cream': '#f4f1e8',
        'parchment': '#ede8d3',
        'wood-dark': '#654321',
        'wood-light': '#8B4513',
      },
      fontFamily: {
        'crimson': ['Crimson Text', 'serif'],
        'cormorant': ['Cormorant Garamond', 'serif'],
      },
      backgroundImage: {
        'library-gradient': 'linear-gradient(135deg, #2c1810 0%, #4a3429 50%, #2c1810 100%)',
        'wood-grain': 'linear-gradient(135deg, #8B4513 0%, #654321 100%)',
        'brass-gradient': 'linear-gradient(90deg, #d4af37 0%, #c9b037 100%)',
      },
      boxShadow: {
        'book': '0 10px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(212, 175, 55, 0.3)',
        'brass': '0 0 20px rgba(212, 175, 55, 0.3)',
      },
      animation: {
        'door-open': 'doorOpen 1s ease-out forwards',
        'fade-in': 'fadeIn 1s ease-out forwards',
        'slide-in': 'slideIn 0.5s ease-out forwards',
      },
      keyframes: {
        doorOpen: {
          '0%': { transform: 'perspective(800px) rotateY(0deg)' },
          '100%': { transform: 'perspective(800px) rotateY(-90deg)' }
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideIn: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        }
      }
    },
  },
  plugins: [],
}
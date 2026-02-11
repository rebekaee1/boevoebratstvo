/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Патриотическая цветовая палитра
      colors: {
        // Основные цвета
        primary: {
          DEFAULT: '#1a3a5c',
          dark: '#0d2137',
          light: '#2a5a8c',
          50: '#e8f0f7',
          100: '#d1e1ef',
          200: '#a3c3df',
          300: '#75a5cf',
          400: '#4787bf',
          500: '#1a3a5c',
          600: '#152e4a',
          700: '#102337',
          800: '#0b1725',
          900: '#050c12',
        },
        // Акцентный красный
        accent: {
          red: {
            DEFAULT: '#c41e3a',
            dark: '#9a1830',
            light: '#e02548',
          },
          // Акцентный золотой
          gold: {
            DEFAULT: '#d4a017',
            dark: '#aa8012',
            light: '#f5b81c',
          },
          // Зелёный (лавр)
          green: {
            DEFAULT: '#2d5a3d',
            dark: '#1e3d29',
            light: '#3c7751',
          },
        },
        // Георгиевская лента
        george: {
          orange: '#ff6b00',
          black: '#1a1a1a',
        },
        // Фоновые цвета
        bg: {
          dark: '#0a1520',
          light: '#f5f3ef',
        },
        // Текстовые цвета - улучшенный контраст
        text: {
          light: '#ffffff',
          dark: '#1a1a1a',
          muted: '#c5d0db', // светлее для лучшей читаемости
        },
      },
      // Типографика - PT Serif + PT Sans для лучшей читаемости
      fontFamily: {
        display: ['PT Serif', 'Georgia', 'serif'],
        heading: ['PT Serif', 'Georgia', 'serif'],
        body: ['PT Sans', 'Arial', 'sans-serif'],
      },
      // Анимации
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'slide-in-right': 'slideInRight 0.5s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      // Тени
      boxShadow: {
        'gold': '0 4px 15px rgba(212, 160, 23, 0.3)',
        'gold-lg': '0 8px 25px rgba(212, 160, 23, 0.4)',
        'dark': '0 10px 40px rgba(0, 0, 0, 0.3)',
      },
      // Размеры
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      // Минимальные размеры для touch-friendly элементов
      minHeight: {
        'touch': '44px',
      },
      minWidth: {
        'touch': '44px',
      },
    },
  },
  plugins: [],
}

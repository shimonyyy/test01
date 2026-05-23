import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0f172a',
          50: '#f8fafc',
          100: '#f1f5f9',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          900: '#0f172a'
        }
      },
      fontFamily: {
        sans: ['"Pretendard"', '"Apple SD Gothic Neo"', 'system-ui', 'sans-serif']
      },
      minHeight: { tap: '44px' },
      minWidth: { tap: '44px' }
    }
  },
  plugins: []
} satisfies Config

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Modern Light Professional Color System
        primary: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#4A90E2',
          600: '#3B7DD6',
          700: '#2563EB',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        success: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
        },
        gray: {
          50: '#F8F9FA',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#1A1A1A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1.125rem', letterSpacing: '0.01em', fontWeight: '500' }],
        'sm': ['0.875rem', { lineHeight: '1.375rem', letterSpacing: '0', fontWeight: '500' }],
        'base': ['0.9375rem', { lineHeight: '1.5rem', letterSpacing: '0', fontWeight: '400' }],
        'lg': ['1.0625rem', { lineHeight: '1.625rem', letterSpacing: '-0.011em', fontWeight: '400' }],
        'xl': ['1.25rem', { lineHeight: '1.875rem', letterSpacing: '-0.014em', fontWeight: '500' }],
        '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.019em', fontWeight: '600' }],
        '3xl': ['2rem', { lineHeight: '2.375rem', letterSpacing: '-0.021em', fontWeight: '600' }],
        '4xl': ['2.5rem', { lineHeight: '2.75rem', letterSpacing: '-0.024em', fontWeight: '700' }],
        '5xl': ['3rem', { lineHeight: '3.25rem', letterSpacing: '-0.027em', fontWeight: '700' }],
        '6xl': ['3.75rem', { lineHeight: '4rem', letterSpacing: '-0.03em', fontWeight: '700' }],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        'soft': '0 4px 12px 0 rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 8px 24px 0 rgba(0, 0, 0, 0.10), 0 4px 8px -4px rgba(0, 0, 0, 0.06)',
        'large': '0 20px 60px 0 rgba(0, 0, 0, 0.12), 0 8px 24px -8px rgba(0, 0, 0, 0.08)',
        'glow': '0 0 20px rgba(37, 99, 235, 0.15)',
        'glow-lg': '0 0 40px rgba(37, 99, 235, 0.20)',
        'inner-glow': 'inset 0 0 0 1px rgba(0, 0, 0, 0.04)',
      },
      borderRadius: {
        'sm': '0.375rem',
        'DEFAULT': '0.5rem',
        'md': '0.625rem',
        'lg': '0.875rem',
        'xl': '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-dark': 'linear-gradient(180deg, #18191d 0%, #0f1014 100%)',
        'gradient-elevated': 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
        'gradient-accent': 'linear-gradient(135deg, #4f9eff 0%, #3b82f6 100%)',
        'gradient-border': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
    },
  },
  plugins: [],
};
export default config;

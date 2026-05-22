import type { Config } from 'tailwindcss';

// ADR-0009 (사이드바, 가독성 우선 톤) + ADR-0015 (Pretendard, lucide, 16:9)

const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Pretendard',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Apple SD Gothic Neo"',
          '"Noto Sans KR"',
          '"Malgun Gothic"',
          'sans-serif',
        ],
      },
      fontSize: {
        // ADR-0009 가독성 우선 — 본문 16~17px, line-height 1.55+
        base: ['1.0625rem', { lineHeight: '1.6', letterSpacing: '-0.005em' }],
        sm: ['0.9375rem', { lineHeight: '1.55' }],
        xs: ['0.8125rem', { lineHeight: '1.5' }],
        lg: ['1.1875rem', { lineHeight: '1.55', letterSpacing: '-0.01em' }],
        xl: ['1.375rem', { lineHeight: '1.4', letterSpacing: '-0.015em' }],
        '2xl': ['1.625rem', { lineHeight: '1.3', letterSpacing: '-0.02em' }],
        '3xl': ['2rem', { lineHeight: '1.25', letterSpacing: '-0.025em' }],
      },
      colors: {
        // 의미 기반 색상 토큰. dark mode는 .dark 클래스 prefix.
        bg: {
          DEFAULT: '#ffffff',
          subtle: '#f7f7f8',
          sidebar: '#fafafa',
        },
        fg: {
          DEFAULT: '#0f0f10',
          muted: '#52525b',
          subtle: '#71717a',
        },
        border: {
          DEFAULT: '#e5e5e7',
          subtle: '#efefef',
        },
        accent: {
          DEFAULT: '#4f46e5',
          subtle: '#e0e7ff',
          fg: '#4338ca',
        },
      },
      maxWidth: {
        prose: '68ch',
      },
    },
  },
  plugins: [],
};

export default config;

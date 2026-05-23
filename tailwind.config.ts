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
        '3xl': ['2rem', { lineHeight: '1.2', letterSpacing: '-0.025em' }],
        '4xl': ['2.5rem', { lineHeight: '1.15', letterSpacing: '-0.03em' }],
        '5xl': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.035em' }],
      },
      colors: {
        // 의미 기반 토큰 — globals.css의 CSS 변수에 연동, .dark 자동 전환.
        bg: {
          DEFAULT: 'rgb(var(--color-bg) / <alpha-value>)',
          subtle: 'rgb(var(--color-bg-subtle) / <alpha-value>)',
          sidebar: 'rgb(var(--color-bg-sidebar) / <alpha-value>)',
        },
        fg: {
          DEFAULT: 'rgb(var(--color-fg) / <alpha-value>)',
          muted: 'rgb(var(--color-fg-muted) / <alpha-value>)',
          subtle: 'rgb(var(--color-fg-subtle) / <alpha-value>)',
        },
        border: {
          DEFAULT: 'rgb(var(--color-border) / <alpha-value>)',
          subtle: 'rgb(var(--color-border-subtle) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--color-accent) / <alpha-value>)',
          subtle: 'rgb(var(--color-accent-subtle) / <alpha-value>)',
          fg: 'rgb(var(--color-accent-fg) / <alpha-value>)',
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

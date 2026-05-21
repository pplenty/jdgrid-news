'use client';

// 미니멀 헤더 (ADR-0009): 로고 + 우상단 액션 (날짜·테마 토글). 모바일 ☰ 버튼.

import Link from 'next/link';
import { Menu, Monitor, Moon, Sun } from 'lucide-react';

import { cn } from '@/lib/utils';
import { formatDateLabel } from '@/lib/utils';

import { useTheme, type Theme } from './ThemeProvider';

type Props = {
  date: string;
  onOpenDrawer?: () => void;
};

export function Header({ date, onOpenDrawer }: Props) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-border bg-bg/85 px-4 backdrop-blur lg:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="open menu"
          onClick={onOpenDrawer}
          className="rounded-md p-1.5 text-fg-muted hover:bg-bg-subtle hover:text-fg lg:hidden"
        >
          <Menu size={20} />
        </button>
        <Link href="/" className="text-base font-bold tracking-tight lg:hidden">
          news
        </Link>
      </div>

      <div className="flex items-center gap-3 text-sm text-fg-muted">
        <span className="hidden sm:inline tabular-nums">{formatDateLabel(date)}</span>
        <ThemeToggle />
      </div>
    </header>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const options: { value: Theme; icon: React.ComponentType<{ size?: number }>; label: string }[] = [
    { value: 'light', icon: Sun, label: '라이트' },
    { value: 'system', icon: Monitor, label: '시스템' },
    { value: 'dark', icon: Moon, label: '다크' },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="테마"
      className="inline-flex items-center rounded-full border border-border bg-bg-subtle p-0.5"
    >
      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={theme === value}
          aria-label={label}
          onClick={() => setTheme(value)}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-full transition-colors',
            theme === value ? 'bg-bg text-fg shadow-sm' : 'text-fg-subtle hover:text-fg',
          )}
        >
          <Icon size={14} />
        </button>
      ))}
    </div>
  );
}

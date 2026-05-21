'use client';

// ADR-0009: 시스템 follow + 사용자 토글 (system/light/dark 3-state) + LocalStorage 저장 + FOUC 방지.
// 사전 적용은 layout.tsx의 ThemeScript(inline) 가 페이지 첫 페인트 전에 처리.

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Theme = 'system' | 'light' | 'dark';
const STORAGE_KEY = 'jdgrid-theme';

type ThemeContextValue = {
  theme: Theme;
  resolved: 'light' | 'dark';
  setTheme: (t: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readSystem(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function readStored(): Theme {
  if (typeof window === 'undefined') return 'system';
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === 'light' || v === 'dark' || v === 'system' ? v : 'system';
}

function applyResolved(resolved: 'light' | 'dark'): void {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', resolved === 'dark');
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [systemResolved, setSystemResolved] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    setThemeState(readStored());
    setSystemResolved(readSystem());
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setSystemResolved(mql.matches ? 'dark' : 'light');
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  const resolved = theme === 'system' ? systemResolved : theme;

  useEffect(() => {
    applyResolved(resolved);
  }, [resolved]);

  function setTheme(t: Theme) {
    setThemeState(t);
    if (typeof window !== 'undefined') {
      if (t === 'system') window.localStorage.removeItem(STORAGE_KEY);
      else window.localStorage.setItem(STORAGE_KEY, t);
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const v = useContext(ThemeContext);
  if (!v) throw new Error('useTheme must be used within ThemeProvider');
  return v;
}

/** layout.tsx의 <head>에 dangerouslySetInnerHTML로 박는 inline 사전 적용 스크립트. */
export const THEME_INIT_SCRIPT = `
(function(){try{
  var s=localStorage.getItem('${STORAGE_KEY}');
  var d=s==='dark'||(s!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);
  if(d)document.documentElement.classList.add('dark');
}catch(_){}})();
`.trim();

'use client';

// ADR-0009: 시스템 follow + 사용자 토글 (system/light/dark 3-state) + LocalStorage 저장 + FOUC 방지.
// 사전 적용은 layout.tsx의 ThemeScript(inline) 가 페이지 첫 페인트 전에 처리.

import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from 'react';

import {
  readLocalStorage,
  subscribeLocalStorage,
  writeLocalStorage,
} from '@/lib/local-storage-store';

export type Theme = 'system' | 'light' | 'dark';
const STORAGE_KEY = 'jdgrid-theme';

type ThemeContextValue = {
  theme: Theme;
  resolved: 'light' | 'dark';
  setTheme: (t: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const DARK_QUERY = '(prefers-color-scheme: dark)';

function readSystem(): 'light' | 'dark' {
  return window.matchMedia?.(DARK_QUERY).matches ? 'dark' : 'light';
}

function subscribeSystem(onChange: () => void): () => void {
  const mql = window.matchMedia(DARK_QUERY);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
}

function readStored(): Theme {
  const v = readLocalStorage(STORAGE_KEY);
  return v === 'light' || v === 'dark' || v === 'system' ? v : 'system';
}

// 서버 스냅샷 = 기본값. 첫 페인트는 layout 의 THEME_INIT_SCRIPT 가 이미 맞춰 둔다.
const serverTheme = (): Theme => 'system';
const serverSystem = (): 'light' | 'dark' => 'light';

// 하이드레이션 패스 여부 — 서버 스냅샷 동안은 false, 직후 재렌더부터 true.
const subscribeNothing = () => () => {};
const clientHydrated = () => true;
const serverHydrated = () => false;

function applyResolved(resolved: 'light' | 'dark'): void {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', resolved === 'dark');
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribeLocalStorage, readStored, serverTheme);
  const systemResolved = useSyncExternalStore(subscribeSystem, readSystem, serverSystem);

  const hydrated = useSyncExternalStore(subscribeNothing, clientHydrated, serverHydrated);
  const resolved = theme === 'system' ? systemResolved : theme;

  // 하이드레이션 패스의 resolved 는 서버 기본값(light)이라, 이때 적용하면 INIT 스크립트가 붙인
  // dark 를 떼었다가 다시 붙이며 한 프레임 깜빡인다(프로덕션에서 측정) → 실제 값부터 적용.
  useEffect(() => {
    if (hydrated) applyResolved(resolved);
  }, [hydrated, resolved]);

  function setTheme(t: Theme) {
    writeLocalStorage(STORAGE_KEY, t === 'system' ? null : t);
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

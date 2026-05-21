'use client';

// Sidebar + Header + drawer state를 묶는 클라이언트 쉘.
// layout.tsx(server)에서 data를 props로 받아 children을 슬롯으로 표시.
// active 카테고리는 usePathname 기반 자동 추출.

import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

import { CATEGORY_IDS, type CategoryId } from '@/lib/categories';
import type { SidebarData } from '@/lib/data';

import { Header } from './Header';
import { Sidebar } from './Sidebar';

function extractActiveCategory(pathname: string | null): CategoryId | undefined {
  if (!pathname) return undefined;
  const m = pathname.match(/^\/c\/([^/]+)/);
  if (!m) return undefined;
  const id = m[1] as CategoryId;
  return CATEGORY_IDS.includes(id) ? id : undefined;
}

export function ClientShell({
  children,
  sidebarData,
}: {
  children: ReactNode;
  sidebarData: SidebarData;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const activeCategory = extractActiveCategory(pathname);

  // 경로 변경 시 드로어 닫기 (모바일에서 카테고리 클릭 후).
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen">
      <Sidebar
        data={sidebarData}
        activeCategory={activeCategory}
        drawerOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header date={sidebarData.date} onOpenDrawer={() => setDrawerOpen(true)} />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-border-subtle px-4 py-6 text-xs text-fg-subtle lg:px-8">
          데이터 출처 · 면책 ·{' '}
          <a href="/about/" className="hover:text-fg">
            About
          </a>
        </footer>
      </div>
    </div>
  );
}

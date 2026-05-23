'use client';

// Sidebar + Header + drawer state를 묶는 클라이언트 쉘.
// ADR-0009 가변 폭(접기) 약속 이행 — 데스크탑에서 사이드바 토글, LocalStorage 기억.

import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

import { CATEGORY_IDS, type CategoryId } from '@/lib/categories';
import type { SidebarData } from '@/lib/data';

import { Header } from './Header';
import { Sidebar } from './Sidebar';

const COLLAPSED_KEY = 'jdgrid-sidebar-collapsed';

function extractActiveCategory(pathname: string | null): CategoryId | undefined {
  if (!pathname) return undefined;
  const m = pathname.match(/^\/c\/([^/]+)/);
  if (!m) return undefined;
  const id = m[1] as CategoryId;
  return CATEGORY_IDS.includes(id) ? id : undefined;
}

export function ClientShell({
  children,
  footer,
  sidebarData,
}: {
  children: ReactNode;
  footer: ReactNode;
  sidebarData: SidebarData;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const activeCategory = extractActiveCategory(pathname);

  // 초기 로드 시 LocalStorage 반영.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.localStorage.getItem(COLLAPSED_KEY) === '1') setCollapsed(true);
  }, []);

  // 경로 변경 시 드로어 닫기 (모바일에서 카테고리 클릭 후).
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  function toggleCollapsed() {
    setCollapsed((c) => {
      const next = !c;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(COLLAPSED_KEY, next ? '1' : '0');
      }
      return next;
    });
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        data={sidebarData}
        activeCategory={activeCategory}
        drawerOpen={drawerOpen}
        collapsed={collapsed}
        onClose={() => setDrawerOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          date={sidebarData.date}
          sidebarCollapsed={collapsed}
          onOpenDrawer={() => setDrawerOpen(true)}
          onToggleSidebar={toggleCollapsed}
        />
        <main className="flex-1">{children}</main>
        {footer}
      </div>
    </div>
  );
}

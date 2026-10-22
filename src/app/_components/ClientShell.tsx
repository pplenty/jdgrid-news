'use client';

// Sidebar + Header + drawer state를 묶는 클라이언트 쉘.
// ADR-0009 가변 폭(접기) 약속 이행 — 데스크탑에서 사이드바 토글, LocalStorage 기억.

import { usePathname } from 'next/navigation';
import { useState, useSyncExternalStore, type ReactNode } from 'react';

import { CATEGORY_IDS, type CategoryId } from '@/lib/categories';
import type { SidebarData } from '@/lib/data';
import {
  readLocalStorage,
  subscribeLocalStorage,
  writeLocalStorage,
} from '@/lib/local-storage-store';

import { Header } from './Header';
import { Sidebar } from './Sidebar';

const COLLAPSED_KEY = 'jdgrid-sidebar-collapsed';

const readCollapsed = () => readLocalStorage(COLLAPSED_KEY) === '1';
const serverCollapsed = () => false;

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
  const [drawerPathname, setDrawerPathname] = useState(pathname);
  // LocalStorage 에 기억한 접힘 상태 — 정적 HTML 은 펼친 상태로 그리고 하이드레이션 직후 반영.
  const collapsed = useSyncExternalStore(subscribeLocalStorage, readCollapsed, serverCollapsed);
  const activeCategory = extractActiveCategory(pathname);

  // 경로 변경 시 드로어 닫기 (모바일에서 카테고리 클릭 후). effect 대신 렌더 중 이전 경로와
  // 비교 — React 권장 "prop 변경 시 state 조정" 패턴.
  if (pathname !== drawerPathname) {
    setDrawerPathname(pathname);
    setDrawerOpen(false);
  }

  function toggleCollapsed() {
    writeLocalStorage(COLLAPSED_KEY, collapsed ? '0' : '1');
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

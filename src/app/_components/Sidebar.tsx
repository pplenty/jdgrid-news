'use client';

// ADR-0009 사이드바: 카테고리 (옆에 N) + TRENDING (글로벌/국내) + About/GitHub.
// 모바일은 ClientShell의 drawer 상태로 열림. 가변 폭(접기 가능)는 v2.

import Link from 'next/link';
import { X, Hash } from 'lucide-react';

import { CATEGORY_IDS, CATEGORY_LABELS, type CategoryId } from '@/lib/categories';
import type { SidebarData } from '@/lib/data';
import { cn } from '@/lib/utils';

import { GithubIcon } from './icons';

type Props = {
  data: SidebarData;
  activeCategory?: CategoryId;
  drawerOpen?: boolean;
  onClose?: () => void;
};

export function Sidebar({ data, activeCategory, drawerOpen = false, onClose }: Props) {
  return (
    <>
      {/* 모바일 드로어 배경 */}
      <button
        type="button"
        aria-label="close menu"
        onClick={onClose}
        className={cn(
          'fixed inset-0 z-30 bg-black/40 lg:hidden',
          drawerOpen ? 'block' : 'hidden',
        )}
      />
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-screen w-64 shrink-0 overflow-y-auto',
          'border-r border-border bg-bg-sidebar scrollbar-thin',
          'transition-transform lg:translate-x-0 lg:sticky',
          drawerOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="flex h-14 items-center justify-between px-5 lg:hidden">
          <span className="text-base font-bold tracking-tight">jdgrid·news</span>
          <button
            type="button"
            aria-label="close"
            onClick={onClose}
            className="rounded-md p-1 text-fg-muted hover:text-fg"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="px-3 pt-2 pb-6">
          <SectionTitle>Categories</SectionTitle>
          <ul className="mt-1">
            {CATEGORY_IDS.map((id) => (
              <li key={id}>
                <CategoryLink
                  id={id}
                  count={data.counts[id]}
                  active={activeCategory === id}
                  onNavigate={onClose}
                />
              </li>
            ))}
          </ul>

          <SectionTitle className="mt-7">Trending</SectionTitle>
          <TrendBlock label="🌐 Global" trends={data.trends.global} onNavigate={onClose} />
          <TrendBlock label="🇰🇷 Korea" trends={data.trends.kr} onNavigate={onClose} />

          <div className="mt-8 border-t border-border-subtle pt-4 text-sm">
            <ul className="space-y-1.5">
              <li>
                <Link
                  href="/about/"
                  onClick={onClose}
                  className="text-fg-muted hover:text-fg"
                >
                  About
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/pplenty/jdgrid-news"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1.5 text-fg-muted hover:text-fg"
                >
                  <GithubIcon size={14} /> GitHub
                </a>
              </li>
            </ul>
          </div>
        </nav>
      </aside>
    </>
  );
}

function SectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3
      className={cn(
        'px-2 text-xs font-semibold uppercase tracking-wider text-fg-subtle',
        className,
      )}
    >
      {children}
    </h3>
  );
}

function CategoryLink({
  id,
  count,
  active,
  onNavigate,
}: {
  id: CategoryId;
  count: number;
  active: boolean;
  onNavigate?: () => void;
}) {
  const href = id === 'top' ? '/' : `/c/${id}/`;
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        'group relative flex items-center justify-between rounded-md px-2 py-1.5 text-sm',
        active ? 'bg-bg-subtle font-semibold text-fg' : 'text-fg-muted hover:bg-bg-subtle hover:text-fg',
      )}
    >
      {active && (
        <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-accent" />
      )}
      <span className="pl-1.5">{CATEGORY_LABELS[id].ko}</span>
      <span className="text-xs text-fg-subtle tabular-nums">{count}</span>
    </Link>
  );
}

function TrendBlock({
  label,
  trends,
  onNavigate,
}: {
  label: string;
  trends: { keyword: string }[];
  onNavigate?: () => void;
}) {
  if (trends.length === 0) {
    return (
      <div className="mt-2 px-2">
        <p className="mb-1 text-xs font-medium text-fg-muted">{label}</p>
        <p className="text-xs text-fg-subtle">데이터 없음</p>
      </div>
    );
  }
  return (
    <div className="mt-2 px-2">
      <p className="mb-1 text-xs font-medium text-fg-muted">{label}</p>
      <ul className="space-y-0.5">
        {trends.slice(0, 8).map((t) => (
          <li key={t.keyword}>
            <Link
              href={`/k/${encodeURIComponent(t.keyword)}/`}
              onClick={onNavigate}
              className="inline-flex max-w-full items-center gap-1 truncate text-sm text-fg-muted hover:text-fg"
            >
              <Hash size={12} className="shrink-0 text-fg-subtle" />
              <span className="truncate">{t.keyword}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

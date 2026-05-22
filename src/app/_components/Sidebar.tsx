'use client';

// ADR-0009 사이드바: 로고 + 카테고리(아이콘+카운트 pill) + TRENDING(순위 칩) + About.
// 모바일은 ClientShell의 drawer 상태로 열림.

import Link from 'next/link';
import { ArrowRight, Hash, LayoutGrid, TrendingUp, X } from 'lucide-react';

import { CATEGORY_IDS, CATEGORY_LABELS, type CategoryId } from '@/lib/categories';
import type { SidebarData } from '@/lib/data';
import type { Trend } from '@/lib/types';
import { cn } from '@/lib/utils';

import { CATEGORY_ICONS } from './categoryIcons';
import { ConstellationMark } from './icons';

type Props = {
  data: SidebarData;
  activeCategory?: CategoryId;
  drawerOpen?: boolean;
  onClose?: () => void;
};

export function Sidebar({ data, activeCategory, drawerOpen = false, onClose }: Props) {
  return (
    <>
      <button
        type="button"
        aria-label="close menu"
        onClick={onClose}
        className={cn('fixed inset-0 z-30 bg-black/40 lg:hidden', drawerOpen ? 'block' : 'hidden')}
      />
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-screen w-64 shrink-0 overflow-y-auto',
          'border-r border-border bg-bg-sidebar scrollbar-thin',
          'transition-transform lg:translate-x-0 lg:sticky',
          drawerOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-border-subtle px-5">
          <Link
            href="/"
            onClick={onClose}
            className="flex items-center gap-1.5 text-base font-bold tracking-tight"
            aria-label="trends 홈"
          >
            <ConstellationMark />
            trends
          </Link>
          <button
            type="button"
            aria-label="close"
            onClick={onClose}
            className="rounded-md p-1 text-fg-muted hover:text-fg lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="px-3 pt-4 pb-6">
          <div className="flex items-center justify-between">
            <SectionHeader icon={LayoutGrid}>카테고리</SectionHeader>
            <Link
              href="/headlines/"
              onClick={onClose}
              className="inline-flex items-center gap-0.5 px-2 text-[10px] font-medium text-fg-subtle hover:text-fg"
            >
              Headlines <ArrowRight size={10} />
            </Link>
          </div>
          <ul className="mt-2 space-y-0.5">
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

          <div className="mt-7">
            <div className="flex items-center justify-between">
              <SectionHeader icon={TrendingUp}>트렌딩</SectionHeader>
              <Link
                href="/trends/"
                onClick={onClose}
                className="inline-flex items-center gap-0.5 px-2 text-[10px] font-medium text-fg-subtle hover:text-fg"
              >
                상세 <ArrowRight size={10} />
              </Link>
            </div>
            <TrendBlock label="🇰🇷 국내" trends={data.trends.kr} onNavigate={onClose} />
            <TrendBlock label="🌐 글로벌" trends={data.trends.global} onNavigate={onClose} />
          </div>

          <div className="mt-8 border-t border-border-subtle pt-4">
            <Link
              href="/about/"
              onClick={onClose}
              className="block rounded-md px-2 py-1.5 text-sm text-fg-muted hover:bg-bg-subtle hover:text-fg"
            >
              About
            </Link>
          </div>
        </nav>
      </aside>
    </>
  );
}

function SectionHeader({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5 px-2 text-xs font-semibold uppercase tracking-wider text-fg-subtle">
      <Icon size={12} className="opacity-70" />
      <span>{children}</span>
    </div>
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
  const Icon = CATEGORY_ICONS[id];
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        'group relative flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
        active
          ? 'bg-accent-subtle text-accent-fg'
          : 'text-fg-muted hover:bg-bg-subtle hover:text-fg',
      )}
    >
      {active && (
        <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r-full bg-accent" />
      )}
      <Icon
        size={15}
        className={cn(
          'shrink-0 transition-colors',
          active ? 'text-accent' : 'text-fg-subtle group-hover:text-fg-muted',
        )}
      />
      <span className={cn('truncate', active && 'font-semibold')}>{CATEGORY_LABELS[id].ko}</span>
      <CountBadge count={count} active={active} />
    </Link>
  );
}

function CountBadge({ count, active }: { count: number; active: boolean }) {
  return (
    <span
      className={cn(
        'ml-auto inline-flex h-5 min-w-[1.4rem] items-center justify-center rounded-full px-1.5 text-[10px] font-semibold tabular-nums',
        active
          ? 'bg-accent/15 text-accent-fg'
          : 'bg-bg-subtle text-fg-subtle group-hover:bg-bg group-hover:text-fg-muted',
      )}
    >
      {count}
    </span>
  );
}

function TrendBlock({
  label,
  trends,
  onNavigate,
}: {
  label: string;
  trends: Trend[];
  onNavigate?: () => void;
}) {
  if (trends.length === 0) {
    return (
      <div className="mt-3 px-2">
        <p className="mb-1 text-xs font-medium text-fg-muted">{label}</p>
        <p className="text-xs text-fg-subtle">데이터 없음</p>
      </div>
    );
  }
  return (
    <div className="mt-3 px-2">
      <p className="mb-1.5 text-xs font-medium text-fg-muted">{label}</p>
      <ol className="space-y-0.5">
        {trends.slice(0, 6).map((t, idx) => (
          <li key={t.keyword}>
            <Link
              href={`/k/${encodeURIComponent(t.keyword)}/`}
              onClick={onNavigate}
              className="group flex items-center gap-1.5 rounded-md py-0.5 text-sm text-fg-muted hover:text-fg"
            >
              <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center text-[10px] font-semibold tabular-nums text-fg-subtle group-hover:text-fg-muted">
                {idx + 1}
              </span>
              <Hash size={11} className="shrink-0 text-fg-subtle" />
              <span className="min-w-0 flex-1 truncate">{t.keyword}</span>
              {t.traffic && (
                <span className="shrink-0 text-[10px] tabular-nums text-fg-subtle">
                  {t.traffic}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}

// 메인 페이지 hero 영역 — ADR-0021 (재디자인).
// 매거진 레이아웃: TOP 3 큰 정사각 카드 + 4~10위 작은 리스트.

import Link from 'next/link';
import { ArrowRight, Flame } from 'lucide-react';

import type { Trend } from '@/lib/types';
import { cn, formatDateLabel } from '@/lib/utils';

type Props = {
  kr: Trend[];
  global: Trend[];
  date: string;
};

export function TrendingHero({ kr, global, date }: Props) {
  if (kr.length === 0 && global.length === 0) return null;

  return (
    <section
      aria-label="오늘의 트렌드"
      className="border-b border-border bg-gradient-to-br from-accent-subtle/60 via-accent-subtle/10 to-bg"
    >
      <div className="px-4 py-10 lg:px-8 lg:py-14">
        <header className="mb-8 flex flex-wrap items-end gap-x-4 gap-y-2">
          <h1 className="flex items-center gap-2.5 text-3xl font-black tracking-tight md:text-4xl">
            <Flame className="text-accent" size={32} />
            오늘의 트렌드
          </h1>
          <span className="text-sm text-fg-muted">
            {formatDateLabel(date)} · via Google Trends
          </span>
          <Link
            href="/trends/"
            className="ml-auto inline-flex items-center gap-1 rounded-full border border-border bg-bg px-3 py-1.5 text-sm font-medium text-fg-muted shadow-sm transition-colors hover:border-accent hover:text-accent-fg"
          >
            카테고리별 상세
            <ArrowRight size={14} />
          </Link>
        </header>

        <div className="grid gap-10 lg:grid-cols-2">
          <GeoBlock label="🇰🇷 한국" trends={kr} />
          <GeoBlock label="🌐 글로벌" trends={global} />
        </div>
      </div>
    </section>
  );
}

function GeoBlock({ label, trends }: { label: string; trends: Trend[] }) {
  if (trends.length === 0) return null;
  const tops = trends.slice(0, 3);
  const rest = trends.slice(3, 10);
  return (
    <div>
      <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-fg-muted">{label}</h2>
      {/* TOP 3 */}
      <div className="grid grid-cols-3 gap-3">
        {tops.map((t, idx) => (
          <BigCard key={t.keyword} rank={idx + 1} trend={t} />
        ))}
      </div>
      {/* 4~10위 */}
      {rest.length > 0 && (
        <ol className="mt-4 space-y-0.5">
          {rest.map((t, idx) => (
            <li key={t.keyword}>
              <SmallRow rank={idx + 4} trend={t} />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function BigCard({ rank, trend }: { rank: number; trend: Trend }) {
  return (
    <Link
      href={`/k/${encodeURIComponent(trend.keyword)}/`}
      className="group block"
    >
      <div className="relative aspect-square overflow-hidden rounded-lg bg-bg-subtle ring-1 ring-border-subtle">
        {trend.picture ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={trend.picture}
            alt={trend.keyword}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl font-black text-fg-subtle">
            {rank}
          </div>
        )}
        <span className="absolute left-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-bg/90 text-sm font-black tabular-nums text-fg shadow-sm">
          {rank}
        </span>
      </div>
      <div className="mt-2">
        <p className="line-clamp-2 text-base font-bold leading-tight tracking-tight group-hover:text-accent-fg">
          {trend.keyword}
        </p>
        <p className="mt-0.5 text-xs text-fg-subtle">
          {trend.traffic ?? `${trend.relatedUrls.length}건 매칭`}
          {trend.googleArticles?.[0]?.source && ` · ${trend.googleArticles[0].source}`}
        </p>
      </div>
    </Link>
  );
}

function SmallRow({ rank, trend }: { rank: number; trend: Trend }) {
  return (
    <Link
      href={`/k/${encodeURIComponent(trend.keyword)}/`}
      className={cn(
        'group flex items-center gap-3 rounded-md px-2 py-1.5',
        'hover:bg-bg/80',
      )}
    >
      <span className="w-5 shrink-0 text-center text-sm font-bold tabular-nums text-fg-subtle">
        {rank}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-fg group-hover:text-accent-fg">
        {trend.keyword}
      </span>
      {trend.traffic && (
        <span className="shrink-0 text-xs tabular-nums text-fg-subtle">{trend.traffic}</span>
      )}
      {trend.relatedUrls.length > 0 && (
        <span className="shrink-0 rounded-full bg-bg/70 px-1.5 text-[10px] font-semibold tabular-nums text-fg-muted">
          {trend.relatedUrls.length}
        </span>
      )}
    </Link>
  );
}

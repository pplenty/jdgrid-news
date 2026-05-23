// 메인 페이지 hero 영역 — ADR-0021 + 모바일 압축.
// 데스크탑: TOP 3 큰 정사각 카드 + 4~10위 리스트
// 모바일: TOP 1만 정사각 카드(w-3/4) + 2~10 작은 리스트

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
      <div className="px-4 py-8 lg:px-8 lg:py-14">
        <header className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-2 lg:mb-8">
          <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight md:text-4xl">
            <Flame className="text-accent" size={28} />
            오늘의 트렌드
          </h1>
          <span className="text-xs text-fg-muted md:text-sm">
            {formatDateLabel(date)} · via Google Trends
          </span>
          <Link
            href="/trends/"
            className="ml-auto inline-flex items-center gap-1 rounded-full border border-border bg-bg px-3 py-1.5 text-xs font-medium text-fg-muted shadow-sm transition-colors hover:border-accent hover:text-accent-fg md:text-sm"
          >
            카테고리별 상세
            <ArrowRight size={14} />
          </Link>
        </header>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
          <GeoBlock label="🇰🇷 한국" trends={kr} />
          <GeoBlock label="🌐 글로벌" trends={global} />
        </div>
      </div>
    </section>
  );
}

function GeoBlock({ label, trends }: { label: string; trends: Trend[] }) {
  if (trends.length === 0) return null;
  const first = trends[0];
  const middle = trends.slice(1, 3); // 2, 3위
  const rest = trends.slice(3, 10); // 4-10위

  return (
    <div>
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-fg-muted lg:mb-4">
        {label}
      </h2>

      {/* TOP 1~3: 모바일은 TOP 1만 작은 카드, sm+는 3 카드 그리드 */}
      <div className="grid gap-3 sm:grid-cols-3">
        {first && (
          <div className="mx-auto w-2/3 sm:mx-0 sm:w-auto">
            <BigCard rank={1} trend={first} />
          </div>
        )}
        {middle.map((t, idx) => (
          <div key={t.keyword} className="hidden sm:block">
            <BigCard rank={idx + 2} trend={t} />
          </div>
        ))}
      </div>

      {/* 모바일: 2, 3위를 작은 리스트로 흡수 */}
      {middle.length > 0 && (
        <ol className="mt-2 space-y-0.5 sm:hidden">
          {middle.map((t, idx) => (
            <li key={t.keyword}>
              <SmallRow rank={idx + 2} trend={t} />
            </li>
          ))}
        </ol>
      )}

      {/* 4~10위: 모든 화면에서 작은 리스트 */}
      {rest.length > 0 && (
        <ol className="mt-3 space-y-0.5 lg:mt-4">
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
    <Link href={`/k/${encodeURIComponent(trend.keyword)}/`} className="group block">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-bg-subtle ring-1 ring-border-subtle">
        {trend.picture ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={trend.picture}
            alt={trend.keyword}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
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
        'group flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors',
        'hover:bg-bg-subtle',
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

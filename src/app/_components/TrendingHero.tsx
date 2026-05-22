// 메인 페이지 hero 영역 — ADR-0021.
// TrendingBanner의 hero variant: KR/Global top 5 큰 카드 + 강조 톤.

import Link from 'next/link';
import { ArrowRight, TrendingUp } from 'lucide-react';

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
      className="border-b border-border-subtle bg-gradient-to-br from-accent-subtle/30 via-bg to-bg"
    >
      <div className="px-4 py-8 lg:px-8 lg:py-10">
        <header className="mb-6 flex flex-wrap items-end gap-x-3 gap-y-1">
          <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-tight">
            <TrendingUp className="text-accent" />
            오늘의 트렌드
          </h1>
          <span className="text-sm text-fg-muted">{formatDateLabel(date)}</span>
          <Link
            href="/trends/"
            className="ml-auto inline-flex items-center gap-1 text-sm font-medium text-accent-fg hover:underline"
          >
            카테고리별 상세
            <ArrowRight size={14} />
          </Link>
        </header>

        <div className="grid gap-x-6 gap-y-6 lg:grid-cols-2">
          <TrendColumn label="🇰🇷 한국" trends={kr} />
          <TrendColumn label="🌐 글로벌" trends={global} />
        </div>

        <p className="mt-6 text-xs text-fg-subtle">
          via Google Trends · 키워드 클릭 시 매칭된 기사 + Google 큐레이션 외부 기사
        </p>
      </div>
    </section>
  );
}

function TrendColumn({ label, trends }: { label: string; trends: Trend[] }) {
  if (trends.length === 0) return null;
  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-fg-muted">{label}</p>
      <ol className="space-y-1.5">
        {trends.slice(0, 5).map((t, idx) => (
          <li key={t.keyword}>
            <TrendRow trend={t} rank={idx + 1} />
          </li>
        ))}
      </ol>
    </div>
  );
}

function TrendRow({ trend, rank }: { trend: Trend; rank: number }) {
  const lead = trend.googleArticles?.[0];
  const subtitle =
    trend.traffic && lead
      ? `${trend.traffic} · ${lead.source}`
      : trend.traffic ?? lead?.source ?? trend.description;

  return (
    <Link
      href={`/k/${encodeURIComponent(trend.keyword)}/`}
      className="group flex items-center gap-4 rounded-lg border border-transparent px-2 py-2 transition-all hover:border-border-subtle hover:bg-bg"
    >
      <span className="w-6 shrink-0 text-center text-base font-bold tabular-nums text-fg-subtle group-hover:text-accent-fg">
        {rank}
      </span>
      <Thumbnail src={trend.picture} alt={trend.keyword} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-lg font-bold leading-tight text-fg group-hover:text-accent-fg">
          {trend.keyword}
        </p>
        {subtitle && <p className="mt-0.5 truncate text-sm text-fg-muted">{subtitle}</p>}
      </div>
      {trend.relatedUrls.length > 0 && (
        <span className="shrink-0 rounded-full bg-bg-subtle px-2 py-0.5 text-[11px] font-semibold tabular-nums text-fg-muted">
          {trend.relatedUrls.length}
        </span>
      )}
    </Link>
  );
}

function Thumbnail({ src, alt }: { src?: string; alt: string }) {
  return (
    <div
      className={cn(
        'h-12 w-12 shrink-0 overflow-hidden rounded-md bg-bg-subtle',
        !src && 'border border-border-subtle',
      )}
    >
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
        />
      )}
    </div>
  );
}

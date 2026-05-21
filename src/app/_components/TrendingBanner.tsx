// 메인 페이지 트렌드 영역 — ADR-0009 + ADR-0016.
// Google Trends RSS 풍부화: traffic, picture, 매체 사용.

import Link from 'next/link';
import { TrendingUp } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { Trend } from '@/lib/types';

type Props = {
  global: Trend[];
  kr: Trend[];
};

export function TrendingBanner({ global, kr }: Props) {
  if (global.length === 0 && kr.length === 0) return null;

  return (
    <section
      aria-label="오늘의 트렌드"
      className="border-b border-border-subtle bg-bg-subtle/40"
    >
      <div className="px-4 py-5 lg:px-8">
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp size={15} className="text-fg-muted" />
          <h2 className="text-sm font-semibold tracking-tight text-fg">오늘의 트렌드</h2>
          <span className="text-xs text-fg-subtle">via Google Trends</span>
        </div>

        <div className="grid gap-x-6 gap-y-4 md:grid-cols-2">
          <TrendColumn label="🇰🇷 국내" trends={kr} />
          <TrendColumn label="🌐 글로벌" trends={global} />
        </div>
      </div>
    </section>
  );
}

function TrendColumn({ label, trends }: { label: string; trends: Trend[] }) {
  if (trends.length === 0) return null;
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-fg-muted">{label}</p>
      <ol className="space-y-1">
        {trends.slice(0, 8).map((t, idx) => (
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
      className="group flex items-center gap-3 rounded-md px-1.5 py-1.5 transition-colors hover:bg-bg"
    >
      <span className="w-5 shrink-0 text-center text-xs font-semibold tabular-nums text-fg-subtle group-hover:text-fg-muted">
        {rank}
      </span>
      <Thumbnail src={trend.picture} alt={trend.keyword} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-fg group-hover:text-accent-fg">
          {trend.keyword}
        </p>
        {subtitle && <p className="truncate text-xs text-fg-subtle">{subtitle}</p>}
      </div>
    </Link>
  );
}

function Thumbnail({ src, alt }: { src?: string; alt: string }) {
  return (
    <div
      className={cn(
        'h-10 w-10 shrink-0 overflow-hidden rounded-md bg-bg-subtle',
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

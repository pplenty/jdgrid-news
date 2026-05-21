// 메인 페이지 상단 가로 띠 — ADR-0009 §"TRENDING 중복 노출" 강조 영역.
// Google Trends RSS 출처(ADR-0005) 명시 + 순위 번호로 시각 위계 보강.

import Link from 'next/link';
import { TrendingUp } from 'lucide-react';

import type { Trend } from '@/lib/types';

type Props = {
  global: Trend[];
  kr: Trend[];
};

export function TrendingBanner({ global, kr }: Props) {
  if (global.length === 0 && kr.length === 0) return null;

  return (
    <section
      aria-label="Trending keywords"
      className="border-b border-border-subtle bg-bg-subtle/60"
    >
      <div className="px-4 py-5 lg:px-8">
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp size={15} className="text-fg-muted" />
          <h2 className="text-sm font-semibold tracking-tight text-fg">오늘의 트렌드</h2>
          <span className="text-xs text-fg-subtle">via Google Trends</span>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <TrendList label="🇰🇷 국내" trends={kr} />
          <TrendList label="🌐 글로벌" trends={global} />
        </div>
      </div>
    </section>
  );
}

function TrendList({ label, trends }: { label: string; trends: Trend[] }) {
  if (trends.length === 0) return null;
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-fg-muted">{label}</p>
      <ol className="flex flex-wrap gap-1.5">
        {trends.slice(0, 10).map((t, idx) => (
          <li key={t.keyword}>
            <Link
              href={`/k/${encodeURIComponent(t.keyword)}/`}
              className="group inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-bg px-2.5 py-1 text-sm transition-colors hover:border-accent hover:text-accent-fg"
            >
              <span className="text-xs font-semibold tabular-nums text-fg-subtle group-hover:text-accent-fg">
                {idx + 1}
              </span>
              <span className="font-medium">{t.keyword}</span>
              {t.relatedUrls.length > 0 && (
                <span className="text-xs text-fg-subtle tabular-nums">
                  {t.relatedUrls.length}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}

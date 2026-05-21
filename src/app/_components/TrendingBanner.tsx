// 메인 페이지 상단 가로 띠 — ADR-0009 §"TRENDING 중복 노출". 강조용, 큰 글씨.

import Link from 'next/link';
import { Flame } from 'lucide-react';

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
      className="border-b border-border-subtle bg-gradient-to-r from-accent-subtle/40 to-transparent"
    >
      <div className="space-y-2 px-4 py-4 lg:px-8">
        <div className="flex items-center gap-2 text-sm font-semibold text-accent-fg">
          <Flame size={16} />
          <span>TRENDING NOW</span>
        </div>
        <TrendRow label="🌐 Global" trends={global} />
        <TrendRow label="🇰🇷 Korea" trends={kr} />
      </div>
    </section>
  );
}

function TrendRow({ label, trends }: { label: string; trends: Trend[] }) {
  if (trends.length === 0) return null;
  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin">
      <span className="shrink-0 text-xs font-medium text-fg-muted">{label}</span>
      <ul className="flex gap-1.5">
        {trends.slice(0, 12).map((t) => (
          <li key={t.keyword} className="shrink-0">
            <Link
              href={`/k/${encodeURIComponent(t.keyword)}/`}
              className="inline-block rounded-full border border-border-subtle bg-bg px-3 py-1 text-sm font-medium text-fg-muted transition-colors hover:border-accent hover:text-accent-fg"
            >
              #{t.keyword}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

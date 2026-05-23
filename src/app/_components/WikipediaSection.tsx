// Wikipedia 어제 top — ADR-0018 + ADR-0019 (top 10에 sparkline).

import { BookOpen } from 'lucide-react';

import type { WikiTrend } from '@/lib/types';
import { cn } from '@/lib/utils';

import { Sparkline } from './Sparkline';

type Props = {
  ko: WikiTrend[];
  en: WikiTrend[];
};

export function WikipediaSection({ ko, en }: Props) {
  if (ko.length === 0 && en.length === 0) return null;
  return (
    <section className="border-b border-border-subtle px-4 py-8 lg:px-8">
      <header className="mb-3 flex items-center gap-2">
        <BookOpen size={16} className="text-fg-muted" />
        <h2 className="text-base font-bold tracking-tight">위키피디아 관심사</h2>
        <span className="text-xs text-fg-subtle">어제 가장 많이 본 문서 · via Wikipedia</span>
      </header>
      <div className="grid gap-x-6 gap-y-4 md:grid-cols-2">
        <WikiColumn label="🇰🇷 한국어" items={ko} />
        <WikiColumn label="🌐 영어" items={en} />
      </div>
    </section>
  );
}

function WikiColumn({ label, items }: { label: string; items: WikiTrend[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-fg-muted">{label}</p>
      <ol className="space-y-1">
        {items.slice(0, 10).map((w, idx) => {
          const change = computeChange(w);
          return (
            <li key={w.url}>
              <a
                href={w.url}
                target="_blank"
                rel="noreferrer noopener"
                className="group flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-bg-subtle"
              >
                <span className="w-5 shrink-0 text-center text-xs font-semibold tabular-nums text-fg-subtle">
                  {idx + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-fg group-hover:text-accent-fg">
                  {w.title}
                </span>
                {change !== null && <ChangeBadge percent={change} />}
                {w.history && w.history.length >= 2 && (
                  <Sparkline values={w.history.map((p) => p.views)} className="shrink-0" />
                )}
                <span className="w-12 shrink-0 text-right text-[11px] tabular-nums text-fg-subtle">
                  {formatViews(w.views)}
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** 7일 평균 대비 어제 변동률 (%). history 부족 시 null. */
function computeChange(w: WikiTrend): number | null {
  if (!w.history || w.history.length < 3) return null;
  const last = w.history.at(-1)?.views ?? 0;
  const rest = w.history.slice(0, -1);
  const avg = rest.reduce((s, p) => s + p.views, 0) / rest.length;
  if (avg <= 0) return null;
  return Math.round(((last - avg) / avg) * 100);
}

function ChangeBadge({ percent }: { percent: number }) {
  if (Math.abs(percent) < 10) return null; // 변동률 작으면 표시 안 함
  const isUp = percent > 0;
  return (
    <span
      className={cn(
        'shrink-0 rounded-full px-1.5 text-[10px] font-semibold tabular-nums',
        isUp ? 'bg-accent-subtle text-accent-fg' : 'bg-bg-subtle text-fg-muted',
      )}
    >
      {isUp ? '+' : ''}
      {percent}%
    </span>
  );
}

function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

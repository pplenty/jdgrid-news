// Wikipedia 어제 top — ADR-0018.

import { BookOpen } from 'lucide-react';

import type { WikiTrend } from '@/lib/types';

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
        {items.slice(0, 10).map((w, idx) => (
          <li key={w.url}>
            <a
              href={w.url}
              target="_blank"
              rel="noreferrer noopener"
              className="group flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-bg-subtle"
            >
              <span className="w-5 shrink-0 text-center text-xs font-semibold tabular-nums text-fg-subtle">
                {idx + 1}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-fg group-hover:text-accent-fg">
                {w.title}
              </span>
              <span className="shrink-0 text-[11px] tabular-nums text-fg-subtle">
                {formatViews(w.views)}
              </span>
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
}

function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

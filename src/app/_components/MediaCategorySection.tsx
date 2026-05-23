// ADR-0023 후속: 매체별 카테고리 분포 stacked bar.
// 어떤 매체가 어떤 카테고리에 집중하는지 시각화.

import { BarChart3 } from 'lucide-react';

import { CATEGORY_IDS, CATEGORY_LABELS, type CategoryId } from '@/lib/categories';
import type { MediaCategoryRow } from '@/lib/data';

import { CATEGORY_COLORS } from './categoryColors';

const BAR_CATEGORIES: ReadonlyArray<Exclude<CategoryId, 'top'>> = CATEGORY_IDS.filter(
  (id): id is Exclude<CategoryId, 'top'> => id !== 'top',
);

export function MediaCategorySection({ rows }: { rows: MediaCategoryRow[] }) {
  if (rows.length === 0) return null;

  return (
    <section className="border-b border-border-subtle px-4 py-8 lg:px-8">
      <header className="mb-3 flex items-center gap-2">
        <BarChart3 size={16} className="text-fg-muted" />
        <h2 className="text-base font-bold tracking-tight">매체별 카테고리 분포</h2>
        <span className="text-xs text-fg-subtle">오늘 수집한 헤드라인 기준</span>
      </header>

      {/* 범례 */}
      <ul className="mb-4 flex flex-wrap gap-x-3 gap-y-1 text-xs text-fg-muted">
        {BAR_CATEGORIES.map((cat) => (
          <li key={cat} className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: CATEGORY_COLORS[cat] }}
            />
            {CATEGORY_LABELS[cat].ko}
          </li>
        ))}
      </ul>

      {/* 매체별 row */}
      <div className="space-y-1.5">
        {rows.map((row) => (
          <MediaRow key={row.name} row={row} />
        ))}
      </div>
    </section>
  );
}

function MediaRow({ row }: { row: MediaCategoryRow }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 shrink-0 truncate text-xs font-medium text-fg-muted sm:w-28">
        {row.name}
      </span>
      <div className="flex h-4 min-w-0 flex-1 overflow-hidden rounded bg-bg-subtle">
        {BAR_CATEGORIES.map((cat) => {
          const count = row.counts[cat] ?? 0;
          if (count === 0) return null;
          const percent = (count / row.total) * 100;
          return (
            <div
              key={cat}
              className="h-full transition-opacity hover:opacity-80"
              style={{ width: `${percent}%`, backgroundColor: CATEGORY_COLORS[cat] }}
              title={`${CATEGORY_LABELS[cat].ko} · ${count}건 (${percent.toFixed(0)}%)`}
            />
          );
        })}
      </div>
      <span className="w-8 shrink-0 text-right text-xs tabular-nums text-fg-subtle">
        {row.total}
      </span>
    </div>
  );
}

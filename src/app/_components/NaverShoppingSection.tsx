// Naver DataLab 쇼핑 — ADR-0020 + ADR-0023 (카테고리 비교 차트).
// 카테고리별 top 키워드 카드 + 카테고리 트렌드 sparkline + 5 카테고리 14일 비교.

import { ShoppingBag } from 'lucide-react';

import type { NaverShoppingCategoryTrend, NaverShoppingKeyword } from '@/lib/types';

import { MultiLineChart, type ChartLine } from './MultiLineChart';
import { Sparkline } from './Sparkline';

const CATEGORY_COLORS: Record<string, string> = {
  패션: '#6366f1', // indigo-500
  뷰티: '#ec4899', // pink-500
  '디지털·가전': '#06b6d4', // cyan-500
  식품: '#f59e0b', // amber-500
  스포츠: '#10b981', // emerald-500
};

type Props = {
  keywordsByCategory: Record<string, NaverShoppingKeyword[]>;
  categoryTrends: NaverShoppingCategoryTrend[];
};

export function NaverShoppingSection({ keywordsByCategory, categoryTrends }: Props) {
  const categories = Object.keys(keywordsByCategory);
  if (categories.length === 0 && categoryTrends.length === 0) return null;

  const trendByCategory = new Map(categoryTrends.map((t) => [t.category, t]));

  const chartLines: ChartLine[] = categoryTrends.map((t) => ({
    label: t.category,
    color: CATEGORY_COLORS[t.category] ?? '#71717a',
    points: t.history.map((p) => ({ date: p.date, value: p.views })),
  }));

  return (
    <section className="border-b border-border-subtle px-4 py-8 lg:px-8">
      <header className="mb-3 flex items-center gap-2">
        <ShoppingBag size={16} className="text-fg-muted" />
        <h2 className="text-base font-bold tracking-tight">쇼핑 트렌드</h2>
        <span className="text-xs text-fg-subtle">via Naver DataLab · 지난 14일</span>
      </header>

      {chartLines.length >= 2 && (
        <div className="mb-6 rounded-lg border border-border-subtle bg-bg p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-fg-muted">
            카테고리 비교 (14일)
          </p>
          <MultiLineChart lines={chartLines} height={140} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {categories.map((cat) => (
          <CategoryCard
            key={cat}
            category={cat}
            keywords={keywordsByCategory[cat] ?? []}
            trend={trendByCategory.get(cat)}
          />
        ))}
      </div>
    </section>
  );
}

function CategoryCard({
  category,
  keywords,
  trend,
}: {
  category: string;
  keywords: NaverShoppingKeyword[];
  trend?: NaverShoppingCategoryTrend;
}) {
  return (
    <article className="rounded-lg border border-border-subtle bg-bg p-3.5">
      <header className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold tracking-tight">{category}</h3>
        {trend && trend.history.length >= 2 && (
          <Sparkline values={trend.history.map((p) => p.views)} width={48} height={14} />
        )}
      </header>
      {keywords.length === 0 ? (
        <p className="py-2 text-xs text-fg-subtle">데이터 없음</p>
      ) : (
        <ol className="space-y-1">
          {keywords.map((k, idx) => (
            <li key={k.keyword}>
              <KeywordRow rank={idx + 1} kw={k} />
            </li>
          ))}
        </ol>
      )}
    </article>
  );
}

function KeywordRow({ rank, kw }: { rank: number; kw: NaverShoppingKeyword }) {
  return (
    <div className="flex items-center gap-2 rounded px-1 py-0.5 text-sm">
      <span className="w-4 shrink-0 text-center text-xs font-semibold tabular-nums text-fg-subtle">
        {rank}
      </span>
      <span className="min-w-0 flex-1 truncate text-fg-muted">{kw.keyword}</span>
      {kw.history && kw.history.length >= 2 && (
        <Sparkline values={kw.history.map((p) => p.views)} width={36} height={12} />
      )}
      <span className="w-8 shrink-0 text-right text-[11px] tabular-nums text-fg-subtle">
        {Math.round(kw.score)}
      </span>
    </div>
  );
}

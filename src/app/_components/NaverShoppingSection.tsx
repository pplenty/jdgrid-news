// Naver DataLab 쇼핑 — ADR-0020.
// 카테고리별 top 키워드 카드 + 카테고리 트렌드 sparkline.

import { ShoppingBag } from 'lucide-react';

import type { NaverShoppingCategoryTrend, NaverShoppingKeyword } from '@/lib/types';

import { Sparkline } from './Sparkline';

type Props = {
  keywordsByCategory: Record<string, NaverShoppingKeyword[]>;
  categoryTrends: NaverShoppingCategoryTrend[];
};

export function NaverShoppingSection({ keywordsByCategory, categoryTrends }: Props) {
  const categories = Object.keys(keywordsByCategory);
  if (categories.length === 0 && categoryTrends.length === 0) return null;

  const trendByCategory = new Map(categoryTrends.map((t) => [t.category, t]));

  return (
    <section className="border-b border-border-subtle px-4 py-8 lg:px-8">
      <header className="mb-3 flex items-center gap-2">
        <ShoppingBag size={16} className="text-fg-muted" />
        <h2 className="text-base font-bold tracking-tight">쇼핑 트렌드</h2>
        <span className="text-xs text-fg-subtle">via Naver DataLab · 지난 14일</span>
      </header>
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

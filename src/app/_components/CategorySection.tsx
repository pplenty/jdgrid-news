// 메인 페이지의 카테고리 섹션 — 4-카드 그리드 + "모두 보기 →".

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { CATEGORY_LABELS, type CategoryId } from '@/lib/categories';
import type { Article } from '@/lib/types';

import { ArticleCard } from './ArticleCard';
import { CATEGORY_ICONS } from './categoryIcons';

type Props = {
  id: CategoryId;
  items: Article[];
  limit?: number;
};

export function CategorySection({ id, items, limit = 4 }: Props) {
  if (items.length === 0) return null;
  const slice = items.slice(0, limit);
  const Icon = CATEGORY_ICONS[id];
  return (
    <section className="border-b border-border-subtle px-4 py-8 lg:px-8">
      <header className="mb-4 flex items-end justify-between gap-3">
        <h2 className="flex items-baseline gap-2.5 text-xl font-bold tracking-tight">
          <Icon size={18} className="self-center text-fg-muted" aria-hidden />
          <span>{CATEGORY_LABELS[id].ko}</span>
          <span className="text-sm font-normal text-fg-subtle">{CATEGORY_LABELS[id].en}</span>
        </h2>
        <Link
          href={`/c/${id}/`}
          className="inline-flex items-center gap-1 text-sm font-medium text-fg-muted hover:text-accent-fg"
        >
          모두 보기
          <ArrowRight size={14} />
        </Link>
      </header>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {slice.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </section>
  );
}

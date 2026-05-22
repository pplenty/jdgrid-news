// /headlines — ADR-0022 페이지 분리. TOP STORIES + 카테고리별 4-카드 그리드.

import { ArticleCard } from '@/app/_components/ArticleCard';
import { CategorySection } from '@/app/_components/CategorySection';
import { CATEGORY_IDS, type CategoryId } from '@/lib/categories';
import { getCategoryItems, loadLatest } from '@/lib/data';
import { formatDateLabel } from '@/lib/utils';

const DOMAIN_CATEGORIES: ReadonlyArray<Exclude<CategoryId, 'top'>> = CATEGORY_IDS.filter(
  (id): id is Exclude<CategoryId, 'top'> => id !== 'top',
);

export const metadata = {
  title: 'Headlines — trends',
  description: '국내·해외 매체 헤드라인 인덱스 (카테고리별).',
};

export default function HeadlinesPage() {
  const snapshot = loadLatest();
  const top = getCategoryItems(snapshot, 'top');

  return (
    <>
      <header className="border-b border-border-subtle bg-bg-subtle/40 px-4 py-6 lg:px-8 lg:py-8">
        <h1 className="text-2xl font-bold tracking-tight">⭐ Headlines</h1>
        <p className="mt-1 text-sm text-fg-muted">
          {formatDateLabel(snapshot.date)} · 국내 6 + 해외 6 매체에서 모은 카테고리별 헤드라인
        </p>
      </header>

      {top.length > 0 && (
        <section className="border-b border-border-subtle px-4 py-8 lg:px-8">
          <h2 className="mb-4 text-xl font-bold tracking-tight">⭐ TOP STORIES</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {top.slice(0, 6).map((article, idx) => (
              <ArticleCard
                key={article.id}
                article={article}
                variant={idx === 0 ? 'hero' : 'default'}
              />
            ))}
          </div>
        </section>
      )}

      {DOMAIN_CATEGORIES.map((id) => (
        <CategorySection key={id} id={id} items={getCategoryItems(snapshot, id)} />
      ))}
    </>
  );
}

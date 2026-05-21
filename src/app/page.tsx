// 메인 대시보드 — ADR-0009 와이어프레임 / ADR-0008 카테고리.
// 상단 TRENDING 띠 + TOP STORIES + 각 도메인 카테고리 4-카드.

import { CATEGORY_IDS, type CategoryId } from '@/lib/categories';
import { getCategoryItems, loadLatest } from '@/lib/data';

import { ArticleCard } from './_components/ArticleCard';
import { CategorySection } from './_components/CategorySection';
import { TrendingBanner } from './_components/TrendingBanner';

const DOMAIN_CATEGORIES: ReadonlyArray<Exclude<CategoryId, 'top'>> = CATEGORY_IDS.filter(
  (id): id is Exclude<CategoryId, 'top'> => id !== 'top',
);

export default function HomePage() {
  const snapshot = loadLatest();
  const top = getCategoryItems(snapshot, 'top');

  return (
    <>
      <TrendingBanner global={snapshot.trends.global} kr={snapshot.trends.kr} />

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

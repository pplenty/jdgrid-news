// 메인 대시보드 — ADR-0009 와이어프레임 / ADR-0008 카테고리.
// 상단 TRENDING 띠 + TOP STORIES + 각 도메인 카테고리 4-카드.

import { CATEGORY_IDS, type CategoryId } from '@/lib/categories';
import { getCategoryItems, loadLatest } from '@/lib/data';

import { ArticleCard } from './_components/ArticleCard';
import { CategorySection } from './_components/CategorySection';
import { NaverShoppingSection } from './_components/NaverShoppingSection';
import { TrendingHero } from './_components/TrendingHero';
import { WikipediaSection } from './_components/WikipediaSection';

const DOMAIN_CATEGORIES: ReadonlyArray<Exclude<CategoryId, 'top'>> = CATEGORY_IDS.filter(
  (id): id is Exclude<CategoryId, 'top'> => id !== 'top',
);

export default function HomePage() {
  const snapshot = loadLatest();
  const top = getCategoryItems(snapshot, 'top');

  const wiki = snapshot.trends.wikipedia;
  const naver = snapshot.trends.naver;

  return (
    <>
      <TrendingHero
        kr={snapshot.trends.kr}
        global={snapshot.trends.global}
        date={snapshot.date}
      />

      {wiki && <WikipediaSection ko={wiki.ko} en={wiki.en} />}

      {naver && (
        <NaverShoppingSection
          keywordsByCategory={naver.keywordsByCategory}
          categoryTrends={naver.categoryTrends}
        />
      )}

      {top.length > 0 && (
        <section className="border-b border-border-subtle px-4 py-8 lg:px-8">
          <h2 className="mb-4 text-xl font-bold tracking-tight">⭐ 최신 헤드라인</h2>
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

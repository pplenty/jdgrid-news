// 날짜 페이지 — /d/[date]. 과거 일자 메인 (PLAN §6 — 최근 30~90일치 정적 생성).

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ArticleCard } from '@/app/_components/ArticleCard';
import { CategorySection } from '@/app/_components/CategorySection';
import { TrendingBanner } from '@/app/_components/TrendingBanner';
import { CATEGORY_IDS, type CategoryId } from '@/lib/categories';
import { getCategoryItems, listSnapshotDates, loadByDate } from '@/lib/data';
import { formatDateLabel } from '@/lib/utils';

const DOMAIN_CATEGORIES: ReadonlyArray<Exclude<CategoryId, 'top'>> = CATEGORY_IDS.filter(
  (id): id is Exclude<CategoryId, 'top'> => id !== 'top',
);

export function generateStaticParams() {
  return listSnapshotDates()
    .slice(0, 90)
    .map((date) => ({ date }));
}

// 날짜별 고유 메타 (ADR-0040 후속).
export async function generateMetadata({
  params,
}: {
  params: Promise<{ date: string }>;
}): Promise<Metadata> {
  const { date } = await params;
  const description = `${formatDateLabel(date)} 국내·해외 검색·뉴스·트렌드 스냅샷.`;
  const canonical = `/d/${date}/`;
  return {
    title: `${date} 트렌드 다이제스트 | trends`,
    description,
    alternates: { canonical },
    openGraph: { title: `${date} 트렌드`, description, url: canonical },
  };
}

export default async function DatePage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  const snapshot = loadByDate(date);
  if (!snapshot) notFound();

  const top = getCategoryItems(snapshot, 'top');

  return (
    <>
      <div className="border-b border-border-subtle bg-bg-subtle/40 px-4 py-3 lg:px-8">
        <p className="text-sm text-fg-muted">
          📅 <span className="font-medium text-fg">{formatDateLabel(date)}</span>의 스냅샷
        </p>
      </div>

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

// 카테고리 페이지 — /c/[category]. 가로형 카드 리스트.

import { notFound } from 'next/navigation';

import { ArticleCard } from '@/app/_components/ArticleCard';
import { EmptyState } from '@/app/_components/EmptyState';
import { JsonLd } from '@/app/_components/JsonLd';
import { CATEGORY_IDS, CATEGORY_LABELS, type CategoryId } from '@/lib/categories';
import { getCategoryItems, loadLatest } from '@/lib/data';
import { breadcrumb, categoryUrl, SITE_BASE } from '@/lib/jsonld';

export function generateStaticParams() {
  return CATEGORY_IDS.map((id) => ({ category: id }));
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const id = category as CategoryId;
  if (!CATEGORY_IDS.includes(id)) notFound();

  const snapshot = loadLatest();
  const items = getCategoryItems(snapshot, id);

  return (
    <div className="px-4 py-8 lg:px-8">
      <JsonLd
        data={breadcrumb([
          { name: '홈', url: `${SITE_BASE}/` },
          { name: CATEGORY_LABELS[id].ko, url: categoryUrl(id) },
        ])}
      />
      <header className="mb-6 flex items-baseline gap-3 border-b border-border-subtle pb-4">
        <h1 className="text-2xl font-bold tracking-tight">{CATEGORY_LABELS[id].ko}</h1>
        <span className="text-sm text-fg-subtle">{CATEGORY_LABELS[id].en}</span>
        <span className="ml-auto text-sm text-fg-subtle">
          {snapshot.date} · {items.length}건
        </span>
      </header>

      {items.length === 0 ? (
        <EmptyState
          title="오늘은 이 카테고리의 기사가 없어요"
          description="매체 RSS에서 이 카테고리로 분류된 기사가 잡히지 않았습니다. 내일 다시 확인해주세요."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((a) => (
            <ArticleCard key={a.id} article={a} />
          ))}
        </div>
      )}
    </div>
  );
}

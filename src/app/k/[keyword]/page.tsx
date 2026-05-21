// 키워드 페이지 — /k/[keyword]. 오늘자 트렌딩 키워드만 정적 생성 (PLAN §9 위험 흡수).

import { notFound } from 'next/navigation';
import { Hash } from 'lucide-react';

import { ArticleCard } from '@/app/_components/ArticleCard';
import { findArticlesByKeyword, loadLatest } from '@/lib/data';

export function generateStaticParams() {
  const snapshot = loadLatest();
  const keywords = new Set<string>();
  for (const t of [...snapshot.trends.global, ...snapshot.trends.kr]) {
    if (t.keyword) keywords.add(t.keyword);
  }
  return [...keywords].map((keyword) => ({ keyword: encodeURIComponent(keyword) }));
}

export default async function KeywordPage({
  params,
}: {
  params: Promise<{ keyword: string }>;
}) {
  const { keyword: encoded } = await params;
  const keyword = decodeURIComponent(encoded);
  if (!keyword) notFound();

  const snapshot = loadLatest();
  const articles = findArticlesByKeyword(snapshot, keyword);

  return (
    <div className="px-4 py-8 lg:px-8">
      <header className="mb-6 border-b border-border-subtle pb-4">
        <div className="flex items-baseline gap-2">
          <Hash size={20} className="text-fg-subtle" />
          <h1 className="text-2xl font-bold tracking-tight">{keyword}</h1>
          <span className="ml-auto text-sm text-fg-subtle">
            오늘 {snapshot.date} · {articles.length}건
          </span>
        </div>
        <p className="mt-1 pl-7 text-sm text-fg-subtle">
          이 키워드가 등장한 오늘자 기사 모음.
        </p>
      </header>

      {articles.length === 0 ? (
        <p className="py-12 text-center text-fg-subtle">
          매칭된 기사가 없습니다. 트렌딩 점수만 잡혔거나 표기가 다른 경우일 수 있습니다.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <ArticleCard key={a.id} article={a} />
          ))}
        </div>
      )}
    </div>
  );
}

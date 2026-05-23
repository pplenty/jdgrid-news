// 키워드 페이지 — /k/[keyword]. 우리 매칭 기사 + Google 큐레이션 기사 두 그룹 (ADR-0016).

import { notFound } from 'next/navigation';
import { ExternalLink, Hash } from 'lucide-react';

import { ArticleCard } from '@/app/_components/ArticleCard';
import { EmptyState } from '@/app/_components/EmptyState';
import { findArticlesByKeyword, findTrendByKeyword, loadLatest } from '@/lib/data';
import type { GoogleNewsItem } from '@/lib/types';

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
  const trend = findTrendByKeyword(snapshot, keyword);
  const ourArticles = findArticlesByKeyword(snapshot, keyword);
  const googleArticles = trend?.googleArticles ?? [];

  return (
    <div className="px-4 py-8 lg:px-8">
      <header className="mb-6 border-b border-border-subtle pb-4">
        <div className="flex items-baseline gap-2">
          <Hash size={20} className="text-fg-subtle" />
          <h1 className="text-2xl font-bold tracking-tight">{keyword}</h1>
          {trend?.traffic && (
            <span className="rounded-full bg-accent-subtle px-2 py-0.5 text-xs font-semibold text-accent-fg">
              {trend.traffic}
            </span>
          )}
          <span className="ml-auto text-sm text-fg-subtle">{snapshot.date}</span>
        </div>
        {trend?.description && (
          <p className="mt-2 pl-7 text-sm text-fg-muted">{trend.description}</p>
        )}
        {!trend?.description && (
          <p className="mt-1 pl-7 text-sm text-fg-subtle">
            이 키워드가 등장한 오늘자 기사 모음 — Google Trends 큐레이션 + 우리 수집 매체 매칭.
          </p>
        )}
      </header>

      {ourArticles.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-fg-muted">
            우리가 매칭한 기사 · {ourArticles.length}건
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ourArticles.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        </section>
      )}

      {googleArticles.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-fg-muted">
            Google이 큐레이션한 외부 기사 · {googleArticles.length}건
          </h2>
          <ul className="space-y-2">
            {googleArticles.map((a) => (
              <li key={a.url}>
                <GoogleArticleRow article={a} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {ourArticles.length === 0 && googleArticles.length === 0 && (
        <EmptyState
          title="매칭된 기사가 없어요"
          description="Google Trends가 방금 잡은 키워드이거나, 우리가 수집한 매체 헤드라인에 등장하지 않은 경우입니다."
        />
      )}
    </div>
  );
}

function GoogleArticleRow({ article }: { article: GoogleNewsItem }) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noreferrer noopener"
      className="group flex items-center gap-3 rounded-md border border-border-subtle p-3 transition-colors hover:border-border hover:bg-bg-subtle"
    >
      {article.picture && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={article.picture}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className="h-14 w-14 shrink-0 rounded object-cover"
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="font-semibold leading-snug line-clamp-2 group-hover:text-accent-fg">
          {article.title}
        </p>
        <p className="mt-0.5 text-xs text-fg-subtle">{article.source}</p>
      </div>
      <ExternalLink size={14} className="shrink-0 text-fg-subtle group-hover:text-fg-muted" />
    </a>
  );
}

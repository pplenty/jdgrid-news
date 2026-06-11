// /k/[keyword] — ADR-0028. 키워드 통합 카드 (signals + Wikipedia + 매체 분포 + 기존 두 섹션).

import { BookOpen, ExternalLink, Globe2, Hash, Newspaper, TrendingUp } from 'lucide-react';

import { ArticleCard } from '@/app/_components/ArticleCard';
import { EmptyState } from '@/app/_components/EmptyState';
import { JsonLd } from '@/app/_components/JsonLd';
import { Sparkline } from '@/app/_components/Sparkline';
import {
  findArticlesByKeyword,
  findTrendByKeyword,
  findWikiByKeyword,
  groupArticlesBySource,
  loadLatest,
} from '@/lib/data';
import { breadcrumb, keywordUrl, SITE_BASE } from '@/lib/jsonld';
import type { GoogleNewsItem, WikiTrend } from '@/lib/types';

export function generateStaticParams() {
  const snapshot = loadLatest();
  const keywords = new Set<string>();
  for (const t of [...snapshot.trends.global, ...snapshot.trends.kr]) {
    if (t.keyword) keywords.add(t.keyword);
  }
  // raw 키워드 반환 — Next 가 파일시스템/URL 인코딩 담당. 여기서 encodeURIComponent 하면
  // Next 가 한 번 더 인코딩해(이중) 비-ASCII(한글) 페이지가 인코딩 문자열로 렌더됨 (ADR-0028 회귀).
  return [...keywords].map((keyword) => ({ keyword }));
}

// Next 버전/플랫폼에 따라 param 이 디코드/단일인코딩으로 올 수 있어 안전 디코드.
// 이미 디코드된 값(% 없음)은 무변, 인코딩 값은 1회 디코드, '%' 리터럴 등 오류는 원값 유지.
function decodeKeyword(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export default async function KeywordPage({
  params,
}: {
  params: Promise<{ keyword: string }>;
}) {
  const { keyword: raw } = await params;
  const keyword = decodeKeyword(raw);
  if (!keyword) {
    return (
      <div className="px-4 py-8 lg:px-8">
        <EmptyState title="키워드가 없어요" />
      </div>
    );
  }

  const snapshot = loadLatest();
  const trend = findTrendByKeyword(snapshot, keyword);
  const ourArticles = findArticlesByKeyword(snapshot, keyword);
  const googleArticles = trend?.googleArticles ?? [];
  const wiki = findWikiByKeyword(snapshot, keyword);
  const sourceDistribution = groupArticlesBySource(ourArticles);

  return (
    <div className="px-4 py-8 lg:px-8">
      <JsonLd
        data={breadcrumb([
          { name: '홈', url: `${SITE_BASE}/` },
          { name: keyword, url: keywordUrl(keyword) },
        ])}
      />
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

        {/* Signal chips */}
        <div className="mt-4 flex flex-wrap gap-2 pl-7">
          {trend?.traffic && (
            <SignalChip icon={TrendingUp} label="Google" value={trend.traffic} />
          )}
          {wiki.ko && (
            <SignalChip
              icon={BookOpen}
              label="한국어 위키"
              value={`${formatViews(wiki.ko.views)} views`}
            />
          )}
          {wiki.en && (
            <SignalChip
              icon={BookOpen}
              label="영문 위키"
              value={`${formatViews(wiki.en.views)} views`}
            />
          )}
          {ourArticles.length > 0 && (
            <SignalChip icon={Newspaper} label="매체 매칭" value={`${ourArticles.length}건`} />
          )}
          {googleArticles.length > 0 && (
            <SignalChip
              icon={Globe2}
              label="Google 큐레이션"
              value={`${googleArticles.length}건`}
            />
          )}
        </div>
      </header>

      {/* Wikipedia mini cards */}
      {(wiki.ko || wiki.en) && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-fg-muted">
            Wikipedia
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {wiki.ko && <WikiCard wiki={wiki.ko} lang="ko" />}
            {wiki.en && <WikiCard wiki={wiki.en} lang="en" />}
          </div>
        </section>
      )}

      {/* 매체 분포 */}
      {sourceDistribution.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-fg-muted">
            매체 분포 · {ourArticles.length}건
          </h2>
          <ul className="flex flex-wrap gap-2">
            {sourceDistribution.map((s) => (
              <li
                key={s.name}
                className="inline-flex items-center gap-1.5 rounded-full bg-bg-subtle px-3 py-1 text-xs"
              >
                <span className="font-medium text-fg-muted">{s.name}</span>
                <span className="rounded-full bg-bg px-1.5 text-[10px] font-semibold tabular-nums text-fg-subtle">
                  {s.count}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 우리 매칭 기사 */}
      {ourArticles.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-fg-muted">
            우리 매체 매칭 · {ourArticles.length}건
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ourArticles.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        </section>
      )}

      {/* Google 큐레이션 */}
      {googleArticles.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-fg-muted">
            Google 큐레이션 외부 기사 · {googleArticles.length}건
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

      {ourArticles.length === 0 && googleArticles.length === 0 && !wiki.ko && !wiki.en && (
        <EmptyState
          title="매칭된 신호가 없어요"
          description="Google Trends가 방금 잡은 키워드이거나, 우리가 수집한 source 어디에도 등장하지 않은 경우입니다."
        />
      )}
    </div>
  );
}

function SignalChip({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-border-subtle bg-bg px-2.5 py-1 text-xs">
      <Icon size={12} className="text-fg-subtle" aria-hidden />
      <span className="text-fg-subtle">{label}</span>
      <span className="font-semibold text-fg tabular-nums">{value}</span>
    </span>
  );
}

function WikiCard({ wiki, lang }: { wiki: WikiTrend; lang: 'ko' | 'en' }) {
  const langLabel = lang === 'ko' ? '🇰🇷 한국어' : '🌐 영문';
  return (
    <a
      href={wiki.url}
      target="_blank"
      rel="noreferrer noopener"
      className="group flex items-center gap-3 rounded-lg border border-border-subtle bg-bg p-3 transition-colors hover:border-border hover:bg-bg-subtle"
    >
      <BookOpen size={16} className="shrink-0 text-fg-muted" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold group-hover:text-accent-fg">{wiki.title}</p>
        <p className="text-[11px] text-fg-subtle">
          {langLabel} · {formatViews(wiki.views)} views
        </p>
      </div>
      {wiki.history && wiki.history.length >= 2 && (
        <Sparkline values={wiki.history.map((p) => p.views)} className="shrink-0" />
      )}
      <ExternalLink size={12} className="shrink-0 text-fg-subtle" />
    </a>
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

function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

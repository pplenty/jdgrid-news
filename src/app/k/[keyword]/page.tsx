// /k/[keyword] — ADR-0028. 키워드 통합 카드 (signals + Wikipedia + 매체 분포 + 기존 두 섹션).

import type { Metadata } from 'next';
import Link from 'next/link';
import {
  BookOpen,
  CalendarDays,
  ExternalLink,
  Globe2,
  Hash,
  Newspaper,
  TrendingUp,
} from 'lucide-react';

import { ArticleCard } from '@/app/_components/ArticleCard';
import { EmptyState } from '@/app/_components/EmptyState';
import { JsonLd } from '@/app/_components/JsonLd';
import { Sparkline } from '@/app/_components/Sparkline';
import {
  findArticlesByKeyword,
  findTrendByKeyword,
  findWikiByKeyword,
  groupArticlesBySource,
  listSnapshotDates,
} from '@/lib/data';
import { breadcrumb, keywordUrl, SITE_BASE } from '@/lib/jsonld';
import { findKeywordEntry, loadKeywordSnapshot, type KeywordEntry } from '@/lib/keyword-index';
import type { GoogleNewsItem, WikiTrend } from '@/lib/types';
import { formatDateLabel } from '@/lib/utils';

import { decodeKeyword, keywordStaticParams } from './params';

/** 타임라인에 링크로 펼칠 최대 일자 수 — '미국'(82일) 같은 상시 키워드 대비. */
const TIMELINE_MAX_DATES = 14;

export function generateStaticParams() {
  return keywordStaticParams();
}

// 키워드별 고유 메타 (ADR-0040 후속) — 60+ 동적 페이지의 제네릭 title 중복 해소.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ keyword: string }>;
}): Promise<Metadata> {
  const keyword = decodeKeyword((await params).keyword);
  if (!keyword) return { title: '키워드 — trends' };
  const entry = findKeywordEntry(keyword);
  const snapshot = entry ? loadKeywordSnapshot(entry) : null;
  const trend = snapshot ? findTrendByKeyword(snapshot, keyword) : undefined;
  // 과거 키워드는 '오늘' 이 아니라 마지막 등장일 기준임을 문장에서도 분명히 (ADR-0044).
  const day = entry && isLatest(entry) ? '오늘의' : `${entry?.dates[0] ?? ''} 기준`;
  const description =
    trend?.description?.trim() ||
    `‘${keyword}’ ${day} 검색 트렌드${trend?.traffic ? ` (${trend.traffic})` : ''}, 위키피디아 관심도, 관련 뉴스를 한곳에서.`;
  const canonical = `/k/${encodeURIComponent(keyword)}/`;
  // 키워드 OG 이미지 (ADR-0043) — 파일 컨벤션은 비-ASCII 파라미터 URL 을 이중 인코딩해
  // 라우트 핸들러(/og/k)를 수동 참조. ?v= 는 마지막 등장일 캐시버스터.
  const ogImage = {
    url: `/og/k/${encodeURIComponent(keyword)}?v=${entry?.dates[0] ?? ''}`,
    width: 1200,
    height: 630,
    alt: `${keyword} — 트렌드`,
  };
  return {
    title: `${keyword} — 트렌드 신호·관련 뉴스 | trends`,
    description,
    alternates: { canonical },
    openGraph: { title: `${keyword} — 트렌드`, description, url: canonical, images: [ogImage] },
    twitter: { card: 'summary_large_image', images: [ogImage.url] },
  };
}

/** 마지막 등장일이 가장 최신 스냅샷인가 = '오늘의 트렌드' 인가. */
function isLatest(entry: KeywordEntry): boolean {
  return entry.dates[0] === listSnapshotDates()[0];
}

export default async function KeywordPage({
  params,
}: {
  params: Promise<{ keyword: string }>;
}) {
  const { keyword: raw } = await params;
  const keyword = decodeKeyword(raw);
  const entry = keyword ? findKeywordEntry(keyword) : undefined;
  const snapshot = entry ? loadKeywordSnapshot(entry) : null;
  if (!keyword || !entry || !snapshot) {
    return (
      <div className="px-4 py-8 lg:px-8">
        <EmptyState
          title="키워드가 없어요"
          description="최근 90일 트렌드에 등장하지 않은 키워드입니다."
        />
      </div>
    );
  }

  const archived = !isLatest(entry);
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

        {/* 과거 키워드 — 이 페이지가 어느 시점 기준인지 먼저 알린다 (ADR-0044). */}
        {archived && (
          <p className="mt-3 ml-7 inline-flex flex-wrap items-center gap-1.5 rounded-md border border-border-subtle bg-bg-subtle px-3 py-1.5 text-xs text-fg-muted">
            <CalendarDays size={12} className="shrink-0 text-fg-subtle" aria-hidden />
            <span>
              마지막으로 트렌드에 오른 <strong className="font-semibold text-fg">
                {formatDateLabel(snapshot.date)}
              </strong> 기준입니다.
            </span>
            <Link href="/" className="font-semibold text-accent-fg hover:underline">
              오늘의 트렌드 보기 →
            </Link>
          </p>
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
          {entry.dates.length > 1 && (
            <SignalChip icon={CalendarDays} label="등장" value={`${entry.dates.length}일`} />
          )}
        </div>
      </header>

      <KeywordTimeline entry={entry} />

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

/**
 * 이 키워드가 트렌드에 올랐던 날들 → 해당 일자 다이제스트(/d)로 링크 (ADR-0044).
 * 하루만 등장한 키워드(전체의 약 80%)엔 보여줄 게 없으므로 생략한다.
 */
function KeywordTimeline({ entry }: { entry: KeywordEntry }) {
  if (entry.dates.length < 2) return null;
  const shown = entry.dates.slice(0, TIMELINE_MAX_DATES);
  const hidden = entry.dates.length - shown.length;
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-fg-muted">
        트렌드에 오른 날 · {entry.dates.length}일
      </h2>
      <ul className="flex flex-wrap gap-2">
        {shown.map((date) => (
          <li key={date}>
            <Link
              href={`/d/${date}/`}
              className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-bg px-3 py-1 text-xs text-fg-muted transition-colors hover:border-border hover:bg-bg-subtle hover:text-fg"
            >
              <CalendarDays size={11} className="shrink-0 text-fg-subtle" aria-hidden />
              <span className="tabular-nums">{date}</span>
            </Link>
          </li>
        ))}
        {hidden > 0 && (
          <li className="inline-flex items-center px-1 text-xs text-fg-subtle">
            외 {hidden}일
          </li>
        )}
      </ul>
    </section>
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

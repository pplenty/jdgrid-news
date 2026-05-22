// Wikipedia Pageviews REST API — ADR-0018.
// 어제(KST) 가장 많이 본 위키 문서. 무료/무인증/매우 안정.

import type { WikiTrend } from '@/lib/types';

const BASE_URL = 'https://wikimedia.org/api/rest_v1/metrics/pageviews/top';
const USER_AGENT = 'jdgrid-news/0.1 (mailto:support@jdgrid.com)';
const FETCH_TIMEOUT_MS = 15_000;

const EXCLUDED_PREFIXES = ['Special:', '특수:', 'Wikipedia:', '위키백과:', 'File:', '파일:', 'Help:'];
const EXCLUDED_EXACT = new Set([
  'Main_Page',
  'Wikipedia',
  '대문',
  '오늘의_위키백과',
  '위키백과:대문',
]);

type RawArticle = {
  article?: string;
  views?: number;
  rank?: number;
};

type RawResponse = {
  items?: Array<{
    articles?: RawArticle[];
  }>;
};

/** KST 기준 N일 전 (Wikipedia는 집계가 1~2일 지연되므로 어제~3일 전을 retry). */
function daysAgoKst(daysAgo: number): { year: string; month: string; day: string } {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 3_600_000);
  kst.setUTCDate(kst.getUTCDate() - daysAgo);
  return {
    year: String(kst.getUTCFullYear()),
    month: String(kst.getUTCMonth() + 1).padStart(2, '0'),
    day: String(kst.getUTCDate()).padStart(2, '0'),
  };
}

export async function fetchWikipediaTop(
  project: 'ko.wikipedia' | 'en.wikipedia',
  limit = 20,
): Promise<WikiTrend[]> {
  // Wikimedia API는 어제 데이터가 늦게 집계되는 경우가 잦음 — 1~3일 전 순서로 retry.
  for (const daysAgo of [1, 2, 3]) {
    const stories = await tryDate(project, daysAgo, limit);
    if (stories.length > 0) return stories;
  }
  return [];
}

async function tryDate(
  project: 'ko.wikipedia' | 'en.wikipedia',
  daysAgo: number,
  limit: number,
): Promise<WikiTrend[]> {
  const { year, month, day } = daysAgoKst(daysAgo);
  const url = `${BASE_URL}/${project}/all-access/${year}/${month}/${day}`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) {
      // 데이터 없음(404)은 다음 날짜로 retry — 로그 안 찍음.
      if (res.status !== 404) console.warn(`[scrape] wikipedia ${project} HTTP ${res.status}`);
      return [];
    }
    const data = (await res.json()) as RawResponse;
    const raw = data.items?.[0]?.articles ?? [];
    const lang = project.startsWith('ko') ? 'ko' : 'en';
    return raw
      .filter((a): a is { article: string; views: number } => !!a.article && !!a.views)
      .filter((a) => !isExcluded(a.article))
      .slice(0, limit)
      .map((a) => toWikiTrend(a.article, a.views, lang));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[scrape] wikipedia ${project} -${daysAgo}d failed: ${msg}`);
    return [];
  }
}

function isExcluded(article: string): boolean {
  if (EXCLUDED_EXACT.has(article)) return true;
  return EXCLUDED_PREFIXES.some((p) => article.startsWith(p));
}

function toWikiTrend(article: string, views: number, lang: 'ko' | 'en'): WikiTrend {
  const title = article.replace(/_/g, ' ');
  const url = `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(article)}`;
  return { title, views, url };
}

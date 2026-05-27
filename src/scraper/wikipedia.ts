// Wikipedia Pageviews REST API — ADR-0018 + ADR-0019.
// 어제(KST) top + top 10에 대해 7일 historical sparkline 데이터.
// 무료/무인증/매우 안정.

import { kstDateParts } from '@/lib/date';
import type { HistoryPoint, WikiTrend } from '@/lib/types';

const BASE_URL = 'https://wikimedia.org/api/rest_v1/metrics/pageviews/top';
const PER_ARTICLE_URL =
  'https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article';
const USER_AGENT = 'jdgrid-trends/0.1 (mailto:support@jdgrid.com)';
const FETCH_TIMEOUT_MS = 15_000;
const HISTORY_DAYS = 7;
const HISTORY_TOP_N = 10;
const HISTORY_CHUNK = 5;

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

export async function fetchWikipediaTop(
  project: 'ko.wikipedia' | 'en.wikipedia',
  limit = 20,
): Promise<WikiTrend[]> {
  // Wikimedia API는 어제 데이터가 늦게 집계되는 경우가 잦음 — 1~4일 전 순서로 retry.
  // 2026-05-25 cron 0 entries (1·2·3일 전 모두 빈) 관찰 후 윈도우 확장.
  // 4일 전은 "어제 top" 표시로는 stale 하지만 페이지 비는 것보단 정보 유지.
  let top: WikiTrend[] = [];
  let anchorDaysAgo = 1;
  for (const daysAgo of [1, 2, 3, 4]) {
    top = await tryDate(project, daysAgo, limit);
    if (top.length > 0) {
      anchorDaysAgo = daysAgo;
      break;
    }
  }
  if (top.length === 0) return [];

  // ADR-0019: top 10 article에 대해 7일 historical 추가 fetch (5씩 chunk 병렬).
  const targets = top.slice(0, HISTORY_TOP_N);
  const histories = new Map<string, HistoryPoint[]>();
  for (let i = 0; i < targets.length; i += HISTORY_CHUNK) {
    const chunk = targets.slice(i, i + HISTORY_CHUNK);
    const results = await Promise.all(
      chunk.map((t) => fetchArticleHistory(project, decodeArticleKey(t.url), anchorDaysAgo)),
    );
    chunk.forEach((t, idx) => {
      const h = results[idx];
      if (h && h.length > 0) histories.set(t.url, h);
    });
  }

  return top.map((t) => {
    const h = histories.get(t.url);
    return h ? { ...t, history: h } : t;
  });
}

/** URL 끝의 article key 추출 — encodeURIComponent된 상태. */
function decodeArticleKey(url: string): string {
  const m = url.match(/\/wiki\/(.+)$/);
  return m?.[1] ?? '';
}

async function fetchArticleHistory(
  project: 'ko.wikipedia' | 'en.wikipedia',
  articleKey: string,
  anchorDaysAgo: number,
): Promise<HistoryPoint[] | null> {
  if (!articleKey) return null;
  const start = kstDateParts(anchorDaysAgo + HISTORY_DAYS - 1);
  const end = kstDateParts(anchorDaysAgo);
  const startStr = `${start.year}${start.month}${start.day}`;
  const endStr = `${end.year}${end.month}${end.day}`;
  const url = `${PER_ARTICLE_URL}/${project}/all-access/all-agents/${articleKey}/daily/${startStr}/${endStr}`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { items?: Array<{ timestamp?: string; views?: number }> };
    return (data.items ?? [])
      .filter((p): p is { timestamp: string; views: number } => !!p.timestamp && typeof p.views === 'number')
      .map((p) => ({
        // timestamp: "2026052100" → "2026-05-21"
        date: `${p.timestamp.slice(0, 4)}-${p.timestamp.slice(4, 6)}-${p.timestamp.slice(6, 8)}`,
        views: p.views,
      }));
  } catch {
    return null;
  }
}

async function tryDate(
  project: 'ko.wikipedia' | 'en.wikipedia',
  daysAgo: number,
  limit: number,
): Promise<WikiTrend[]> {
  const { year, month, day } = kstDateParts(daysAgo);
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

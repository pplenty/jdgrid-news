// Google Trends Daily RSS 풍부화 — ADR-0016.
// ht:approx_traffic, ht:picture, description, ht:news_item (nested) 모두 파싱.
// rss-parser는 nested namespaced 필드에 약해서 fast-xml-parser 직접 사용.

import { XMLParser } from 'fast-xml-parser';

import { cleanText } from '@/lib/normalize';
import type { GoogleNewsItem, Trend } from '@/lib/types';

const TRENDS_URL = 'https://trends.google.com/trending/rss';
const USER_AGENT = 'jdgrid-news/0.1 (+https://news.jdgrid.com)';
const FETCH_TIMEOUT_MS = 15_000;

type RawNewsItem = {
  'ht:news_item_title'?: string;
  'ht:news_item_url'?: string;
  'ht:news_item_source'?: string;
  'ht:news_item_picture'?: string;
};

type RawItem = {
  title?: string;
  description?: string;
  'ht:approx_traffic'?: string;
  'ht:picture'?: string;
  'ht:news_item'?: RawNewsItem[];
};

type RawFeed = {
  rss?: {
    channel?: {
      item?: RawItem[];
    };
  };
};

const parser = new XMLParser({
  ignoreAttributes: true,
  trimValues: true,
  // ht:news_item과 item은 항상 배열로 — 단일/복수 일관성.
  isArray: (name) => name === 'ht:news_item' || name === 'item',
});

export async function fetchGoogleTrends(geo: 'KR' | 'US', limit = 20): Promise<Trend[]> {
  const url = `${TRENDS_URL}?geo=${geo}`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/rss+xml,*/*' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) {
      console.warn(`[scrape] google trends ${geo} HTTP ${res.status}`);
      return [];
    }
    const xml = await res.text();
    const parsed = parser.parse(xml) as RawFeed;
    const items = parsed?.rss?.channel?.item ?? [];
    return items
      .slice(0, limit)
      .map(toTrend)
      .filter((t): t is Trend => t.keyword !== '');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[scrape] google trends ${geo} failed: ${msg}`);
    return [];
  }
}

function toTrend(raw: RawItem): Trend {
  const news = (raw['ht:news_item'] ?? [])
    .map(toNewsItem)
    .filter((n): n is GoogleNewsItem => n !== null);
  return {
    keyword: cleanText(raw.title),
    score: trafficToScore(raw['ht:approx_traffic']),
    source: 'google',
    traffic: raw['ht:approx_traffic']?.trim() || undefined,
    picture: raw['ht:picture']?.trim() || undefined,
    description: cleanText(raw.description) || undefined,
    googleArticles: news.length > 0 ? news : undefined,
    relatedUrls: [],
  };
}

function toNewsItem(raw: RawNewsItem): GoogleNewsItem | null {
  const title = cleanText(raw['ht:news_item_title']);
  const url = raw['ht:news_item_url']?.trim() ?? '';
  if (!title || !url) return null;
  return {
    title,
    url,
    source: cleanText(raw['ht:news_item_source']),
    picture: raw['ht:news_item_picture']?.trim() || undefined,
  };
}

/** "200K+" / "1M+" → 대략적 점수 (0~1로 정규화). */
function trafficToScore(traffic?: string): number {
  if (!traffic) return 0.5;
  const s = traffic.replace(/[+,\s]/g, '');
  const m = s.match(/^(\d+(?:\.\d+)?)([KkMm]?)/);
  if (!m) return 0.5;
  const n = parseFloat(m[1]!);
  const unit = m[2]?.toUpperCase();
  const mult = unit === 'M' ? 1_000_000 : unit === 'K' ? 1_000 : 1;
  const value = n * mult;
  if (value >= 10_000_000) return 1;
  if (value >= 1_000_000) return 0.85;
  if (value >= 500_000) return 0.7;
  if (value >= 100_000) return 0.55;
  if (value >= 50_000) return 0.4;
  if (value >= 10_000) return 0.3;
  return 0.2;
}

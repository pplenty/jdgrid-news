// Google Realtime Trends API — ADR-0017.
// 비공식 endpoint, 응답에 XSSI prefix `)]}',` 가 붙으므로 strip 후 JSON.parse.
// 응답 포맷이 바뀌면 본 모듈만 갱신.

import { cleanText } from '@/lib/normalize';
import type { RealtimeArticle, RealtimeCategory, RealtimeTrendStory } from '@/lib/types';

const BASE_URL = 'https://trends.google.com/trends/api/realtimetrends';
const USER_AGENT = 'jdgrid-news/0.1 (+https://news.jdgrid.com)';
const FETCH_TIMEOUT_MS = 15_000;
const XSSI_PREFIX = ")]}',";

/** Google cat 코드 → 우리 RealtimeCategory id 매핑. */
const CAT_MAP: Record<string, RealtimeCategory> = {
  h: 'top_stories',
  b: 'business',
  e: 'entertainment',
  m: 'health',
  t: 'sci_tech',
  s: 'sports',
};

const CATEGORY_CODES: ReadonlyArray<keyof typeof CAT_MAP> = ['h', 'b', 'e', 'm', 't', 's'];

type RawImage = {
  imgUrl?: string;
  imageUrl?: string;
  newsUrl?: string;
  source?: string;
};

type RawArticle = {
  articleTitle?: string;
  url?: string;
  source?: string;
  image?: RawImage;
  time?: string;
  snippet?: string;
};

type RawStory = {
  title?: string;
  entityNames?: string[];
  image?: RawImage;
  shareUrl?: string;
  articles?: RawArticle[];
};

type RawResponse = {
  storySummaries?: {
    trendingStories?: RawStory[];
  };
};

export async function fetchRealtimeTrendsByGeo(
  geo: 'KR' | 'global',
  limitPerCategory = 8,
): Promise<RealtimeTrendStory[]> {
  const geoParam = geo === 'KR' ? 'KR' : 'US';
  const hlParam = geo === 'KR' ? 'ko' : 'en-US';
  const tzParam = geo === 'KR' ? '-540' : '0';

  const results = await Promise.all(
    CATEGORY_CODES.map((code) =>
      fetchCategory(code, geoParam, hlParam, tzParam, geo, limitPerCategory),
    ),
  );
  return results.flat();
}

async function fetchCategory(
  code: keyof typeof CAT_MAP,
  geoParam: string,
  hlParam: string,
  tzParam: string,
  geoLabel: 'KR' | 'global',
  limit: number,
): Promise<RealtimeTrendStory[]> {
  const url = `${BASE_URL}?hl=${hlParam}&tz=${tzParam}&cat=${code}&fi=0&fs=0&geo=${geoParam}&ri=300&rs=20&sort=0`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json,text/plain,*/*',
        'Accept-Language': geoLabel === 'KR' ? 'ko-KR,ko;q=0.9' : 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) {
      console.warn(`[scrape] realtime ${geoLabel}/${code} HTTP ${res.status}`);
      return [];
    }
    const text = await res.text();
    const json = stripXssiPrefix(text);
    const parsed = JSON.parse(json) as RawResponse;
    const stories = parsed.storySummaries?.trendingStories ?? [];
    const category = CAT_MAP[code]!;
    return stories
      .slice(0, limit)
      .map((s) => toStory(s, category, geoLabel))
      .filter((s): s is RealtimeTrendStory => s.title !== '');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[scrape] realtime ${geoLabel}/${code} failed: ${msg}`);
    return [];
  }
}

function stripXssiPrefix(text: string): string {
  const trimmed = text.trimStart();
  return trimmed.startsWith(XSSI_PREFIX) ? trimmed.slice(XSSI_PREFIX.length).trimStart() : trimmed;
}

function toStory(
  raw: RawStory,
  category: RealtimeCategory,
  geo: 'KR' | 'global',
): RealtimeTrendStory {
  const articles = (raw.articles ?? [])
    .map(toArticle)
    .filter((a): a is RealtimeArticle => a !== null);
  return {
    title: cleanText(raw.title),
    entityNames: (raw.entityNames ?? []).map((e) => cleanText(e)).filter(Boolean),
    imageUrl: pickImageUrl(raw.image),
    shareUrl: raw.shareUrl?.trim() || undefined,
    category,
    geo,
    articles,
  };
}

function toArticle(raw: RawArticle): RealtimeArticle | null {
  const title = cleanText(raw.articleTitle);
  const url = raw.url?.trim() ?? '';
  if (!title || !url) return null;
  return {
    title,
    url,
    source: cleanText(raw.source),
    imageUrl: pickImageUrl(raw.image),
    publishedAt: raw.time?.trim() || undefined,
    snippet: cleanText(raw.snippet) || undefined,
  };
}

function pickImageUrl(image?: RawImage): string | undefined {
  if (!image) return undefined;
  return image.imgUrl?.trim() || image.imageUrl?.trim() || image.newsUrl?.trim() || undefined;
}

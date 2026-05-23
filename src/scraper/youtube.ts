// YouTube Data API v3 — Korea Trending. ADR-0026.
// YOUTUBE_API_KEY 환경변수 부재 시 graceful skip.

import { cleanText } from '@/lib/normalize';
import type { YouTubeTrend } from '@/lib/types';

const BASE = 'https://www.googleapis.com/youtube/v3/videos';
const USER_AGENT = 'jdgrid-trends/0.1 (+https://trends.jdgrid.com)';
const FETCH_TIMEOUT_MS = 15_000;
const REGION = 'KR';
const LIMIT = 20;

type RawThumb = { url?: string; width?: number; height?: number };
type RawSnippet = {
  title?: string;
  channelTitle?: string;
  publishedAt?: string;
  thumbnails?: {
    default?: RawThumb;
    medium?: RawThumb;
    high?: RawThumb;
    standard?: RawThumb;
    maxres?: RawThumb;
  };
};
type RawStatistics = {
  viewCount?: string;
  likeCount?: string;
  commentCount?: string;
};
type RawItem = {
  id?: string;
  snippet?: RawSnippet;
  statistics?: RawStatistics;
};
type RawResponse = {
  items?: RawItem[];
  error?: { message?: string };
};

export async function fetchYouTubeKorea(): Promise<YouTubeTrend[]> {
  const key = process.env.YOUTUBE_API_KEY?.trim();
  if (!key) return [];

  const url = `${BASE}?part=snippet,statistics&chart=mostPopular&regionCode=${REGION}&maxResults=${LIMIT}&key=${encodeURIComponent(key)}`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      console.warn(`[scrape] youtube HTTP ${res.status} ${txt.slice(0, 120)}`);
      return [];
    }
    const data = (await res.json()) as RawResponse;
    if (data.error) {
      console.warn(`[scrape] youtube error: ${data.error.message}`);
      return [];
    }
    return (data.items ?? [])
      .map(toTrend)
      .filter((t): t is YouTubeTrend => t !== null);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[scrape] youtube failed: ${msg}`);
    return [];
  }
}

function toTrend(raw: RawItem): YouTubeTrend | null {
  const id = raw.id?.trim();
  const title = cleanText(raw.snippet?.title);
  if (!id || !title) return null;
  const thumb =
    raw.snippet?.thumbnails?.maxres?.url ??
    raw.snippet?.thumbnails?.standard?.url ??
    raw.snippet?.thumbnails?.high?.url ??
    raw.snippet?.thumbnails?.medium?.url ??
    raw.snippet?.thumbnails?.default?.url ??
    '';
  return {
    id,
    title,
    channelTitle: cleanText(raw.snippet?.channelTitle),
    thumbnail: thumb,
    url: `https://www.youtube.com/watch?v=${id}`,
    viewCount: parseInt(raw.statistics?.viewCount ?? '0', 10) || 0,
    likeCount: parseInt(raw.statistics?.likeCount ?? '0', 10) || 0,
    commentCount: parseInt(raw.statistics?.commentCount ?? '0', 10) || 0,
    publishedAt: raw.snippet?.publishedAt ?? '',
  };
}

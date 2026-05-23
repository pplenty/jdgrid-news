// Hacker News (Algolia HN Search API) — ADR-0025.
// 무료/무인증, front_page top 20. Algolia가 호스팅 → 매우 안정.

import { cleanText } from '@/lib/normalize';
import type { HackerNewsStory } from '@/lib/types';

const ENDPOINT = 'https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=20';
const USER_AGENT = 'jdgrid-trends/0.1 (+https://trends.jdgrid.com)';
const FETCH_TIMEOUT_MS = 15_000;

type RawHit = {
  objectID?: string;
  title?: string;
  url?: string | null;
  points?: number;
  num_comments?: number;
  author?: string;
  created_at?: string;
};

type RawResponse = {
  hits?: RawHit[];
};

export async function fetchHackerNewsTop(): Promise<HackerNewsStory[]> {
  try {
    const res = await fetch(ENDPOINT, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) {
      console.warn(`[scrape] hackernews HTTP ${res.status}`);
      return [];
    }
    const data = (await res.json()) as RawResponse;
    return (data.hits ?? [])
      .map(toStory)
      .filter((s): s is HackerNewsStory => s !== null);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[scrape] hackernews failed: ${msg}`);
    return [];
  }
}

function toStory(raw: RawHit): HackerNewsStory | null {
  const idStr = raw.objectID;
  const title = cleanText(raw.title);
  if (!idStr || !title) return null;
  const id = Number(idStr);
  if (!Number.isFinite(id)) return null;
  const url = raw.url?.trim() || `https://news.ycombinator.com/item?id=${id}`;
  return {
    id,
    title,
    url,
    points: typeof raw.points === 'number' ? raw.points : 0,
    numComments: typeof raw.num_comments === 'number' ? raw.num_comments : 0,
    author: cleanText(raw.author),
    createdAt: raw.created_at ?? '',
  };
}

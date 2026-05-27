// Hacker News (Algolia HN Search API) — ADR-0025.
// 무료/무인증, front_page top 20. Algolia가 호스팅 → 매우 안정.

import { cleanText } from '@/lib/normalize';
import type { HackerNewsStory } from '@/lib/types';

import { errMessage, fetchJson } from './http';

const ENDPOINT = 'https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=20';

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
    const data = await fetchJson<RawResponse>(ENDPOINT);
    return (data.hits ?? []).map(toStory).filter((s): s is HackerNewsStory => s !== null);
  } catch (err) {
    console.warn(`[scrape] hackernews failed: ${errMessage(err)}`);
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

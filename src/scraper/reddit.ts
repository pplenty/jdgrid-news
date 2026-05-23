// Reddit r/all/top — ADR-0026. 무인증, User-Agent 필수.

import { cleanText } from '@/lib/normalize';
import type { RedditPost } from '@/lib/types';

const ENDPOINT = 'https://www.reddit.com/r/all/top.json?t=day&limit=25';
const USER_AGENT = 'jdgrid-trends/0.1 (+https://trends.jdgrid.com)';
const FETCH_TIMEOUT_MS = 15_000;
const REDDIT_BASE = 'https://www.reddit.com';

const THUMB_SENTINELS = new Set(['self', 'default', 'nsfw', 'spoiler', 'image', '']);

type RawPost = {
  id?: string;
  title?: string;
  subreddit?: string;
  url?: string;
  permalink?: string;
  score?: number;
  num_comments?: number;
  thumbnail?: string;
  created_utc?: number;
  is_self?: boolean;
};

type RawResponse = {
  data?: {
    children?: { data?: RawPost }[];
  };
};

export async function fetchRedditTop(): Promise<RedditPost[]> {
  try {
    const res = await fetch(ENDPOINT, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) {
      console.warn(`[scrape] reddit HTTP ${res.status}`);
      return [];
    }
    const data = (await res.json()) as RawResponse;
    return (data.data?.children ?? [])
      .map((c) => c.data)
      .filter((p): p is RawPost => !!p)
      .map(toPost)
      .filter((p): p is RedditPost => p !== null);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[scrape] reddit failed: ${msg}`);
    return [];
  }
}

function toPost(raw: RawPost): RedditPost | null {
  const id = raw.id?.trim();
  const title = cleanText(raw.title);
  if (!id || !title) return null;
  const permalink = raw.permalink ? `${REDDIT_BASE}${raw.permalink}` : '';
  const url = raw.is_self ? permalink : raw.url?.trim() || permalink;
  const thumb = raw.thumbnail?.trim();
  return {
    id,
    title,
    subreddit: cleanText(raw.subreddit),
    url,
    permalink,
    score: typeof raw.score === 'number' ? raw.score : 0,
    numComments: typeof raw.num_comments === 'number' ? raw.num_comments : 0,
    thumbnail: thumb && !THUMB_SENTINELS.has(thumb) && thumb.startsWith('http') ? thumb : undefined,
    createdAt:
      typeof raw.created_utc === 'number'
        ? new Date(raw.created_utc * 1000).toISOString()
        : '',
  };
}

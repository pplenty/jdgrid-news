// Reddit r/all/top — ADR-0026. 무인증, User-Agent 필수.
// UA 형식 <platform>:<app-id>:<version> 은 config.REDDIT_USER_AGENT.
// 2026-05-25 GitHub Actions cron HTTP 403 — datacenter IP 차단 의심. 효과 없으면
// ADR-0026 일부 supersede 후보 (source 제거).

import { cleanText } from '@/lib/normalize';
import type { RedditPost } from '@/lib/types';

import { REDDIT_USER_AGENT } from './config';
import { errMessage, fetchJson } from './http';

const ENDPOINT = 'https://www.reddit.com/r/all/top.json?t=day&limit=25';
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
    const data = await fetchJson<RawResponse>(ENDPOINT, { userAgent: REDDIT_USER_AGENT });
    return (data.data?.children ?? [])
      .map((c) => c.data)
      .filter((p): p is RawPost => !!p)
      .map(toPost)
      .filter((p): p is RedditPost => p !== null);
  } catch (err) {
    console.warn(`[scrape] reddit failed: ${errMessage(err)}`);
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
      typeof raw.created_utc === 'number' ? new Date(raw.created_utc * 1000).toISOString() : '',
  };
}

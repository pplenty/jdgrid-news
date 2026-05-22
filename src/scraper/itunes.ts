// Apple iTunes RSS Generator — Korea charts (음악·앱). ADR-0022.
// 무료/무인증/매우 안정. 24시간 갱신.
// docs: https://rss.applemarketingtools.com/

import type { ItunesTrend } from '@/lib/types';

const BASE = 'https://rss.applemarketingtools.com/api/v2/kr';
const USER_AGENT = 'jdgrid-trends/0.1 (+https://trends.jdgrid.com)';
const FETCH_TIMEOUT_MS = 15_000;
const LIMIT = 20;

type RawItunesItem = {
  name?: string;
  artistName?: string;
  artworkUrl100?: string;
  url?: string;
};

type RawResponse = {
  feed?: {
    results?: RawItunesItem[];
  };
};

async function fetchChart(path: string): Promise<RawItunesItem[]> {
  const url = `${BASE}${path}`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) {
      console.warn(`[scrape] itunes ${path} HTTP ${res.status}`);
      return [];
    }
    const data = (await res.json()) as RawResponse;
    return data.feed?.results ?? [];
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[scrape] itunes ${path} failed: ${msg}`);
    return [];
  }
}

function toTrend(raw: RawItunesItem, kind: 'song' | 'app'): ItunesTrend | null {
  const name = raw.name?.trim();
  const url = raw.url?.trim();
  const artworkUrl = raw.artworkUrl100?.trim();
  if (!name || !url || !artworkUrl) return null;
  return {
    name,
    artistName: raw.artistName?.trim() || undefined,
    artworkUrl,
    url,
    kind,
  };
}

export async function fetchItunesKorea(): Promise<{ music: ItunesTrend[]; apps: ItunesTrend[] }> {
  const [musicRaw, appsRaw] = await Promise.all([
    fetchChart(`/music/most-played/${LIMIT}/songs.json`),
    fetchChart(`/apps/top-free/${LIMIT}/apps.json`),
  ]);
  return {
    music: musicRaw.map((r) => toTrend(r, 'song')).filter((t): t is ItunesTrend => t !== null),
    apps: appsRaw.map((r) => toTrend(r, 'app')).filter((t): t is ItunesTrend => t !== null),
  };
}

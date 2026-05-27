// Apple iTunes RSS Generator — Korea charts (음악·앱). ADR-0022.
// 무료/무인증/매우 안정. 24시간 갱신.
// docs: https://rss.applemarketingtools.com/

import type { ItunesTrend } from '@/lib/types';

import { errMessage, fetchJson } from './http';

const BASE = 'https://rss.applemarketingtools.com/api/v2/kr';
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
  try {
    const data = await fetchJson<RawResponse>(`${BASE}${path}`);
    return data.feed?.results ?? [];
  } catch (err) {
    console.warn(`[scrape] itunes ${path} failed: ${errMessage(err)}`);
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

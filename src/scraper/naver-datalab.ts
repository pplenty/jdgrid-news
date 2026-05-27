// Naver DataLab 쇼핑 API — ADR-0020.
// 인증: NAVER_CLIENT_ID / NAVER_CLIENT_SECRET (.env.local 또는 GitHub Secrets).
// env 미설정 시 graceful skip — 빈 결과 반환, scraper가 snapshot.trends.naver 안 박음.

import { kstDateString } from '@/lib/date';
import type {
  HistoryPoint,
  NaverShoppingCategoryTrend,
  NaverShoppingKeyword,
} from '@/lib/types';

import { errMessage, fetchJson } from './http';
import { NAVER_CATEGORIES } from './naver-shopping-keywords';

const BASE_URL = 'https://openapi.naver.com/v1/datalab/shopping';
const HISTORY_DAYS = 14;
const TOP_PER_CATEGORY = 6;
const KEYWORD_CHUNK = 5;
/** Naver /categories API 제약 — 한 호출당 카테고리 3개 이하. */
const CATEGORY_CHUNK = 3;

type Credentials = { clientId: string; clientSecret: string };

function getCredentials(): Credentials | null {
  const clientId = process.env.NAVER_CLIENT_ID?.trim();
  const clientSecret = process.env.NAVER_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

async function naverFetch<T>(
  path: string,
  body: unknown,
  creds: Credentials,
): Promise<T | null> {
  try {
    return await fetchJson<T>(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Naver-Client-Id': creds.clientId,
        'X-Naver-Client-Secret': creds.clientSecret,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.warn(`[scrape] naver ${path} failed: ${errMessage(err)}`);
    return null;
  }
}

// ── 카테고리 분야별 트렌드 (한 호출에 모든 카테고리) ───────────────────────
type CategoriesResponse = {
  startDate?: string;
  endDate?: string;
  timeUnit?: string;
  results?: Array<{
    title?: string;
    category?: string[];
    data?: Array<{ period?: string; ratio?: number }>;
  }>;
};

export async function fetchNaverCategoryTrends(): Promise<NaverShoppingCategoryTrend[]> {
  const creds = getCredentials();
  if (!creds) return [];

  const out: NaverShoppingCategoryTrend[] = [];

  for (let i = 0; i < NAVER_CATEGORIES.length; i += CATEGORY_CHUNK) {
    const chunk = NAVER_CATEGORIES.slice(i, i + CATEGORY_CHUNK);
    const body = {
      startDate: kstDateString(HISTORY_DAYS),
      endDate: kstDateString(1),
      timeUnit: 'date',
      category: chunk.map((c) => ({ name: c.alias, param: [c.code] })),
    };
    const json = await naverFetch<CategoriesResponse>('/categories', body, creds);
    if (!json?.results) continue;
    for (const r of json.results) {
      const cat = NAVER_CATEGORIES.find((c) => c.alias === r.title);
      if (!cat) continue;
      out.push({
        category: cat.alias,
        categoryCode: cat.code,
        history: (r.data ?? []).map(toHistoryPoint).filter(isHistoryPoint),
      });
    }
  }

  return out;
}

// ── 카테고리 내 키워드 트렌드 (카테고리 × 키워드 5씩 chunk 병렬) ────────────
type KeywordsResponse = {
  results?: Array<{
    title?: string;
    keyword?: string[];
    data?: Array<{ period?: string; ratio?: number }>;
  }>;
};

export async function fetchNaverKeywordsByCategory(): Promise<Record<string, NaverShoppingKeyword[]>> {
  const creds = getCredentials();
  if (!creds) return {};

  // 카테고리는 병렬, 카테고리 안의 chunk는 순차 (rate limit 보수적).
  // 직렬이면 5 cat × 2 chunk × 15s timeout = 150s 워스트 → 병렬화로 30s로 단축.
  // 2026-05-23/24 cron timeout (10m/15m) 진단의 일환.
  const entries = await Promise.all(
    NAVER_CATEGORIES.map(async (cat): Promise<[string, NaverShoppingKeyword[]]> => {
      const keywords: NaverShoppingKeyword[] = [];
      for (let i = 0; i < cat.keywords.length; i += KEYWORD_CHUNK) {
        const chunk = cat.keywords.slice(i, i + KEYWORD_CHUNK);
        const body = {
          startDate: kstDateString(HISTORY_DAYS),
          endDate: kstDateString(1),
          timeUnit: 'date',
          category: cat.code,
          keyword: chunk.map((k) => ({ name: k, param: [k] })),
        };
        const json = await naverFetch<KeywordsResponse>('/category/keywords', body, creds);
        if (!json?.results) continue;
        for (const r of json.results) {
          const history = (r.data ?? []).map(toHistoryPoint).filter(isHistoryPoint);
          const last = history.at(-1)?.views ?? 0;
          keywords.push({
            category: cat.alias,
            categoryCode: cat.code,
            keyword: r.title ?? '',
            score: last,
            history,
          });
        }
      }
      keywords.sort((a, b) => b.score - a.score);
      return [cat.alias, keywords.slice(0, TOP_PER_CATEGORY)];
    }),
  );

  return Object.fromEntries(entries);
}

function toHistoryPoint(d: { period?: string; ratio?: number }): HistoryPoint | null {
  if (!d.period || typeof d.ratio !== 'number') return null;
  return { date: d.period, views: d.ratio };
}

function isHistoryPoint(p: HistoryPoint | null): p is HistoryPoint {
  return p !== null;
}

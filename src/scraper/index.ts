// jdgrid-news scraper — M1 수집 파이프라인.
// 흐름: RSS fetch → 정규화 → dedupe → 카테고리 버킷 → top 자동 집계
//      → 자체 키워드 추출 → Google Trends RSS → 트렌드 통합 + 기사 매칭 → data/*.json 쓰기.
// 관련 ADR: 0004 (저장), 0005 (RSS+Trends), 0006 (cron), 0007 (5필드 정책),
//          0008 (카테고리·단일 분류·top 자동), 0013 (매체 셋), 0014 (키워드 추출).

// ⚠ 환경변수 로드는 다른 import 전에 — 다른 모듈이 top-level에서 process.env를 읽을 가능성 보호.
import './load-env';

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { Garu } from 'garu-ko';
import Parser from 'rss-parser';

import {
  CATEGORY_IDS,
  CATEGORY_LABELS,
  CATEGORY_PRIORITY,
  type CategoryId,
} from '@/lib/categories';
import { formatDateKst } from '@/lib/date';
import { cleanText, idFromUrl, normalizeIsoDate } from '@/lib/normalize';
import type { Article, CategoryBucket, DailySnapshot, Trend, TrendStory } from '@/lib/types';

import { trendsToInferredStories } from './auto-categorize';
import { FETCH_TIMEOUT_MS, USER_AGENT } from './config';
import { dedupeArticles } from './dedupe';
import { fetchRealtimeStoriesByGeo } from './google-realtime';
import { fetchGoogleTrends } from './google-trends';
import { fetchHackerNewsTop } from './hackernews';
import { errMessage } from './http';
import { fetchItunesKorea } from './itunes';
import { extractDerivedKeywords, garuKoTokenizer, matchArticles } from './keywords';
import { fetchNaverCategoryTrends, fetchNaverKeywordsByCategory } from './naver-datalab';
import { fetchRedditTop } from './reddit';
import { SOURCES, type Source } from './sources';
import { fetchWikipediaTop } from './wikipedia';
import { fetchYouTubeKorea } from './youtube';

// ── 튜닝 상수 (운영 튜닝 영역) ──────────────────────────────────────────
const TOP_PER_CATEGORY = 12;
const TOP_AGGREGATE = 8;
const TREND_TOP_N = 20;

const DATA_DIR = resolve(process.cwd(), 'data');

// rss-parser 인스턴스. media:thumbnail, media:content 같은 namespaced 필드 일부 캡처.
type ItemExtras = {
  mediaThumbnail?: { $?: { url?: string } } | Array<{ $?: { url?: string } }>;
  mediaContent?: { $?: { url?: string; medium?: string; type?: string } };
  'media:thumbnail'?: unknown;
  'content:encoded'?: string;
};

const parser: Parser<unknown, ItemExtras> = new Parser({
  timeout: FETCH_TIMEOUT_MS,
  headers: { 'User-Agent': USER_AGENT },
  customFields: {
    item: [
      ['media:thumbnail', 'mediaThumbnail', { keepArray: false }],
      ['media:content', 'mediaContent', { keepArray: false }],
      ['content:encoded', 'content:encoded'],
    ],
  },
});

type FetchedItem = {
  source: Source;
  item: Parser.Item & ItemExtras;
};

async function fetchSource(source: Source): Promise<FetchedItem[]> {
  try {
    const feed = await parser.parseURL(source.url);
    const items = feed.items ?? [];
    return items.map((item) => ({ source, item }));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[scrape] ${source.id} failed: ${msg}`);
    return [];
  }
}

function extractImageUrl(item: Parser.Item & ItemExtras): string | undefined {
  // 1. enclosure (image/*)
  const enc = item.enclosure;
  if (enc?.url && (!enc.type || enc.type.startsWith('image/'))) {
    return enc.url;
  }
  // 2. media:thumbnail
  const thumb = item.mediaThumbnail;
  if (thumb) {
    const url = Array.isArray(thumb) ? thumb[0]?.$?.url : thumb.$?.url;
    if (url) return url;
  }
  // 3. media:content (image type)
  const mc = item.mediaContent;
  if (mc?.$?.url && (!mc.$.type || mc.$.type.startsWith('image/'))) {
    return mc.$.url;
  }
  // 4. content/description의 첫 <img src="...">
  const content =
    item['content:encoded'] ?? item.content ?? item.contentSnippet ?? item.summary ?? '';
  const m = String(content).match(/<img[^>]+src=["']([^"']+)["']/i);
  if (m?.[1]) return m[1];
  return undefined;
}

function toArticle(raw: FetchedItem): Article | null {
  const link = raw.item.link?.trim();
  if (!link) return null;
  const title = cleanText(raw.item.title);
  if (!title) return null;

  // ADR-0007: summary는 RSS description 그대로. cleanText는 HTML/엔티티/공백 정규화만.
  const rawSummary =
    raw.item.contentSnippet ?? raw.item.summary ?? raw.item.content ?? '';
  const summary = cleanText(rawSummary);

  return {
    id: idFromUrl(link),
    title,
    summary,
    url: link,
    source: {
      name: raw.source.name,
      url: raw.source.homepage,
    },
    publishedAt: normalizeIsoDate(raw.item.isoDate ?? raw.item.pubDate),
    lang: raw.source.lang,
    imageUrl: extractImageUrl(raw.item),
    category: raw.source.category,
  };
}

function sortByRecency(articles: ReadonlyArray<Article>): Article[] {
  return [...articles].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

function bucketByCategory(articles: ReadonlyArray<Article>): Map<CategoryId, Article[]> {
  const map = new Map<CategoryId, Article[]>();
  for (const id of CATEGORY_IDS) map.set(id, []);
  for (const a of articles) {
    map.get(a.category)?.push(a);
  }
  return map;
}

/** top 자동 집계 (ADR-0008): 우선순위 카테고리에서 라운드로빈으로 N건. */
function aggregateTop(buckets: Map<CategoryId, Article[]>): Article[] {
  const out: Article[] = [];
  const seenIds = new Set<string>();
  const rotations = Math.ceil(TOP_AGGREGATE / CATEGORY_PRIORITY.length) + 1;
  for (let i = 0; i < rotations; i++) {
    for (const cat of CATEGORY_PRIORITY) {
      const items = buckets.get(cat) ?? [];
      const candidate = items[i];
      if (candidate && !seenIds.has(candidate.id)) {
        out.push(candidate);
        seenIds.add(candidate.id);
        if (out.length >= TOP_AGGREGATE) return out;
      }
    }
  }
  return out;
}

function derivedToTrend(derived: Array<{ keyword: string; count: number }>): Trend[] {
  const maxCount = derived[0]?.count ?? 1;
  return derived.map(({ keyword, count }) => ({
    keyword,
    score: maxCount > 0 ? count / maxCount : 0,
    source: 'derived',
    relatedUrls: [],
  }));
}

/** Google Trends를 우선 노출하고 부족분만 derived로 보충. 키 중복 제거. */
function mergeTrends(primary: Trend[], secondary: Trend[], cap: number): Trend[] {
  const out: Trend[] = [];
  const seen = new Set<string>();
  for (const t of [...primary, ...secondary]) {
    const key = t.keyword.toLowerCase().trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(t);
    if (out.length >= cap) break;
  }
  return out;
}

/** realtime 스토리가 있으면 우선, 자체 분류는 같은 (category, title) 중복 제거 후 보충. ADR-0018. */
function mergeStories(realtime: TrendStory[], inferred: TrendStory[]): TrendStory[] {
  const out: TrendStory[] = [...realtime];
  const seen = new Set(realtime.map((s) => `${s.category}|${s.title.toLowerCase().trim()}`));
  for (const s of inferred) {
    const key = `${s.category}|${s.title.toLowerCase().trim()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}

function matchTrendsToArticles(
  trends: ReadonlyArray<Trend>,
  articles: ReadonlyArray<Article>,
): Trend[] {
  return trends.map((t) => ({
    ...t,
    relatedUrls: matchArticles(t.keyword, articles),
  }));
}

function writeSnapshot(snapshot: DailySnapshot): void {
  const datedPath = resolve(DATA_DIR, `${snapshot.date}.json`);
  const latestPath = resolve(DATA_DIR, 'latest.json');
  const payload = `${JSON.stringify(snapshot, null, 2)}\n`;
  mkdirSync(dirname(datedPath), { recursive: true });
  writeFileSync(datedPath, payload, 'utf8');
  writeFileSync(latestPath, payload, 'utf8');
}

// phase별 timing 로그 helper — 외부 API 느려질 때 어느 단계인지 진단.
async function timed<T>(label: string, p: Promise<T>): Promise<T> {
  const t0 = Date.now();
  const result = await p;
  console.log(`[scrape:${label}] ${Date.now() - t0}ms`);
  return result;
}

async function main(): Promise<void> {
  const startedAt = Date.now();
  console.log(`[scrape] start — ${SOURCES.length} sources`);

  // env 가시성: optional credential 존재 여부. 미설정은 graceful skip(빈 데이터) — 빈 source 진단용.
  const envFlag = (k: string): string => (process.env[k]?.trim() ? 'set' : 'missing');
  console.log(
    `[scrape:env] NAVER_CLIENT_ID=${envFlag('NAVER_CLIENT_ID')} NAVER_CLIENT_SECRET=${envFlag('NAVER_CLIENT_SECRET')} YOUTUBE_API_KEY=${envFlag('YOUTUBE_API_KEY')}`,
  );

  // 1. RSS 병렬 fetch
  const rssStart = Date.now();
  const fetched = await Promise.all(SOURCES.map(fetchSource));
  const okCount = fetched.filter((arr) => arr.length > 0).length;
  const items = fetched.flat();
  console.log(
    `[scrape:rss] ${Date.now() - rssStart}ms — ${items.length} items from ${okCount}/${SOURCES.length} sources`,
  );

  // 2. 정규화
  const articles: Article[] = [];
  for (const raw of items) {
    const a = toArticle(raw);
    if (a) articles.push(a);
  }

  // 3. dedupe
  const deduped = dedupeArticles(articles);
  console.log(`[scrape] ${articles.length} → ${deduped.length} after dedupe`);

  // 4. 카테고리 버킷 + 최신순 + 상위 N건
  const buckets = bucketByCategory(deduped);
  for (const [id, list] of buckets) {
    buckets.set(id, sortByRecency(list).slice(0, TOP_PER_CATEGORY));
  }

  // 5. top 자동 집계 (ADR-0008)
  buckets.set('top', aggregateTop(buckets));

  // 6. 자체 키워드 추출 + 빈도 (워드클라우드용 별도 보관)
  const koArticles = deduped.filter((a) => a.lang === 'ko');
  const enArticles = deduped.filter((a) => a.lang === 'en');
  // 한국어 키워드는 garu-ko 형태소 명사 추출(ADR-0035). load 실패 시 v0 tokenizer로 graceful fallback.
  let koTokenizer: ((text: string) => string[]) | undefined;
  try {
    const garu = await Garu.load();
    koTokenizer = garuKoTokenizer((t, o) => garu.nouns(t, o));
    console.log('[scrape] garu-ko loaded — morphological ko keywords');
  } catch (err) {
    console.warn(`[scrape] garu-ko load failed — v0 tokenizer fallback: ${errMessage(err)}`);
  }
  // cloud(top 40)만 계산하고 derived(top 20)는 prefix slice — 같은 기사를 garu로 두 번
  // 토큰화하던 중복 제거(형태소 분석이 토큰화 비용의 대부분).
  const cloudKo = extractDerivedKeywords(koArticles, 40, koTokenizer);
  const cloudEn = extractDerivedKeywords(enArticles, 40);
  const derivedKr = cloudKo.slice(0, TREND_TOP_N);
  const derivedGlobal = cloudEn.slice(0, TREND_TOP_N);

  // 7. 외부 신호 병렬 fetch: Google Daily RSS, Google realtime API(현재 404),
  //    Wikipedia Pageviews 한·영 (ADR-0018), Naver DataLab 쇼핑 (ADR-0020, env 없으면 빈 결과).
  //    각 fetcher 자체 graceful skip → Promise.all 안전.
  const signalsStart = Date.now();
  const [
    googleKr,
    googleGlobal,
    realtimeKr,
    realtimeGlobal,
    wikiKo,
    wikiEn,
    naverCategoryTrends,
    naverKeywords,
    itunes,
    hackernews,
    youtube,
    reddit,
  ] = await Promise.all([
    timed('google-kr', fetchGoogleTrends('KR')),
    timed('google-us', fetchGoogleTrends('US')),
    timed('realtime-kr', fetchRealtimeStoriesByGeo('KR')),
    timed('realtime-global', fetchRealtimeStoriesByGeo('global')),
    timed('wiki-ko', fetchWikipediaTop('ko.wikipedia')),
    timed('wiki-en', fetchWikipediaTop('en.wikipedia')),
    timed('naver-categories', fetchNaverCategoryTrends()),
    timed('naver-keywords', fetchNaverKeywordsByCategory()),
    timed('itunes', fetchItunesKorea()),
    timed('hackernews', fetchHackerNewsTop()),
    timed('youtube', fetchYouTubeKorea()),
    timed('reddit', fetchRedditTop()),
  ]);
  console.log(`[scrape:signals] ${Date.now() - signalsStart}ms total`);

  // 8. Daily 트렌드 통합 + 기사 매칭 (정확 부분문자열, ADR-0014)
  const mergedKr = mergeTrends(googleKr, derivedToTrend(derivedKr), TREND_TOP_N);
  const mergedGlobal = mergeTrends(googleGlobal, derivedToTrend(derivedGlobal), TREND_TOP_N);
  const trendsKr = matchTrendsToArticles(mergedKr, deduped);
  const trendsGlobal = matchTrendsToArticles(mergedGlobal, deduped);

  // 9. trend stories — Google realtime(있으면) + 자체 분류(보완). ADR-0018
  const inferredKr = trendsToInferredStories(trendsKr, deduped, 'KR');
  const inferredGlobal = trendsToInferredStories(trendsGlobal, deduped, 'global');
  const storiesKr = mergeStories(realtimeKr, inferredKr);
  const storiesGlobal = mergeStories(realtimeGlobal, inferredGlobal);

  // 10. snapshot 작성
  const now = new Date();
  const hasStories = storiesKr.length > 0 || storiesGlobal.length > 0;
  const hasWiki = wikiKo.length > 0 || wikiEn.length > 0;
  const hasNaver = naverCategoryTrends.length > 0 || Object.keys(naverKeywords).length > 0;
  const hasItunes = itunes.music.length > 0 || itunes.apps.length > 0;
  const hasCloud = cloudKo.length > 0 || cloudEn.length > 0;
  const hasHN = hackernews.length > 0;
  const hasYouTube = youtube.length > 0;
  const hasReddit = reddit.length > 0;
  const snapshot: DailySnapshot = {
    generatedAt: now.toISOString(),
    date: formatDateKst(now),
    categories: CATEGORY_IDS.map(
      (id): CategoryBucket => ({
        id,
        label: CATEGORY_LABELS[id],
        items: buckets.get(id) ?? [],
      }),
    ),
    trends: {
      global: trendsGlobal,
      kr: trendsKr,
      ...(hasStories && { stories: { kr: storiesKr, global: storiesGlobal } }),
      ...(hasWiki && { wikipedia: { ko: wikiKo, en: wikiEn } }),
      ...(hasNaver && {
        naver: {
          keywordsByCategory: naverKeywords,
          categoryTrends: naverCategoryTrends,
        },
      }),
      ...(hasItunes && { itunes }),
      ...(hasCloud && { derived: { ko: cloudKo, en: cloudEn } }),
      ...(hasHN && { hackernews }),
      ...(hasYouTube && { youtube }),
      ...(hasReddit && { reddit }),
    },
  };

  writeSnapshot(snapshot);

  const ms = Date.now() - startedAt;
  const trendsCount = trendsKr.length + trendsGlobal.length;
  const storiesCount = storiesKr.length + storiesGlobal.length;
  const wikiCount = wikiKo.length + wikiEn.length;
  const naverKeywordCount = Object.values(naverKeywords).reduce((n, arr) => n + arr.length, 0);
  console.log(
    `[scrape] done — ${snapshot.date}, ${deduped.length} articles, ${trendsCount} daily trends, ${storiesCount} stories (realtime ${realtimeKr.length + realtimeGlobal.length} / inferred ${inferredKr.length + inferredGlobal.length}), ${wikiCount} wiki entries, ${naverCategoryTrends.length} naver category trends + ${naverKeywordCount} naver keywords in ${ms}ms`,
  );

  // 신호 source별 건수 + 빈 source 경고 — 어떤 source가 비었는지 한눈에 (운영 가시성).
  const signalCounts: Record<string, number> = {
    rss: okCount,
    google: googleKr.length + googleGlobal.length,
    wiki: wikiCount,
    'naver-cat': naverCategoryTrends.length,
    'naver-kw': naverKeywordCount,
    itunes: itunes.music.length + itunes.apps.length,
    hackernews: hackernews.length,
    youtube: youtube.length,
    reddit: reddit.length,
    realtime: realtimeKr.length + realtimeGlobal.length,
  };
  const emptySignals = Object.entries(signalCounts)
    .filter(([, n]) => n === 0)
    .map(([k]) => k);
  const countsStr = Object.entries(signalCounts)
    .map(([k, n]) => `${k}=${n}`)
    .join(' ');
  console.log(
    `[scrape:summary] ${countsStr}${emptySignals.length ? ` | empty: ${emptySignals.join(',')}` : ''}`,
  );
}

main()
  .then(() => {
    // 명시적 종료. fetch(undici) keepAlive socket + 실패한 fetcher의 미정리 connection이
    // 남아있으면 Node가 자연 종료를 못 하고 hang → GitHub Actions job timeout.
    // 2026-05-25 cron이 scrape 7.2s 완료 후에도 15m timeout cancel 됐던 원인.
    process.exit(0);
  })
  .catch((err) => {
    console.error('[scrape] failed', err);
    process.exit(1);
  });

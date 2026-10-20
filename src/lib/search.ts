// 사이트 내 검색 (ADR-0042 · ADR-0045). 빌드타임에 인덱스를 만들어 /search-index.json 으로
// 내보내고, 클라이언트가 fetch 해 substring/token 스코어로 필터한다. 서버/외부 의존 없음.
//
// 순수 함수 — 결정적, 테스트 가능. 매칭은 검색 시점에 정규화(인덱스는 가볍게 유지).
// 클라이언트 번들에도 들어가므로 node:fs 를 끌고 오는 모듈은 type import 만 허용.

import { CATEGORY_IDS, CATEGORY_LABELS, type CategoryId } from './categories';
import type { KeywordEntry } from './keyword-index';
import type { DailySnapshot } from './types';

/** 기사 검색 범위 — 최근 N일 수집분. 오래된 기사는 링크가 깨지기 쉽고 인덱스만 키운다. */
export const SEARCH_ARTICLE_DAYS = 7;

export type SearchDocType = 'keyword' | 'category' | 'article';

export type SearchDoc = {
  type: SearchDocType;
  /** 표시 + 매칭 대상. */
  title: string;
  /** 내부 경로(/k, /c) 또는 외부 기사 URL. */
  url: string;
  /** 부가 맥락 + 보조 매칭 텍스트 (매체명 / traffic / 영문 라벨). */
  subtitle?: string;
  /** 기사·카테고리 분류. */
  category?: CategoryId;
  /** 외부 링크(기사) 여부 — UI 에서 새 탭/아이콘 구분. */
  external?: boolean;
  /** 키워드는 마지막 등장일, 기사는 가장 최근 수집일 (YYYY-MM-DD). 카테고리는 없음. */
  date?: string;
};

/** /search-index.json 의 형태. date = 빌드 기준 최신 스냅샷 일자('오늘'의 기준). */
export type SearchIndex = {
  date: string;
  docs: SearchDoc[];
};

export type SearchIndexInput = {
  /** 보존 창 안의 키워드 = 살아있는 /k 페이지 집합 (ADR-0044). 결과가 404 로 가지 않도록 같은 출처. */
  keywords: ReadonlyArray<KeywordEntry>;
  /** 기사를 담을 스냅샷들 (호출 측이 최근 SEARCH_ARTICLE_DAYS 일만 넘김). 순서 무관. */
  articleSnapshots: ReadonlyArray<DailySnapshot>;
};

/** 키워드(/k) + 카테고리(/c) + 기사(외부) 검색 인덱스. 키워드는 소문자, 기사는 id 기준 중복 제거. */
export function buildSearchIndex({ keywords, articleSnapshots }: SearchIndexInput): SearchDoc[] {
  const docs: SearchDoc[] = [];

  // 1. 트렌드 키워드 (/k 페이지 존재). 키워드 인덱스가 이미 소문자 기준으로 합쳐 둠.
  for (const entry of keywords) {
    docs.push({
      type: 'keyword',
      title: entry.keyword,
      url: `/k/${encodeURIComponent(entry.keyword)}/`,
      subtitle: entry.traffic,
      date: entry.dates[0],
    });
  }

  // 2. 카테고리 (/c 페이지). 라벨(ko)로 검색, 영문 라벨도 보조 매칭.
  for (const id of CATEGORY_IDS) {
    const label = CATEGORY_LABELS[id];
    docs.push({
      type: 'category',
      title: label.ko,
      subtitle: label.en,
      url: `/c/${id}/`,
      category: id,
    });
  }

  // 3. 기사 (외부 링크). 최신 스냅샷부터 모든 버킷 순회 + id 중복 제거 — top 버킷은 타
  // 카테고리 재집계이고, 같은 기사가 며칠 연속 수집되기도 함(가장 최근 수집일을 남김).
  const ordered = [...articleSnapshots].sort((a, b) => compareDesc(a.date, b.date));
  const seenArticle = new Set<string>();
  for (const snapshot of ordered) {
    for (const bucket of snapshot.categories) {
      for (const a of bucket.items) {
        if (seenArticle.has(a.id)) continue;
        seenArticle.add(a.id);
        docs.push({
          type: 'article',
          title: a.title,
          url: a.url,
          subtitle: a.source.name,
          category: a.category,
          external: true,
          date: snapshot.date,
        });
      }
    }
  }

  return docs;
}

function compareDesc(a: string, b: string): number {
  return a < b ? 1 : a > b ? -1 : 0;
}

/** 'YYYY-MM-DD' 두 개 사이 일수 (today - date). 형식이 깨졌으면 NaN. */
function daysBetween(date: string, today: string): number {
  return (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${date}T00:00:00Z`)) / 86_400_000;
}

/** 결과 행에 붙는 날짜 — 오늘이면 '오늘', 아니면 'M월 D일'. 90일 창이라 연도는 생략. */
export function resultDateLabel(date: string, today: string): string {
  if (date === today) return '오늘';
  const [, m, d] = date.split('-');
  return m && d ? `${Number(m)}월 ${Number(d)}일` : date;
}

function norm(s: string): string {
  return s.normalize('NFC').toLowerCase().trim();
}

const TYPE_WEIGHT: Record<SearchDocType, number> = {
  keyword: 6, // 내부 집계 페이지 — 검색 의도에 가장 부합
  category: 4,
  article: 0,
};

/** 단일 문서 점수. 매칭 없으면 -1. */
function scoreDoc(doc: SearchDoc, nq: string, tokens: string[], today?: string): number {
  const title = norm(doc.title);
  if (!title) return -1;
  const hay = doc.subtitle ? `${title} ${norm(doc.subtitle)}` : title;

  let score: number;
  if (title === nq) score = 100;
  else if (title.startsWith(nq)) score = 60;
  else if (title.includes(nq)) score = 40;
  else if (hay.includes(nq)) score = 20;
  else if (tokens.length > 1 && tokens.every((t) => hay.includes(t))) score = 15;
  else return -1;

  score += TYPE_WEIGHT[doc.type];
  // 짧은 제목 = 더 정확한 매칭으로 가산 (prefix·exact 보강).
  score += Math.max(0, 8 - Math.floor(title.length / 8));
  score += recencyBonus(doc.date, today);
  return score;
}

/**
 * 최신성 가산 (ADR-0045) — 오늘 6, 1주 전 3, 한 달 전 1, 그 뒤 0. 매칭 단계(exact 100 ·
 * prefix 60 · includes 40) 사이 간격보다 작아서, 비슷한 점수끼리만 순서를 바꾼다.
 */
function recencyBonus(date: string | undefined, today: string | undefined): number {
  if (!date || !today) return 0;
  const age = daysBetween(date, today);
  if (!(age >= 0)) return 0;
  return Math.round(6 / (1 + age / 7));
}

/**
 * 인덱스에서 query 매칭 + 점수 내림차순 정렬. 빈/짧은 query 는 빈 결과.
 * today(인덱스 기준일)를 주면 최근 것에 가산점. 동점은 type(keyword>category>article)
 * → 최근 일자 → 제목 길이 → 제목 사전순으로 안정 정렬.
 */
export function searchDocs(
  docs: SearchDoc[],
  query: string,
  limit = 60,
  today?: string,
): SearchDoc[] {
  const nq = norm(query);
  if (nq.length < 1) return [];
  const tokens = nq.split(/\s+/).filter(Boolean);

  const scored: { doc: SearchDoc; score: number }[] = [];
  for (const doc of docs) {
    const score = scoreDoc(doc, nq, tokens, today);
    if (score >= 0) scored.push({ doc, score });
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.doc.type !== b.doc.type) return TYPE_WEIGHT[b.doc.type] - TYPE_WEIGHT[a.doc.type];
    if (a.doc.date !== b.doc.date) return compareDesc(a.doc.date ?? '', b.doc.date ?? '');
    if (a.doc.title.length !== b.doc.title.length) return a.doc.title.length - b.doc.title.length;
    return a.doc.title.localeCompare(b.doc.title);
  });

  return scored.slice(0, limit).map((s) => s.doc);
}

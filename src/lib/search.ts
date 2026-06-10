// 사이트 내 검색 (ADR-0042). 빌드타임에 최신 스냅샷으로 인덱스를 만들어 /search 페이지에
// 임베드하고, 클라이언트에서 substring/token 스코어로 필터한다. 서버/외부 의존 없음.
//
// 순수 함수 — 결정적, 테스트 가능. 매칭은 검색 시점에 정규화(인덱스는 가볍게 유지).

import { CATEGORY_IDS, CATEGORY_LABELS, type CategoryId } from './categories';
import type { DailySnapshot } from './types';

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
};

/** 최신 스냅샷 → 검색 인덱스. 키워드(/k) + 카테고리(/c) + 기사(외부). 중복 제거. */
export function buildSearchIndex(snapshot: DailySnapshot): SearchDoc[] {
  const docs: SearchDoc[] = [];

  // 1. 트렌드 키워드 (/k 페이지 존재). kr+global, 소문자 기준 중복 제거.
  const seenKw = new Set<string>();
  for (const t of [...snapshot.trends.kr, ...snapshot.trends.global]) {
    const kw = t.keyword?.trim();
    if (!kw) continue;
    const key = kw.toLowerCase();
    if (seenKw.has(key)) continue;
    seenKw.add(key);
    docs.push({
      type: 'keyword',
      title: kw,
      url: `/k/${encodeURIComponent(kw)}/`,
      subtitle: t.traffic,
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

  // 3. 기사 (외부 링크). 모든 버킷 순회 + id 중복 제거(top 버킷은 타 카테고리 재집계).
  const seenArticle = new Set<string>();
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
      });
    }
  }

  return docs;
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
function scoreDoc(doc: SearchDoc, nq: string, tokens: string[]): number {
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
  return score;
}

/**
 * 인덱스에서 query 매칭 + 점수 내림차순 정렬. 빈/짧은 query 는 빈 결과.
 * 동점은 type(keyword>category>article) → 제목 길이 → 제목 사전순으로 안정 정렬.
 */
export function searchDocs(docs: SearchDoc[], query: string, limit = 60): SearchDoc[] {
  const nq = norm(query);
  if (nq.length < 1) return [];
  const tokens = nq.split(/\s+/).filter(Boolean);

  const scored: { doc: SearchDoc; score: number }[] = [];
  for (const doc of docs) {
    const score = scoreDoc(doc, nq, tokens);
    if (score >= 0) scored.push({ doc, score });
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.doc.type !== b.doc.type) return TYPE_WEIGHT[b.doc.type] - TYPE_WEIGHT[a.doc.type];
    if (a.doc.title.length !== b.doc.title.length) return a.doc.title.length - b.doc.title.length;
    return a.doc.title.localeCompare(b.doc.title);
  });

  return scored.slice(0, limit).map((s) => s.doc);
}

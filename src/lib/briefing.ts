// 일일 트렌드 브리핑 — 데이터에서 계산하는 결정적 원천 텍스트 (ADR-0039).
//
// ADR-0007 호환: 기사 본문 재가공·재요약이 아니라 *우리가 수집한 트렌드의 메타분석*.
// 렌더타임 server 계산(loadLatest + loadPrevious) — 스키마·스크레이퍼 불변. 결정적(Date/random 미사용).
// Movers(Google 트렌드 순위 변화 viz)와 신호·형태 모두 다름 — derived 빈도 클라우드 기반 텍스트 요약.

import type { CategoryId } from './categories';
import type { DailySnapshot } from './types';

type Cloud = { keyword: string; count: number }[];

export type Riser = { keyword: string; lang: 'ko' | 'en'; count: number; delta: number };
export type NewKeyword = { keyword: string; lang: 'ko' | 'en'; count: number };

export type Briefing = {
  date: string;
  /** 어제 snapshot 유무 — false면 delta 기반(급상승·신규) 생략. */
  hasPrev: boolean;
  /** 노출 기준 오늘 주요 기사 수 (top 버킷 제외 합 — 카테고리별 상한 적용된 큐레이션 수). */
  totalArticles: number;
  /** 가장 활발한 카테고리 (노출 수 기준). */
  topCategory: { id: CategoryId; label: string; count: number } | null;
  /** 국내·해외 톱 트렌드 키워드. */
  topKr: string[];
  topGlobal: string[];
  /** 어제 대비 급상승 (derived 빈도 delta — *어제도 있던* 키워드만). */
  risersKo: Riser[];
  risersEn: Riser[];
  /** 어제 없던 신규 키워드. */
  newKo: NewKeyword[];
  newEn: NewKeyword[];
  /** KR·global 트렌드 동시 등장 (교차 신호). */
  crossSignals: string[];
};

const norm = (s: string) => s.toLowerCase().trim();

/** 어제도 존재했고 빈도가 오른 키워드 = 급상승. 신규(어제 부재)는 fresh()로 분리. */
function risers(today: Cloud, prev: Cloud, lang: 'ko' | 'en', topN: number): Riser[] {
  const prevMap = new Map(prev.map((k) => [k.keyword, k.count]));
  return today
    .filter((k) => prevMap.has(k.keyword))
    .map((k) => ({ keyword: k.keyword, lang, count: k.count, delta: k.count - prevMap.get(k.keyword)! }))
    .filter((r) => r.delta > 0)
    .sort((a, b) => b.delta - a.delta || b.count - a.count || (a.keyword < b.keyword ? -1 : 1))
    .slice(0, topN);
}

/** 어제 클라우드에 없던 신규 키워드 (빈도순). */
function fresh(today: Cloud, prev: Cloud, lang: 'ko' | 'en', topN: number): NewKeyword[] {
  const prevSet = new Set(prev.map((k) => k.keyword));
  return today
    .filter((k) => !prevSet.has(k.keyword))
    .sort((a, b) => b.count - a.count || (a.keyword < b.keyword ? -1 : 1))
    .slice(0, topN)
    .map((k) => ({ keyword: k.keyword, lang, count: k.count }));
}

export function buildBriefing(today: DailySnapshot, prev: DailySnapshot | null): Briefing {
  // 카테고리 활동량 (top 버킷은 다른 카테고리 중복 집계라 제외)
  let totalArticles = 0;
  let topCategory: Briefing['topCategory'] = null;
  for (const c of today.categories) {
    if (c.id === 'top') continue;
    const n = c.items.length;
    totalArticles += n;
    if (n > 0 && (!topCategory || n > topCategory.count)) {
      topCategory = { id: c.id, label: c.label.ko, count: n };
    }
  }

  const topKr = today.trends.kr.slice(0, 5).map((t) => t.keyword);
  const topGlobal = today.trends.global.slice(0, 5).map((t) => t.keyword);

  // 교차 신호: KR·global 트렌드 동시 등장 (대소문자 무시, 중복 제거)
  const krSet = new Set(today.trends.kr.map((t) => norm(t.keyword)));
  const crossSignals = [
    ...new Set(today.trends.global.filter((t) => krSet.has(norm(t.keyword))).map((t) => t.keyword)),
  ];

  const koT = today.trends.derived?.ko ?? [];
  const enT = today.trends.derived?.en ?? [];
  const koP = prev?.trends.derived?.ko ?? [];
  const enP = prev?.trends.derived?.en ?? [];
  const hasPrev = prev != null;

  return {
    date: today.date,
    hasPrev,
    totalArticles,
    topCategory,
    topKr,
    topGlobal,
    risersKo: hasPrev ? risers(koT, koP, 'ko', 5) : [],
    risersEn: hasPrev ? risers(enT, enP, 'en', 5) : [],
    newKo: hasPrev ? fresh(koT, koP, 'ko', 5) : [],
    newEn: hasPrev ? fresh(enT, enP, 'en', 5) : [],
    crossSignals,
  };
}

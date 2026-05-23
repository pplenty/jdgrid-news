// ADR-0023: 어제↔오늘 트렌드 비교.
// Google Daily Trends 키워드 셋을 어제 snapshot과 대조해 new/rising 분류.

import type { Trend } from './types';

const RISING_THRESHOLD = 5; // 순위 ≥ N계단 상승 시 rising
const TOP_LIMIT = 20; // 비교 대상은 각자 top N에서만

export type MoverKind = 'new' | 'rising';

export type Mover = {
  trend: Trend;
  /** 오늘 순위 (0-indexed). */
  todayRank: number;
  /** 어제 순위. new면 undefined. */
  yesterdayRank?: number;
  /** 순위 변화 (양수 = 상승). new면 undefined. */
  delta?: number;
  kind: MoverKind;
};

export function computeMovers(today: Trend[], yesterday: Trend[]): Mover[] {
  const todayTop = today.slice(0, TOP_LIMIT);
  const yesterdayKeyset = new Map<string, number>();
  yesterday.slice(0, TOP_LIMIT).forEach((t, idx) => {
    yesterdayKeyset.set(normalize(t.keyword), idx);
  });

  const movers: Mover[] = [];
  for (let idx = 0; idx < todayTop.length; idx++) {
    const trend = todayTop[idx]!;
    const key = normalize(trend.keyword);
    const yRank = yesterdayKeyset.get(key);
    if (yRank === undefined) {
      movers.push({ trend, todayRank: idx, kind: 'new' });
      continue;
    }
    const delta = yRank - idx;
    if (delta >= RISING_THRESHOLD) {
      movers.push({
        trend,
        todayRank: idx,
        yesterdayRank: yRank,
        delta,
        kind: 'rising',
      });
    }
  }

  // 정렬: new는 todayRank 낮은 순, rising은 delta 큰 순으로 섞기
  movers.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'new' ? -1 : 1;
    if (a.kind === 'rising') return (b.delta ?? 0) - (a.delta ?? 0);
    return a.todayRank - b.todayRank;
  });
  return movers;
}

function normalize(s: string): string {
  return s.toLowerCase().trim();
}

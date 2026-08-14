// 키워드 인덱스 (ADR-0044) — 최근 KEYWORD_RETENTION_DAYS 일 스냅샷을 훑어
// "키워드 → 등장한 일자들" 을 만든다.
//
// 왜: /k 는 최신 스냅샷 키워드만 정적 생성해서, 어제 색인된 URL 이 오늘 빌드에서
// 사라졌다(라이브 404 확인). 보존 창 안의 키워드는 계속 페이지를 유지한다.

import { listSnapshotDates, loadByDate } from './data';
import type { DailySnapshot } from './types';

/** 키워드 페이지를 유지하는 창. /d 페이지·sitemap 의 90일 slice 와 같은 정책. */
export const KEYWORD_RETENTION_DAYS = 90;

export type KeywordEntry = {
  /** 표기 원형 — 가장 최근 등장일의 표기를 쓴다. */
  keyword: string;
  /** 등장한 스냅샷 일자, 최신 우선. dates[0] 가 마지막 등장일. */
  dates: string[];
};

/** buildKeywordIndex 가 필요로 하는 최소 형태 — 테스트에서 가볍게 만들 수 있게. */
export type KeywordSnapshot = {
  date: string;
  trends: Pick<DailySnapshot['trends'], 'kr' | 'global'>;
};

/**
 * 스냅샷들 → 키워드 인덱스. 키는 소문자(대소문자만 다른 변형이 별도 페이지가 되면
 * 대소문자 무시 파일시스템에서 충돌하므로), 값의 keyword 는 최근 표기를 유지한다.
 * 순수 함수 — 입력 순서에 의존하지 않도록 내부에서 일자 내림차순 정렬한다.
 */
export function buildKeywordIndex(
  snapshots: ReadonlyArray<KeywordSnapshot>,
): Map<string, KeywordEntry> {
  const index = new Map<string, KeywordEntry>();
  const ordered = [...snapshots].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  for (const snapshot of ordered) {
    const seenHere = new Set<string>();
    for (const trend of [...snapshot.trends.kr, ...snapshot.trends.global]) {
      const keyword = trend.keyword?.trim();
      if (!keyword) continue;
      const key = keyword.toLowerCase();
      // 같은 날 kr/global 양쪽에 있으면 일자가 중복 기록되지 않도록.
      if (seenHere.has(key)) continue;
      seenHere.add(key);

      const existing = index.get(key);
      if (existing) existing.dates.push(snapshot.date);
      // 최신 일자부터 도니 처음 만난 표기가 가장 최근 표기.
      else index.set(key, { keyword, dates: [snapshot.date] });
    }
  }
  return index;
}

// 빌드 워커당 1회만 83개 스냅샷을 읽도록 모듈 스코프 캐시 (~750ms · 33MB).
let cache: Map<string, KeywordEntry> | null = null;

export function loadKeywordIndex(): Map<string, KeywordEntry> {
  if (cache) return cache;
  const snapshots = listSnapshotDates()
    .slice(0, KEYWORD_RETENTION_DAYS)
    .map(loadByDate)
    .filter((s): s is DailySnapshot => s !== null);
  cache = buildKeywordIndex(snapshots);
  return cache;
}

/** 보존 창 안의 모든 키워드 (마지막 등장일 최신 우선). */
export function listKeywordEntries(): KeywordEntry[] {
  return [...loadKeywordIndex().values()].sort((a, b) =>
    a.dates[0] < b.dates[0] ? 1 : a.dates[0] > b.dates[0] ? -1 : 0,
  );
}

export function findKeywordEntry(keyword: string): KeywordEntry | undefined {
  return loadKeywordIndex().get(keyword.trim().toLowerCase());
}

/**
 * 키워드 페이지가 근거로 삼을 스냅샷 = 마지막 등장일. 최신 스냅샷에 없는 과거
 * 키워드도 그날의 트렌드·기사로 온전히 렌더된다.
 */
export function loadKeywordSnapshot(entry: KeywordEntry): DailySnapshot | null {
  return loadByDate(entry.dates[0]);
}

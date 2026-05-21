// 정적 빌드 시점에 data/*.json을 읽는 헬퍼들. node:fs 사용 — 서버 컴포넌트 전용.

import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { CATEGORY_IDS, type CategoryId } from './categories';
import type { Article, DailySnapshot, Trend } from './types';

const DATA_DIR = resolve(process.cwd(), 'data');

export function loadLatest(): DailySnapshot {
  const raw = readFileSync(resolve(DATA_DIR, 'latest.json'), 'utf8');
  return JSON.parse(raw) as DailySnapshot;
}

export function loadByDate(date: string): DailySnapshot | null {
  try {
    const raw = readFileSync(resolve(DATA_DIR, `${date}.json`), 'utf8');
    return JSON.parse(raw) as DailySnapshot;
  } catch {
    return null;
  }
}

/** data/ 안의 YYYY-MM-DD.json 파일 일자 목록 (최신 우선). */
export function listSnapshotDates(): string[] {
  try {
    return readdirSync(DATA_DIR)
      .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
      .map((f) => f.replace('.json', ''))
      .sort()
      .reverse();
  } catch {
    return [];
  }
}

export type SidebarData = {
  date: string;
  counts: Record<CategoryId, number>;
  trends: { global: Trend[]; kr: Trend[] };
};

export function toSidebarData(snapshot: DailySnapshot): SidebarData {
  const counts = Object.fromEntries(
    CATEGORY_IDS.map((id) => {
      const bucket = snapshot.categories.find((c) => c.id === id);
      return [id, bucket?.items.length ?? 0];
    }),
  ) as Record<CategoryId, number>;

  return {
    date: snapshot.date,
    counts,
    trends: snapshot.trends,
  };
}

export function getCategoryItems(snapshot: DailySnapshot, id: CategoryId): Article[] {
  return snapshot.categories.find((c) => c.id === id)?.items ?? [];
}

export function findArticlesByKeyword(snapshot: DailySnapshot, keyword: string): Article[] {
  const needle = keyword.toLowerCase().trim();
  if (!needle) return [];
  const seen = new Set<string>();
  const out: Article[] = [];
  for (const bucket of snapshot.categories) {
    for (const a of bucket.items) {
      if (seen.has(a.id)) continue;
      if (`${a.title} ${a.summary}`.toLowerCase().includes(needle)) {
        seen.add(a.id);
        out.push(a);
      }
    }
  }
  return out;
}

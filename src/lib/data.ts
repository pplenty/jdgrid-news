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

/** 주어진 snapshot의 어제 (가장 가까운 이전 일자) snapshot — 없으면 null. */
export function loadPrevious(currentDate: string): DailySnapshot | null {
  const dates = listSnapshotDates(); // 최신 우선
  const earlier = dates.find((d) => d < currentDate);
  return earlier ? loadByDate(earlier) : null;
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

export function findTrendByKeyword(snapshot: DailySnapshot, keyword: string): Trend | undefined {
  const needle = keyword.trim();
  return [...snapshot.trends.kr, ...snapshot.trends.global].find((t) => t.keyword === needle);
}

export type MediaCategoryRow = {
  name: string;
  total: number;
  counts: Partial<Record<CategoryId, number>>;
};

/** 매체별 카테고리 분포 — ADR-0023 §매체↔카테고리. */
export function computeMediaCategoryMatrix(snapshot: DailySnapshot): MediaCategoryRow[] {
  const matrix = new Map<string, Map<CategoryId, number>>();
  for (const bucket of snapshot.categories) {
    if (bucket.id === 'top') continue; // top은 다른 카테고리 집계라 중복
    for (const article of bucket.items) {
      const name = article.source.name;
      if (!matrix.has(name)) matrix.set(name, new Map());
      const counts = matrix.get(name)!;
      counts.set(bucket.id, (counts.get(bucket.id) ?? 0) + 1);
    }
  }
  return [...matrix.entries()]
    .map(([name, counts]) => {
      const total = [...counts.values()].reduce((s, n) => s + n, 0);
      return {
        name,
        total,
        counts: Object.fromEntries(counts.entries()) as Partial<Record<CategoryId, number>>,
      };
    })
    .sort((a, b) => b.total - a.total);
}

/** Wikipedia top에서 keyword와 정확 일치(대소문자 무시) 항목 찾기. ADR-0028. */
export function findWikiByKeyword(
  snapshot: DailySnapshot,
  keyword: string,
): { ko?: import('./types').WikiTrend; en?: import('./types').WikiTrend } {
  const needle = keyword.toLowerCase().trim();
  const ko = snapshot.trends.wikipedia?.ko.find((w) => w.title.toLowerCase() === needle);
  const en = snapshot.trends.wikipedia?.en.find((w) => w.title.toLowerCase() === needle);
  return { ko, en };
}

/** Article들의 매체별 카운트 (내림차순). ADR-0028. */
export function groupArticlesBySource(
  articles: ReadonlyArray<Article>,
): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const a of articles) {
    counts.set(a.source.name, (counts.get(a.source.name) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
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

// jdgrid-news scraper — M1 수집 파이프라인에서 본격 구현.
// 관련 ADR: 0004 (저장), 0005 (RSS+Trends), 0006 (cron), 0007 (5필드 정책), 0008 (카테고리).

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { CATEGORY_IDS, CATEGORY_LABELS } from '@/lib/categories';
import type { DailySnapshot } from '@/lib/types';

const DATA_DIR = resolve(process.cwd(), 'data');

function buildEmptySnapshot(): DailySnapshot {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  return {
    generatedAt: now.toISOString(),
    date,
    categories: CATEGORY_IDS.map((id) => ({
      id,
      label: CATEGORY_LABELS[id],
      items: [],
    })),
    trends: { global: [], kr: [] },
  };
}

function writeSnapshot(snapshot: DailySnapshot): void {
  const datedPath = resolve(DATA_DIR, `${snapshot.date}.json`);
  const latestPath = resolve(DATA_DIR, 'latest.json');
  const payload = `${JSON.stringify(snapshot, null, 2)}\n`;

  mkdirSync(dirname(datedPath), { recursive: true });
  writeFileSync(datedPath, payload, 'utf8');
  writeFileSync(latestPath, payload, 'utf8');
}

async function main(): Promise<void> {
  const snapshot = buildEmptySnapshot();
  // TODO M1: RSS fetch (ADR-0005) → 정규화 → dedupe → 분류 (ADR-0008) → trend 매칭.
  writeSnapshot(snapshot);
  console.log(`[scrape] wrote empty snapshot for ${snapshot.date}`);
}

main().catch((err) => {
  console.error('[scrape] failed', err);
  process.exit(1);
});

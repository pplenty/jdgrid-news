import { describe, expect, it } from 'vitest';

import { buildBriefing } from './briefing';
import type { CategoryId } from './categories';
import type { DailySnapshot, Trend } from './types';

const trend = (keyword: string): Trend => ({
  keyword,
  score: 1,
  source: 'derived',
  relatedUrls: [],
});

const cat = (id: CategoryId, n: number) => ({
  id,
  label: { ko: id, en: id },
  items: Array.from({ length: n }, (_, i) => ({ id: `${id}-${i}` })) as never,
});

function snap(over: {
  date: string;
  cats?: ReturnType<typeof cat>[];
  kr?: string[];
  global?: string[];
  ko?: { keyword: string; count: number }[];
  en?: { keyword: string; count: number }[];
}): DailySnapshot {
  return {
    generatedAt: `${over.date}T00:00:00Z`,
    date: over.date,
    categories: over.cats ?? [],
    trends: {
      kr: (over.kr ?? []).map(trend),
      global: (over.global ?? []).map(trend),
      derived: { ko: over.ko ?? [], en: over.en ?? [] },
    },
  } as DailySnapshot;
}

describe('buildBriefing', () => {
  it('separates risers (existed yesterday, rose) from new keywords (absent yesterday)', () => {
    const today = snap({
      date: '2026-06-04',
      ko: [
        { keyword: '선거', count: 50 }, // 어제 20 → 급상승(+30)
        { keyword: '투표', count: 10 }, // 어제 30 → 하락(제외)
        { keyword: '월드컵', count: 25 }, // 어제 없음 → 신규
      ],
    });
    const prev = snap({
      date: '2026-06-03',
      ko: [
        { keyword: '선거', count: 20 },
        { keyword: '투표', count: 30 },
      ],
    });
    const b = buildBriefing(today, prev);
    expect(b.risersKo.map((r) => r.keyword)).toEqual(['선거']);
    expect(b.risersKo[0]).toMatchObject({ delta: 30, count: 50 });
    expect(b.newKo.map((k) => k.keyword)).toEqual(['월드컵']);
    // 하락한 투표는 어디에도 없음
    expect(b.risersKo.map((r) => r.keyword)).not.toContain('투표');
    expect(b.newKo.map((k) => k.keyword)).not.toContain('투표');
  });

  it('computes total articles excluding the top bucket + most active category', () => {
    const b = buildBriefing(
      snap({
        date: '2026-06-04',
        cats: [cat('top', 8), cat('politics', 12), cat('world', 5), cat('tech', 3)],
      }),
      null,
    );
    expect(b.totalArticles).toBe(20); // 12+5+3, top 제외
    expect(b.topCategory).toMatchObject({ id: 'politics', count: 12 });
  });

  it('finds cross signals (keyword in both KR and global, case-insensitive, deduped)', () => {
    const b = buildBriefing(
      snap({
        date: '2026-06-04',
        kr: ['AI', '이재명', 'Trump'],
        global: ['ai', 'trump', 'iran'],
      }),
      null,
    );
    expect(b.crossSignals).toEqual(['ai', 'trump']);
  });

  it('skips delta-based fields when there is no previous snapshot', () => {
    const b = buildBriefing(
      snap({ date: '2026-06-04', ko: [{ keyword: '선거', count: 9 }], kr: ['선거'] }),
      null,
    );
    expect(b.hasPrev).toBe(false);
    expect(b.risersKo).toEqual([]);
    expect(b.newKo).toEqual([]);
    expect(b.topKr).toEqual(['선거']); // delta 무관 필드는 정상
  });

  it('caps top trends at 5 and is deterministic on ties', () => {
    const b = buildBriefing(
      snap({ date: '2026-06-04', global: ['a', 'b', 'c', 'd', 'e', 'f', 'g'] }),
      null,
    );
    expect(b.topGlobal).toEqual(['a', 'b', 'c', 'd', 'e']);
  });
});

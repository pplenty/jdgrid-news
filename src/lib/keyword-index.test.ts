// buildKeywordIndex 단위 테스트 (ADR-0044).

import { describe, expect, it } from 'vitest';

import { buildKeywordIndex, type KeywordSnapshot } from './keyword-index';
import type { Trend } from './types';

function trend(keyword: string, traffic?: string): Trend {
  return { keyword, score: 0.5, source: 'google', traffic, relatedUrls: [] };
}

function snap(date: string, kr: string[], global: string[] = []): KeywordSnapshot {
  return { date, trends: { kr: kr.map((k) => trend(k)), global: global.map((k) => trend(k)) } };
}

describe('buildKeywordIndex', () => {
  it('collects every keyword with the dates it appeared on, newest first', () => {
    const index = buildKeywordIndex([
      snap('2026-08-10', ['미국', '결혼식']),
      snap('2026-08-12', ['미국']),
      snap('2026-08-11', ['반도체']),
    ]);
    expect(index.get('미국')?.dates).toEqual(['2026-08-12', '2026-08-10']);
    expect(index.get('결혼식')?.dates).toEqual(['2026-08-10']);
    expect(index.get('반도체')?.dates).toEqual(['2026-08-11']);
  });

  it('does not depend on input order', () => {
    const snapshots = [snap('2026-08-01', ['a']), snap('2026-08-03', ['a']), snap('2026-08-02', ['a'])];
    const forward = buildKeywordIndex(snapshots);
    const reversed = buildKeywordIndex([...snapshots].reverse());
    expect(forward.get('a')?.dates).toEqual(['2026-08-03', '2026-08-02', '2026-08-01']);
    expect(reversed.get('a')?.dates).toEqual(forward.get('a')?.dates);
  });

  it('records a date once when the keyword is in both kr and global', () => {
    const index = buildKeywordIndex([snap('2026-08-12', ['trump'], ['trump'])]);
    expect(index.get('trump')?.dates).toEqual(['2026-08-12']);
  });

  it('merges case variants under one entry, keeping the most recent spelling', () => {
    // 대소문자만 다른 변형이 별도 페이지가 되면 대소문자 무시 파일시스템에서 충돌한다.
    const index = buildKeywordIndex([snap('2026-08-05', ['trump']), snap('2026-08-12', ['Trump'])]);
    expect(index.size).toBe(1);
    expect(index.get('trump')).toEqual({ keyword: 'Trump', dates: ['2026-08-12', '2026-08-05'] });
  });

  it('trims whitespace and skips empty keywords', () => {
    const index = buildKeywordIndex([snap('2026-08-12', ['  여행  ', '', '   '])]);
    expect([...index.keys()]).toEqual(['여행']);
    expect(index.get('여행')?.keyword).toBe('여행');
  });

  it('returns an empty index for no snapshots', () => {
    expect(buildKeywordIndex([]).size).toBe(0);
  });
});

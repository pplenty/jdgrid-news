// 날짜 표기 단위 테스트 — 실행 환경 시간대(Cloudflare 빌드 = UTC)와 무관하게 KST 일자여야 한다.

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { formatDateLabel, relativeTime } from './utils';

describe.each(['UTC', 'America/Los_Angeles', 'Asia/Seoul'])('date labels under TZ=%s', (tz) => {
  const original = process.env.TZ;
  beforeAll(() => {
    process.env.TZ = tz;
  });
  afterAll(() => {
    process.env.TZ = original;
  });

  it('formatDateLabel keeps the KST calendar day', () => {
    expect(formatDateLabel('2026-10-20')).toBe('2026년 10월 20일 화');
  });

  it('relativeTime falls back to the KST day for old timestamps', () => {
    // KST 10월 12일 오전 1시 = UTC 10월 11일 16시
    expect(relativeTime('2026-10-11T16:00:00Z', new Date('2026-10-22T00:00:00Z'))).toBe(
      '10월 12일',
    );
  });
});

describe('formatDateLabel', () => {
  it('returns the input untouched when it is not a date', () => {
    expect(formatDateLabel('not-a-date')).toBe('not-a-date');
  });
});

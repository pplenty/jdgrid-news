import { afterEach, describe, expect, it, vi } from 'vitest';

import { formatDateKst, kstDateParts, kstDateString } from './date';

describe('formatDateKst', () => {
  it('formats a UTC instant as the KST calendar date', () => {
    // UTC 00:00 → KST 09:00 같은 날
    expect(formatDateKst(new Date('2026-05-28T00:00:00Z'))).toBe('2026-05-28');
  });

  it('rolls over to the next day when UTC evening crosses KST midnight', () => {
    // UTC 20:00 → KST 05:00 다음 날
    expect(formatDateKst(new Date('2026-05-27T20:00:00Z'))).toBe('2026-05-28');
  });
});

describe('kstDateString / kstDateParts', () => {
  afterEach(() => vi.useRealTimers());

  it('returns today and N days ago in KST', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-28T03:00:00Z')); // KST 12:00, 5-28
    expect(kstDateString(0)).toBe('2026-05-28');
    expect(kstDateString(1)).toBe('2026-05-27');
    expect(kstDateString(7)).toBe('2026-05-21');
  });

  it('crosses month boundary correctly', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-01T03:00:00Z')); // KST 12:00, 6-01
    expect(kstDateString(1)).toBe('2026-05-31');
  });

  it('returns zero-padded year/month/day parts', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-05T03:00:00Z')); // KST 12:00, 1-05
    expect(kstDateParts(0)).toEqual({ year: '2026', month: '01', day: '05' });
  });
});

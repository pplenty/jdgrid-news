import { describe, expect, it } from 'vitest';

import { ogTitle, ogTitleFontSize } from './og-text';

describe('ogTitle', () => {
  it('짧은 타이틀은 그대로', () => {
    expect(ogTitle('미국')).toBe('미국');
    expect(ogTitle('  나스닥 100  ')).toBe('나스닥 100');
  });

  it('48자 초과는 말줄임', () => {
    const long = 'a'.repeat(60);
    const out = ogTitle(long);
    expect(out.length).toBe(48);
    expect(out.endsWith('…')).toBe(true);
  });
});

describe('ogTitleFontSize', () => {
  it('짧을수록 크게, 길수록 단계적 축소', () => {
    expect(ogTitleFontSize('미국')).toBe(96);
    expect(ogTitleFontSize('president trump')).toBe(76);
    expect(ogTitleFontSize('president trump plane security')).toBe(60);
    expect(ogTitleFontSize('x'.repeat(40))).toBe(48);
  });
});

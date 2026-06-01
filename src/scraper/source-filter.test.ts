import { describe, expect, it } from 'vitest';

import { extractCategoryTerms, isCommercePost } from './source-filter';

describe('extractCategoryTerms', () => {
  it('normalizes Atom term objects to lowercase strings', () => {
    const cats = [
      { $: { scheme: 'https://www.theverge.com', term: 'Deals' } },
      { $: { term: 'Verge Shopping' } },
    ];
    expect(extractCategoryTerms(cats)).toEqual(['deals', 'verge shopping']);
  });

  it('handles plain-string categories (RSS)', () => {
    expect(extractCategoryTerms(['Tech', 'AI'])).toEqual(['tech', 'ai']);
  });

  it('skips null/empty and falls back to _ text node', () => {
    expect(extractCategoryTerms([null, undefined, { _: 'Gaming' }, { $: {} }])).toEqual(['gaming']);
  });

  it('returns [] for undefined', () => {
    expect(extractCategoryTerms(undefined)).toEqual([]);
  });
});

describe('isCommercePost', () => {
  it('flags posts tagged with a commerce RSS category', () => {
    expect(
      isCommercePost({
        title: 'An affordable, long-lasting AirTag alternative is $15 right now',
        summary: '',
        categories: [{ $: { term: 'Deals' } }, { $: { term: 'Gadgets' } }],
      }),
    ).toBe(true);
    // Verge Shopping 단독으로도 포착
    expect(
      isCommercePost({ title: 'Some gadget roundup', categories: [{ $: { term: 'Verge Shopping' } }] }),
    ).toBe(true);
  });

  it('flags high-precision deal/sale/guide title patterns without a category', () => {
    for (const title of [
      "Sony's DualSense controllers are almost 30 percent off",
      "Amazon's last-gen Paperwhite is on sale for less than the entry-level Kindle",
      'Motorola’s last-gen Razr Ultra is almost half off',
      "The Verge’s 2026 high school graduation gift guide",
      'The best Prime Day deals you can shop right now',
    ]) {
      expect(isCommercePost({ title })).toBe(true);
    }
  });

  it('does NOT flag legit tech news (categories News/Gaming/AI)', () => {
    for (const a of [
      { title: 'Anthropic has officially filed to go public', categories: [{ $: { term: 'AI' } }, { $: { term: 'News' } }] },
      { title: 'Apple’s strategy for smart glasses is the same as smart watches', categories: [{ $: { term: 'Tech' } }] },
      { title: 'Sony’s new fight stick and gaming monitor launch in August', categories: [{ $: { term: 'Gaming' } }, { $: { term: 'News' } }] },
      { title: 'Sundar Pichai on AI, the future of search, and what’s happening to the web', categories: [{ $: { term: 'AI' } }] },
    ]) {
      expect(isCommercePost(a)).toBe(false);
    }
  });

  it('does NOT flag reviews / comparisons (정상 테크 콘텐츠)', () => {
    // 'review'·'vs' 는 타깃 아님 — 딜/세일/가이드만.
    expect(isCommercePost({ title: 'The Oura Ring 5 review: a worthy upgrade' })).toBe(false);
    expect(isCommercePost({ title: 'iPhone vs Pixel: which camera wins' })).toBe(false);
    // 단독 'deal'(trade deal 류)은 텍스트 패턴 미포착 — category 'Deals' 에 위임
    expect(isCommercePost({ title: 'US and EU reach a landmark trade deal on chips' })).toBe(false);
  });
});

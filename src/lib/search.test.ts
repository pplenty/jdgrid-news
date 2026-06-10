import { describe, expect, it } from 'vitest';

import { CATEGORY_IDS } from './categories';
import { buildSearchIndex, searchDocs, type SearchDoc } from './search';
import type { Article, DailySnapshot } from './types';

function article(over: Partial<Article> & { id: string; title: string }): Article {
  return {
    summary: '',
    url: `https://ex.com/${over.id}`,
    source: { name: 'BBC', url: 'https://bbc.com' },
    publishedAt: '2026-06-10T00:00:00Z',
    lang: 'ko',
    category: 'world',
    ...over,
  };
}

function snapshot(): DailySnapshot {
  return {
    generatedAt: '2026-06-10T00:00:00Z',
    date: '2026-06-10',
    categories: [
      {
        id: 'top',
        label: { ko: '종합', en: 'Top' },
        // top 은 타 카테고리 재집계 → 같은 id 가 다시 등장(중복 제거 검증)
        items: [article({ id: 'a1', title: '대선 결과 발표' })],
      },
      {
        id: 'politics',
        label: { ko: '정치', en: 'Politics' },
        items: [
          article({ id: 'a1', title: '대선 결과 발표', category: 'politics' }),
          article({ id: 'a2', title: 'Senate passes new bill', lang: 'en', category: 'politics' }),
        ],
      },
    ],
    trends: {
      kr: [{ keyword: '대선', score: 0.9, source: 'google', traffic: '200K+', relatedUrls: [] }],
      global: [
        { keyword: 'election', score: 0.8, source: 'google', relatedUrls: [] },
        // kr 과 대소문자만 다른 중복 → 1개로 합쳐져야
        { keyword: '대선', score: 0.5, source: 'derived', relatedUrls: [] },
      ],
    },
  };
}

describe('buildSearchIndex', () => {
  it('includes one doc per category (/c) plus deduped keywords and articles', () => {
    const idx = buildSearchIndex(snapshot());
    const cats = idx.filter((d) => d.type === 'category');
    const kws = idx.filter((d) => d.type === 'keyword');
    const arts = idx.filter((d) => d.type === 'article');

    expect(cats).toHaveLength(CATEGORY_IDS.length);
    // 대선(kr) + 대선(global, 중복) + election → 2개
    expect(kws.map((d) => d.title).sort()).toEqual(['election', '대선']);
    // a1 이 top·politics 두 버킷에 있지만 id 중복 제거 → a1,a2
    expect(arts.map((d) => d.url).sort()).toEqual(['https://ex.com/a1', 'https://ex.com/a2']);
  });

  it('keyword links go to /k, categories to /c, articles keep external url', () => {
    const idx = buildSearchIndex(snapshot());
    expect(idx.find((d) => d.title === '대선')!.url).toBe('/k/%EB%8C%80%EC%84%A0/');
    expect(idx.find((d) => d.type === 'category' && d.title === '정치')!.url).toBe('/c/politics/');
    const art = idx.find((d) => d.type === 'article')!;
    expect(art.external).toBe(true);
    expect(art.url.startsWith('https://')).toBe(true);
  });
});

describe('searchDocs', () => {
  const idx = buildSearchIndex(snapshot());

  it('returns nothing for an empty query', () => {
    expect(searchDocs(idx, '')).toEqual([]);
    expect(searchDocs(idx, '   ')).toEqual([]);
  });

  it('ranks exact keyword match above an article that merely contains it', () => {
    const r = searchDocs(idx, '대선');
    expect(r[0].type).toBe('keyword');
    expect(r[0].title).toBe('대선');
    // 기사 "대선 결과 발표" 도 매칭되지만 키워드보다 아래
    expect(r.some((d) => d.type === 'article' && d.title.includes('대선'))).toBe(true);
  });

  it('is case-insensitive and matches prefixes', () => {
    const r = searchDocs(idx, 'ELEC');
    expect(r[0].title).toBe('election');
  });

  it('requires all tokens to match for multi-word queries', () => {
    expect(searchDocs(idx, 'senate bill').some((d) => d.title === 'Senate passes new bill')).toBe(
      true,
    );
    expect(searchDocs(idx, 'senate nonsense')).toEqual([]);
  });

  it('respects the limit', () => {
    const many: SearchDoc[] = Array.from({ length: 100 }, (_, i) => ({
      type: 'article',
      title: `news item ${i}`,
      url: `https://ex.com/${i}`,
    }));
    expect(searchDocs(many, 'news', 10)).toHaveLength(10);
  });
});

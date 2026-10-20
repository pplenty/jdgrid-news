import { describe, expect, it } from 'vitest';

import { CATEGORY_IDS } from './categories';
import { buildKeywordIndex } from './keyword-index';
import { buildSearchIndex, resultDateLabel, searchDocs, type SearchDoc } from './search';
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

/** 실제 빌드와 같은 경로 — 키워드는 키워드 인덱스(ADR-0044)를 거쳐 들어온다. */
function indexFrom(...snapshots: DailySnapshot[]): SearchDoc[] {
  return buildSearchIndex({
    keywords: [...buildKeywordIndex(snapshots).values()],
    articleSnapshots: snapshots,
  });
}

function dayWith(date: string, keyword: string, articles: Article[]): DailySnapshot {
  return {
    generatedAt: `${date}T00:00:00Z`,
    date,
    categories: [{ id: 'world', label: { ko: '국제', en: 'World' }, items: articles }],
    trends: { kr: [{ keyword, score: 0.5, source: 'google', relatedUrls: [] }], global: [] },
  };
}

describe('buildSearchIndex', () => {
  it('includes one doc per category (/c) plus deduped keywords and articles', () => {
    const idx = indexFrom(snapshot());
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
    const idx = indexFrom(snapshot());
    expect(idx.find((d) => d.title === '대선')!.url).toBe('/k/%EB%8C%80%EC%84%A0/');
    expect(idx.find((d) => d.type === 'category' && d.title === '정치')!.url).toBe('/c/politics/');
    const art = idx.find((d) => d.type === 'article')!;
    expect(art.external).toBe(true);
    expect(art.url.startsWith('https://')).toBe(true);
  });

  it("keyword docs carry the last-seen date and that day's traffic", () => {
    const idx = indexFrom(snapshot());
    expect(idx.find((d) => d.title === '대선')).toMatchObject({
      subtitle: '200K+',
      date: '2026-06-10',
    });
    expect(idx.find((d) => d.type === 'category')!.date).toBeUndefined();
  });

  it('spans days: past keywords stay, a re-collected article keeps its newest date', () => {
    const repeat = article({ id: 'r1', title: '반복 수집 기사' });
    // 입력 순서 무관 — 오래된 날을 먼저 넘겨도 최신 수집일이 남아야
    const idx = indexFrom(
      dayWith('2026-06-08', '태풍', [repeat, article({ id: 'o1', title: '지난 기사' })]),
      dayWith('2026-06-10', '대선', [repeat]),
    );
    expect(idx.filter((d) => d.type === 'keyword').map((d) => [d.title, d.date])).toEqual([
      ['대선', '2026-06-10'],
      ['태풍', '2026-06-08'],
    ]);
    const arts = idx.filter((d) => d.type === 'article');
    expect(arts.map((d) => [d.title, d.date])).toEqual([
      ['반복 수집 기사', '2026-06-10'],
      ['지난 기사', '2026-06-08'],
    ]);
  });
});

describe('searchDocs', () => {
  const idx = indexFrom(snapshot());

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

  it('ranks a recent doc above an older one when the match is comparable', () => {
    const docs: SearchDoc[] = [
      // 짧은 제목 보너스로 오래된 쪽이 2점 앞서지만, 오늘 가산(6)이 뒤집는다
      { type: 'keyword', title: '갤럭시', url: '/k/old/', date: '2026-07-22' },
      {
        type: 'keyword',
        title: '갤럭시 워치 울트라 출시일 공개',
        url: '/k/new/',
        date: '2026-10-19',
      },
    ];
    expect(searchDocs(docs, '갤럭', 60, '2026-10-19').map((d) => d.url)).toEqual([
      '/k/new/',
      '/k/old/',
    ]);
    // 기준일이 없으면 가산 없음 — 기존 점수 그대로
    expect(searchDocs(docs, '갤럭').map((d) => d.url)).toEqual(['/k/old/', '/k/new/']);
  });

  it('does not let recency outrank a better match tier', () => {
    const docs: SearchDoc[] = [
      { type: 'keyword', title: '갤럭시 워치', url: '/k/new/', date: '2026-10-19' },
      { type: 'keyword', title: '갤럭시', url: '/k/old/', date: '2026-07-22' },
    ];
    // exact(100) vs prefix(60) — 89일 묵은 정확 매칭이 오늘의 prefix 매칭보다 위
    expect(searchDocs(docs, '갤럭시', 60, '2026-10-19')[0].url).toBe('/k/old/');
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

describe('resultDateLabel', () => {
  it("says '오늘' for the index date and 'M월 D일' otherwise", () => {
    expect(resultDateLabel('2026-10-19', '2026-10-19')).toBe('오늘');
    expect(resultDateLabel('2026-08-05', '2026-10-19')).toBe('8월 5일');
  });
});

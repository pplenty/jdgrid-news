// toSidebarData 페이로드 회귀 테스트.
// 이 반환값은 client component 경계를 넘어 **모든 페이지**의 RSC 페이로드에 직렬화된다.
// snapshot.trends 를 통째로 넘기던 시절 페이지당 226KB 가 붙었고, 화면상으론 티가 나지
// 않아 아무도 눈치채지 못했다 → 크기·모양을 테스트로 고정한다.

import { describe, expect, it } from 'vitest';

import { SIDEBAR_TREND_LIMIT, toSidebarData } from './data';
import type { DailySnapshot, Trend } from './types';

function trend(keyword: string, extra: Partial<Trend> = {}): Trend {
  return {
    keyword,
    score: 0.5,
    source: 'google',
    traffic: '20K+',
    relatedUrls: [],
    ...extra,
  };
}

function snapshot(overrides: Partial<DailySnapshot['trends']> = {}): DailySnapshot {
  return {
    date: '2026-08-14',
    categories: [
      {
        id: 'top',
        items: [
          { id: 'a1' } as DailySnapshot['categories'][number]['items'][number],
          { id: 'a2' } as DailySnapshot['categories'][number]['items'][number],
        ],
      } as DailySnapshot['categories'][number],
    ],
    trends: {
      kr: [],
      global: [],
      ...overrides,
    } as DailySnapshot['trends'],
  } as DailySnapshot;
}

describe('toSidebarData', () => {
  it('keeps date and per-category counts', () => {
    const data = toSidebarData(snapshot());
    expect(data.date).toBe('2026-08-14');
    expect(data.counts.top).toBe(2);
    expect(data.counts.business).toBe(0);
  });

  it('keeps only keyword and traffic on each trend', () => {
    const data = toSidebarData(
      snapshot({
        kr: [
          trend('결혼식', {
            picture: 'https://cdn.example/pic.jpg',
            description: '관련 검색어 …',
            googleArticles: [
              { title: 'a', url: 'https://example.com', source: 'X' },
            ] as Trend['googleArticles'],
            relatedUrls: ['https://example.com/1'],
          }),
        ],
      }),
    );
    expect(data.trends.kr[0]).toEqual({ keyword: '결혼식', traffic: '20K+' });
  });

  it('omits traffic when the trend has none', () => {
    const data = toSidebarData(snapshot({ kr: [trend('반도체', { traffic: undefined })] }));
    expect(data.trends.kr[0]).toEqual({ keyword: '반도체' });
  });

  it(`caps each region at ${SIDEBAR_TREND_LIMIT} trends`, () => {
    const many = Array.from({ length: 40 }, (_, i) => trend(`kw${i}`));
    const data = toSidebarData(snapshot({ kr: many, global: many }));
    expect(data.trends.kr).toHaveLength(SIDEBAR_TREND_LIMIT);
    expect(data.trends.global).toHaveLength(SIDEBAR_TREND_LIMIT);
  });

  it('drops the non-sidebar trend buckets entirely (wikipedia/stories/naver/…)', () => {
    const data = toSidebarData(
      snapshot({
        kr: [trend('미국')],
        wikipedia: { ko: [{ title: '미국', views: 1, url: 'u' }], en: [] },
        stories: [{ title: 's' }],
        naver: { categories: [] },
      } as unknown as Partial<DailySnapshot['trends']>),
    );
    expect(Object.keys(data.trends).sort()).toEqual(['global', 'kr']);
    // 직렬화 크기가 KB 단위로 튀면 페이로드 회귀 — 사이드바 데이터는 1KB 를 넘을 이유가 없다.
    expect(JSON.stringify(data).length).toBeLessThan(1024);
  });
});

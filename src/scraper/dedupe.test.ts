import { describe, expect, it } from 'vitest';

import { idFromUrl } from '@/lib/normalize';
import type { Article } from '@/lib/types';

import { dedupeArticles } from './dedupe';

function mkArticle(title: string, url: string): Article {
  return {
    id: idFromUrl(url),
    title,
    summary: '',
    url,
    source: { name: 'src', url: 'https://src' },
    publishedAt: '2026-05-28T00:00:00Z',
    lang: 'ko',
    category: 'top',
  };
}

describe('dedupeArticles', () => {
  it('drops exact-duplicate ids (same normalized url)', () => {
    const out = dedupeArticles([
      mkArticle('삼성전자 1분기 영업이익 발표', 'https://a.com/news/1'),
      mkArticle('다른 제목 완전히 무관한 내용', 'https://a.com/news/1?utm_source=x'),
    ]);
    expect(out).toHaveLength(1);
  });

  it('collapses near-identical titles via Jaccard >= 0.8', () => {
    const out = dedupeArticles([
      mkArticle('삼성전자 1분기 영업이익 사상 최대 기록 발표', 'https://a.com/1'),
      mkArticle('삼성전자 1분기 영업이익 사상 최대 기록 발표', 'https://b.com/2'),
    ]);
    expect(out).toHaveLength(1);
  });

  it('keeps clearly different titles', () => {
    const out = dedupeArticles([
      mkArticle('삼성전자 영업이익 발표', 'https://a.com/1'),
      mkArticle('국내 프로야구 개막전 결과', 'https://b.com/2'),
    ]);
    expect(out).toHaveLength(2);
  });

  it('uses exact-match (not fuzzy) for short titles', () => {
    const out = dedupeArticles([
      mkArticle('속보 발표', 'https://a.com/1'),
      mkArticle('속보 발표', 'https://b.com/2'),
    ]);
    expect(out).toHaveLength(1);
  });
});

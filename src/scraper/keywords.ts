// 키워드 추출 + 매칭 — ADR-0014.
// - 자체 추출: 단순 빈도 + 한국어 조사 stripping + 불용어
// - 매칭: 정확 부분문자열 (대소문자 무시)

import { KO_PARTICLES } from '@/lib/particles';
import { EN_STOPWORDS, KO_STOPWORDS } from '@/lib/stopwords';

const KO_MIN_LEN = 2;
const EN_MIN_LEN = 3;
const PARTICLE_PROTECT_MARGIN = 2; // 토큰 길이 > particle.length + 2 일 때만 stripping

export function stripKoreanParticles(word: string): string {
  for (const p of KO_PARTICLES) {
    if (word.endsWith(p) && word.length > p.length + PARTICLE_PROTECT_MARGIN) {
      return word.slice(0, -p.length);
    }
  }
  return word;
}

/** 날짜·시간 단위 패턴 (예: "22일", "5월", "오후", "12시") — 헤드라인에 자주 등장하는 메타 토큰. */
const KO_DATE_PATTERN = /^\d+[일월시분초년주]$/;

export function tokenize(text: string, lang: 'ko' | 'en'): string[] {
  // 유니코드 letter·digit·공백·#만 남기고 나머지는 공백 치환.
  const cleaned = text.replace(/[^\p{L}\p{N}\s#]/gu, ' ');
  const words = cleaned.split(/\s+/).filter(Boolean);

  if (lang === 'ko') {
    return words
      .map(stripKoreanParticles)
      .filter((w) => w.length >= KO_MIN_LEN)
      .filter((w) => !KO_DATE_PATTERN.test(w))
      .filter((w) => !KO_STOPWORDS.has(w));
  }

  return words
    .map((w) => w.toLowerCase())
    .filter((w) => w.length >= EN_MIN_LEN)
    .filter((w) => /^[a-z][a-z0-9]*$/.test(w))
    .filter((w) => !EN_STOPWORDS.has(w));
}

export type DerivedKeyword = { keyword: string; count: number };

export function extractDerivedKeywords(
  articles: ReadonlyArray<{ title: string; summary: string; lang: 'ko' | 'en' }>,
  topN: number,
): DerivedKeyword[] {
  const counts = new Map<string, number>();
  for (const a of articles) {
    const tokens = tokenize(`${a.title} ${a.summary}`, a.lang);
    for (const t of tokens) {
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .filter(([, n]) => n >= 2) // 1회 등장은 노이즈로 간주
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([keyword, count]) => ({ keyword, count }));
}

/** 정확 부분문자열 매칭 (대소문자 무시). 매치된 기사의 url 반환. */
export function matchArticles<T extends { title: string; summary: string; url: string }>(
  keyword: string,
  articles: ReadonlyArray<T>,
): string[] {
  const needle = keyword.toLowerCase().trim();
  if (!needle) return [];
  const urls: string[] = [];
  const seen = new Set<string>();
  for (const a of articles) {
    const haystack = `${a.title} ${a.summary}`.toLowerCase();
    if (haystack.includes(needle) && !seen.has(a.url)) {
      seen.add(a.url);
      urls.push(a.url);
    }
  }
  return urls;
}

// 키워드 추출 + 매칭 — ADR-0014.
// - 자체 추출: 단순 빈도 + 한국어 조사 stripping + 불용어
// - 매칭: 정확 부분문자열 (대소문자 무시)

import { KO_PARTICLES } from '@/lib/particles';
import { EN_STOPWORDS, KO_STOPWORDS } from '@/lib/stopwords';

const KO_MIN_LEN = 2;
const EN_MIN_LEN = 3;
// margin=2는 "후보는" 3글자가 1글자 particle '는' (length 1+2=3 → 3>3 false) 으로 strip 안 됐던
// 보수적 룰. margin=1 로 완화 — 1글자 particle 은 2글자 이상 토큰에 적용, 2글자 particle 은
// 3글자 이상 토큰에 적용. KO_MIN_LEN=2 가 잔여물(1글자) 보호.
const PARTICLE_PROTECT_MARGIN = 1;

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

/** garu 명사 추출 결과에 기존 ko 노이즈 필터(최소 길이·날짜 토큰·불용어) 적용. */
function refineKoTokens(tokens: string[]): string[] {
  return tokens.filter(
    (w) => w.length >= KO_MIN_LEN && !KO_DATE_PATTERN.test(w) && !KO_STOPWORDS.has(w),
  );
}

/**
 * 형태소 분석기(garu-ko)의 nouns 를 ko 토크나이저로 래핑 — extractDerivedKeywords 의
 * koTokenizer 인자로 주입(ADR-0035). includeSL: 외국어 명사(AI·IT 등)도 포함.
 * 미주입 시 extractDerivedKeywords 는 v0 tokenize(조사 stripping)로 fallback.
 */
export function garuKoTokenizer(
  nouns: (text: string, options?: { includeSL?: boolean }) => string[],
): (text: string) => string[] {
  return (text) => refineKoTokens(nouns(text, { includeSL: true }));
}

export function extractDerivedKeywords(
  articles: ReadonlyArray<{ title: string; summary: string; lang: 'ko' | 'en' }>,
  topN: number,
  koTokenizer?: (text: string) => string[],
): DerivedKeyword[] {
  const counts = new Map<string, number>();
  for (const a of articles) {
    const text = `${a.title} ${a.summary}`;
    const tokens = a.lang === 'ko' && koTokenizer ? koTokenizer(text) : tokenize(text, a.lang);
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

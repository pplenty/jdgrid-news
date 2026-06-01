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

export type Tokenizer = (text: string) => string[];

/** garu 명사 추출 결과에 기존 ko 노이즈 필터(최소 길이·날짜 토큰·불용어) 적용. */
function refineKoTokens(tokens: string[]): string[] {
  return tokens.filter(
    (w) => w.length >= KO_MIN_LEN && !KO_DATE_PATTERN.test(w) && !KO_STOPWORDS.has(w),
  );
}

/** compromise 명사 토큰에 기존 en 필터(최소 길이·영문자 패턴·불용어) 적용. */
function refineEnTokens(tokens: string[]): string[] {
  return tokens.filter(
    (w) => w.length >= EN_MIN_LEN && /^[a-z][a-z0-9]*$/.test(w) && !EN_STOPWORDS.has(w),
  );
}

/** garu analyze() 형태소 토큰: surface(text) + 품사(pos) + source 문자 오프셋(start,end). */
export type GaruToken = { text: string; pos: string; start: number; end: number };

/** 복합명사 병합 대상 품사 — NNG 일반명사·NNP 고유명사·SL 외국어(AI·IT). nouns()+includeSL 와 동일 집합. */
const KO_NOUN_POS = new Set(['NNG', 'NNP', 'SL']);

/**
 * 형태소 분석기(garu-ko)의 analyze() 를 복합명사 병합 ko 토크나이저로 래핑 (ADR-0037).
 * garu 는 복합명사를 sub-명사로 분리하지만(프로야구→프로+야구) 분리된 형태소가 같은
 * source span(start,end)을 공유한다 → 같은 span 의 명사 형태소를 surface 순서로 이어붙여
 * 복합명사를 복원. 조사·어미·접사는 명사 POS 가 아니므로 자연 제외(삼성전자가→삼성전자,
 * 발표했다→발표). span 이 다르면(별도 어절) 병합 안 함. 미주입 시 v0 tokenize 로 fallback.
 * ADR-0035 의 nouns() 분리 방식을 발전 — 빈도 분산(프로+야구) 해소.
 */
export function garuCompoundKoTokenizer(
  analyze: (text: string) => { tokens: GaruToken[] },
): Tokenizer {
  return (text) => {
    const tokens = analyze(text).tokens ?? [];
    const merged: string[] = [];
    let i = 0;
    while (i < tokens.length) {
      const { start, end } = tokens[i];
      let j = i;
      let buf = '';
      // 같은 source span 을 공유하는 형태소 묶음 = 한 어절. 그 중 명사 POS 만 이어붙임.
      while (j < tokens.length && tokens[j].start === start && tokens[j].end === end) {
        if (KO_NOUN_POS.has(tokens[j].pos)) buf += tokens[j].text;
        j++;
      }
      if (buf) merged.push(buf);
      i = j;
    }
    return refineKoTokens(merged);
  };
}

/**
 * compromise 의 #Noun 태그 토큰을 en 토크나이저로 래핑 — tokenizers.en 인자로 주입(ADR-0036).
 * `.nouns().out('array')` 는 명사구를 묶어 반환(빈도 매칭 부적합)하므로
 * `.terms().json()` 에서 #Noun 태그된 개별 단어만 추출. 미주입 시 v0 fallback.
 */
export function compromiseEnTokenizer(
  nlpFn: (text: string) => { terms(): { json(): unknown[] } },
): Tokenizer {
  return (text) => {
    const terms = nlpFn(text).terms().json() as Array<{
      text?: string;
      terms?: Array<{ text: string; tags?: string[] }>;
      tags?: string[];
    }>;
    const out: string[] = [];
    for (const t of terms) {
      const list = t.terms ?? [{ text: t.text ?? '', tags: t.tags }];
      for (const w of list) {
        if (w.tags?.includes('Noun')) out.push(w.text.toLowerCase());
      }
    }
    return refineEnTokens(out);
  };
}

export function extractDerivedKeywords(
  articles: ReadonlyArray<{ title: string; summary: string; lang: 'ko' | 'en' }>,
  topN: number,
  tokenizers?: { ko?: Tokenizer; en?: Tokenizer },
): DerivedKeyword[] {
  const counts = new Map<string, number>();
  for (const a of articles) {
    const text = `${a.title} ${a.summary}`;
    const tk = tokenizers?.[a.lang];
    const tokens = tk ? tk(text) : tokenize(text, a.lang);
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

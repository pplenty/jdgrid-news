import { describe, expect, it } from 'vitest';

import {
  compromiseEnTokenizer,
  extractDerivedKeywords,
  garuKoTokenizer,
  matchArticles,
  stripKoreanParticles,
  tokenize,
} from './keywords';

describe('stripKoreanParticles', () => {
  it('strips 1-char particles from 3+ char tokens', () => {
    expect(stripKoreanParticles('후보가')).toBe('후보');
    expect(stripKoreanParticles('후보는')).toBe('후보');
  });

  it('strips the 들 plural suffix', () => {
    expect(stripKoreanParticles('후보들')).toBe('후보');
  });

  it('strips multi-char particles (longest-first sort prevents partial cut)', () => {
    expect(stripKoreanParticles('서울에서')).toBe('서울');
  });

  it('preserves 2-char words whose tail looks like a particle (margin guard)', () => {
    // "국가" 의 '가' 를 strip 하면 1글자만 남음 → margin=1 이 보호
    expect(stripKoreanParticles('국가')).toBe('국가');
  });

  it('leaves tokens without a trailing particle untouched', () => {
    expect(stripKoreanParticles('삼성전자')).toBe('삼성전자');
  });
});

describe('tokenize', () => {
  it('strips particles and drops Korean stopwords', () => {
    const tokens = tokenize('삼성전자가 뉴스를 발표', 'ko');
    expect(tokens).toContain('삼성전자');
    expect(tokens).not.toContain('뉴스'); // stopword
  });

  it('drops date/time meta tokens like 22일 / 5월', () => {
    expect(tokenize('22일 5월 삼성전자', 'ko')).toEqual(['삼성전자']);
  });

  it('lowercases English, drops short tokens and stopwords', () => {
    const tokens = tokenize('The AI Model said hello', 'en');
    expect(tokens).toContain('model');
    expect(tokens).toContain('hello');
    expect(tokens).not.toContain('ai'); // length 2 < EN_MIN_LEN
    expect(tokens).not.toContain('the'); // stopword
    expect(tokens).not.toContain('said'); // stopword
  });
});

describe('extractDerivedKeywords', () => {
  it('counts frequency, drops single-occurrence noise, sorts desc', () => {
    const articles = [
      { title: '삼성전자 삼성전자 실적', summary: '삼성전자 호조', lang: 'ko' as const },
      { title: '실적 발표', summary: '', lang: 'ko' as const },
    ];
    const result = extractDerivedKeywords(articles, 10);
    const top = result[0];
    expect(top?.keyword).toBe('삼성전자');
    expect(top?.count).toBe(3);
    // 실적은 2회 → 포함, 발표는 1회 → 제외
    expect(result.map((r) => r.keyword)).toContain('실적');
    expect(result.map((r) => r.keyword)).not.toContain('발표');
  });

  it('respects topN cap', () => {
    const articles = [
      { title: 'apple apple banana banana cherry cherry', summary: '', lang: 'en' as const },
    ];
    expect(extractDerivedKeywords(articles, 2)).toHaveLength(2);
  });
});

describe('matchArticles', () => {
  const articles = [
    { title: 'AI 반도체 호황', summary: '', url: 'https://a/1' },
    { title: '경제 전망', summary: 'AI 투자 확대', url: 'https://a/2' },
    { title: '스포츠 결과', summary: '', url: 'https://a/3' },
  ];

  it('matches keyword as case-insensitive substring of title+summary', () => {
    expect(matchArticles('ai', articles)).toEqual(['https://a/1', 'https://a/2']);
  });

  it('returns empty for empty keyword', () => {
    expect(matchArticles('   ', articles)).toEqual([]);
  });

  it('dedupes urls', () => {
    const dup = [
      { title: 'AI AI', summary: 'AI', url: 'https://a/1' },
      { title: 'AI', summary: '', url: 'https://a/1' },
    ];
    expect(matchArticles('ai', dup)).toEqual(['https://a/1']);
  });
});

describe('compromiseEnTokenizer', () => {
  it('extracts #Noun-tagged single tokens (not noun phrases) and applies en refinement', () => {
    // compromise mock — 대문자 시작 단어를 Noun 으로 가정해 .terms().json() 구조를 흉내.
    const mockNlp = (text: string) => ({
      terms: () => ({
        json: () =>
          text.split(/\s+/).map((w) => ({
            text: w,
            tags: /^[A-Z][a-z]+$/.test(w) ? ['Noun'] : [],
          })),
      }),
    });
    const tok = compromiseEnTokenizer(mockNlp);
    // Iran/World 가 Noun 태그됨. breaking/the 는 mock 룰상 비태그(소문자) → 자동 제외.
    // refine 후: World = EN_STOPWORDS → 제외. iran 만 남음.
    expect(tok('Iran World breaking the')).toEqual(['iran']);
  });

  it('handles nested terms[] structure (sentence-level wrapper)', () => {
    const mockNlp = (text: string) => ({
      terms: () => ({
        json: () => [
          {
            text,
            terms: text.split(/\s+/).map((w) => ({
              text: w,
              tags: /^[A-Z]/.test(w) ? ['Noun'] : [],
            })),
          },
        ],
      }),
    });
    const tok = compromiseEnTokenizer(mockNlp);
    expect(tok('Trump signed')).toEqual(['trump']);
  });
});

describe('garuKoTokenizer', () => {
  it('applies ko refinement (min-len / date / stopword) to extractor output', () => {
    // garu nouns 를 mock — wasm 없이 refine 로직만 검증.
    const tok = garuKoTokenizer(() => ['삼성전자', '뉴스', '22일', 'AI', '그']);
    // 뉴스=stopword, 22일=date 토큰, 그=1글자(<KO_MIN_LEN) 제거. 삼성전자·AI 유지.
    expect(tok('무관한 입력')).toEqual(['삼성전자', 'AI']);
  });

  it('requests foreign tokens via includeSL so AI/IT survive', () => {
    let received: { includeSL?: boolean } | undefined;
    const tok = garuKoTokenizer((_text, opts) => {
      received = opts;
      return [];
    });
    tok('x');
    expect(received).toEqual({ includeSL: true });
  });
});

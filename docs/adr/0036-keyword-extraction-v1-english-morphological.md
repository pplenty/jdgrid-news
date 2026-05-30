# ADR-0036: keyword extraction v1 — 영어 형태소 (compromise)

- Status: Accepted
- Date: 2026-05-30
- Deciders: yusik
- Related: [ADR-0014](./0014-keyword-extraction-v0.md), [ADR-0035](./0035-keyword-extraction-v1-morphological.md)

## Context (배경)

ADR-0035 로 한국어 키워드는 garu-ko 형태소 명사 추출로 개선됐으나, **영어 derived 는 v0 빈도 + stopword 그대로** 라 매 scrape 마다 다른 일반어/매체명이 상위에 떴다 — `verge·axios`(매체명), `world·government·country·story·social·global·media·breaking·really·because·right`(일반어/기능어). stopword 보강을 두 번(2026-05-28 두 라운드) 해도 매 scrape 마다 새 노이즈가 떠 **두더지잡기에 한계**. /trends story 제목도 동일 노이즈를 그대로 노출.

근본 원인 — 영어 v0 는 공백 토큰화 + lowercase + stopword. 품사 정보가 없어 동사·접속사·부사(`breaking·because·really`)를 명사와 구분 못 함.

## Decision (결정)

**compromise** (14.15.1, 순수 JS, 사전 내장 2.6MB) 도입.

```ts
// keywords.ts — compromise 의 #Noun 태그 토큰만 추출
export function compromiseEnTokenizer(nlpFn): Tokenizer {
  return (text) => {
    const terms = nlpFn(text).terms().json();
    const out: string[] = [];
    for (const t of terms) {
      const list = t.terms ?? [t];
      for (const w of list) {
        if (w.tags?.includes('Noun')) out.push(w.text.toLowerCase());
      }
    }
    return refineEnTokens(out); // 기존 en 필터(min-len, 영문자, stopword)
  };
}
```

- `.nouns().out('array')` 는 명사구를 묶어 반환(`"Iran and Israel"`, `"months of war"`) — 빈도 매칭 부적합. → `.terms().json()` 에서 **#Noun 태그된 개별 단어만** 추출(garu 와 동일 패턴).
- `compromiseEnTokenizer(nlp)` 를 `extractDerivedKeywords` 의 `tokenizers.en` 인자로 주입.
- 시그니처 확장 — `koTokenizer?` → `tokenizers?: { ko?, en? }` 옵션 객체 (extension-friendly).
- compromise 는 순수 JS 동기 로드 → **load 실패 케이스 없음**(garu 와 달리 fallback try/catch 불필요).

## Consequences (결과)

**긍정**
- 영어 비명사(`really·because·right·breaking·despite·called·take·keep`) 자동 제거 — POS 가 잡아냄.
- 매체명/명사형 일반어는 stopword 가 잡고, 그 외 끝없이 새로 뜨던 부사·접속사·동사는 형태소가 차단 → **두더지잡기 종료**.
- 실측 비교 (5-30 scrape):
  - 이전: `world·government·country·story·social·global·media·breaking·despite·called·former·live·rise`
  - 새:   `iran·trump·war·israel·london·president·donald·court·women·music·health·power`
- global stories 제목: `[axios·really·assistant·software·switch·other·because]` → `[iran·trump·war·moon·israel·series·london]` 시사어만.
- 의존성 0 (순수 JS), tsx 호환 (mecab-wasm 류 함정 없음).

**부정**
- 의존성 +2.6MB (node_modules, Next 번들 미포함 — scraper 전용).
- scrape +1.8s (14.5 → 16.3s, cron 한도의 1.8%). compromise 가 룰 기반이라 garu 보다 가벼움.
- compromise 는 룰 기반(SOTA NER 보다 정확도 낮음) — 일부 고유명사 누락 가능 (`Apple·Rivian` 미잡힘 사례). 뉴스 헤드라인 명사 추출엔 충분.
- 일반 명사형 노이즈(`man·women·friday·part·moon`)는 여전 — stopword 보강 영역으로 회귀하지만, 이전과 달리 *유한*.

**중립**
- compromise 는 영어 전용 — 한국어는 garu-ko (ADR-0035) 유지.
- 시그니처 변경(`koTokenizer?` → `tokenizers?: {ko?, en?}`)은 내부 모듈 한정, 외부 영향 없음.

## Alternatives Considered (대안)

- **wink-nlp + wink-eng-lite-web-model**: 엔진 656KB + 모델 3.8MB = 4.5MB+, 의존성 2개. 정확도 우수하나 compromise 면 충분.
- **natural**: 오래된 라이브러리. POS tagger 정확도 낮음.
- **nlp.js** (axa-group): 봇 빌더 지향, 무거움.
- **영어 stopword 무한 확장**: 두더지잡기 한계 실증(5-28 2 라운드, 매 scrape 신규 노이즈).
- **현행 유지**: 영어 derived 가 워드클라우드/메인 trends 에 사용 — 노이즈가 사이트 품질 직접 저해.

## Implementation Notes

- compromise `exports` 에 `import`/`require` 둘 다 — tsx 호환 즉시 확인 (mecab-ko-wasm 의 bundler-only 함정 회피, 사전 학습 적용).
- `.nouns()` 가 명사구를 묶는 동작이 빈도 매칭에 부적합한 점은 PoC 로 빠르게 발견 → `.terms().json()` 의 #Noun 필터로 우회. 다음 도입자도 같은 함정에 빠질 가능성 — Pattern 갱신 후보.
- 시그니처 변경(`tokenizers?: {ko?, en?}`)은 koTokenizer 단일 인자보다 확장성 큼. 다른 언어 추가 시(독일어 등) 동일 패턴.
- 단위 테스트는 `nlp` 함수 주입식 mock 으로 (compromise 자체 로드 없이). `tokenizers.ko` 미주입 케이스(garu load fail)도 fallback 경로 보장.

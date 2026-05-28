# ADR-0035: keyword extraction v1 — 형태소 명사 추출 (garu-ko)

- Status: Accepted
- Date: 2026-05-28
- Deciders: yusik
- Related: [ADR-0014](./0014-keyword-extraction-v0.md), [ADR-0034](./0034-unit-testing-vitest.md)

## Context (배경)

ADR-0014 의 v0 키워드 추출은 **공백 토큰화 + 조사 사전 stripping + 불용어**. 운영 데이터로 한계가 드러남 — `derived.ko` top 20 실측:

> 후보, 대통령, 이란, AI, 미국, 정부, 한국, 트럼프, 지난해, 사고, 삼성전자, 단일화, 현장, 남성, 국민의힘, **그는**, **같은**, 지원, 사진, 결과

- **"그는"**(대명사+조사), **"같은"**(형용사 활용형) 같은 기능어가 상위에 잔존 — 조사 사전 + margin 가드로는 못 거름.
- 2026-05-27 particle margin 버그(3글자 토큰 strip 누락)도 이 방식의 구조적 취약성.
- 근본 해결은 **형태소 분석 기반 명사 추출**. 단 제약: scrape 는 GitHub Actions 의 **tsx 실행**, 배포는 정적(Cloudflare), 운영비 0 지향 — 네이티브 바이너리·대형 사전 설치는 부담.

## Decision (결정)

**garu-ko** (Ultra-lightweight Korean morphological analyzer, WASM, 1.9MB 모델 내장, F1 93.9%) 도입.

```ts
// index.ts — main() 안. async load, 실패 시 v0 fallback.
let koTokenizer: ((text: string) => string[]) | undefined;
try {
  const garu = await Garu.load();
  koTokenizer = garuKoTokenizer((t, o) => garu.nouns(t, o));
} catch (err) {
  console.warn(`garu-ko load failed — v0 tokenizer fallback: ${errMessage(err)}`);
}
```

- `nouns(text, { includeSL: true })` — 명사(NNG/NNP) + **외국어 토큰(SL)** 추출. `includeSL` 없으면 "AI"·"IT" 가 누락되므로 필수.
- **주입식** (`keywords.ts` 의 `garuKoTokenizer`): 분석기를 `extractDerivedKeywords(articles, topN, koTokenizer)` 로 주입. 미주입 시 v0 `tokenize` 로 graceful fallback. garu 결과에도 기존 ko 필터(최소 길이·날짜 토큰·불용어) 재적용.
- **중복 제거**: `cloud`(top 40) 1회 계산 + `derived`(top 20) 는 prefix slice. 같은 기사를 garu 로 두 번 토큰화하던 것 제거.
- 영어 키워드는 v0 유지 (garu 는 한국어 전용).

적용 후 `derived.ko` top 20:
> 후보, 대통령, 미국, AI, 이란, 선거, 한국, 조사, 현지, 시간, 정부, 투표, 시장, 지원, 장관, 국내, 기업, 국민의힘, 사진, 투자

→ "그는/같은" 제거, "선거/투표/장관/기업/투자" 등 의미 명사 부각, "AI" 보존.

## Consequences (결과)

**긍정**
- 기능어·활용형("그는/같은/했다") 노이즈 근본 제거 — 명사만.
- 고유명사(이재명/윤석열/삼성전자/국민의힘) 정확 인식, 외국어(AI) 보존.
- `Garu.load()` 실패 시 v0 fallback — 의존성 장애에도 scrape 계속.
- WASM + 모델 내장 → 네이티브 바이너리·apt·별도 사전 설치 0. 정적/0원 철학 유지.

**부정**
- scrape 시간 +11초 (3.3s → 14.5s). cron 15분 한도의 ~1.6% — 수용 가능.
- 의존성 +1.4MB (node_modules). Next 번들엔 미포함(scraper 전용, app 미import).
- **복합명사 분할**: "영업이익"→"영업"+"이익", "헌법재판소"→"헌법"+"재판소" — 빈도 분산. garu 에 복합명사 유지 옵션 없음.
- `Garu.load()` 시 "deprecated parameters" 경고 (garu-ko 0.9.1 내부 이슈, 동작 무관).

**중립**
- 남은 메타명사("조사/현지/시간/사진")는 stopwords 보강으로 추후 개선 (별도).
- 영어 키워드는 형태소 미적용 — 영문 기사는 stopword + 빈도로 충분.

## Alternatives Considered (대안)

- **mecab-ko-wasm 0.7.0**: 먼저 시도 → 2 블로커. (1) bundler-target 전용 (`import * as wasm from "x.wasm"`) — tsx 가 `.wasm` 을 CJS require 하다 SyntaxError. (2) 사전 미포함 — `MECAB_DICDIR` 또는 mecab-ko-dic 별도 설치 필요. tsx-scrape + 경량 제약과 충돌, 기각.
- **네이티브 mecab (node-mecab-ya + mecab-ko-dic)**: 정확도 최고지만 GitHub Actions 에 mecab + 사전 설치 step 필요 (ubuntu apt 에 mecab-ko-dic 없어 소스 빌드 가능성). install 무거움·운영 복잡 — 0원/단순 철학 위배.
- **kiwi-nlp 0.23.0 (3.9MB)**: Kiwi WASM. garu 보다 무겁고 추가 검증 필요. garu 가 1.9MB·node export·F1 93.9% 로 충분.
- **v0 휴리스틱 보강**: 활용형 어미 제거 룰 + stopwords 확장. 가볍지만 근본(형태소) 해결 아님 — 땜질 누적.

## Implementation Notes

- garu-ko `exports` 의 `node` condition → `dist/node.js` (fs 로 wasm+model 로드). tsx 호환의 핵심 — mecab-ko-wasm 과 갈린 지점.
- top-level await 는 tsx CJS transform 에서 불가 → `main()` async 안에서 `await Garu.load()` (기존 `main().then()` 패턴과 양립).
- `garuKoTokenizer` 는 nouns 함수 주입식 → 단위 테스트는 mock extractor 로 (wasm 로드 없이 refine 로직 검증, `keywords.test.ts`).
- garu nouns 결과도 `refineKoTokens`(KO_MIN_LEN·KO_DATE_PATTERN·KO_STOPWORDS) 거침 — v0 불용어 자산 재활용.
- 후속: 메타명사 stopword 보강, 복합명사 병합(analyze 인접 NNG/NNP) 검토.

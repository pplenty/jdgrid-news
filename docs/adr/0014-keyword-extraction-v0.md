# ADR-0014: 키워드 추출 v0 — 단순 빈도 + 한국어 조사 stripping + 정확 매칭

- Status: Accepted
- Date: 2026-05-22
- Deciders: yusik
- Related: [ADR-0005](./0005-data-sources-rss-google-trends.md), [ADR-0007](./0007-content-policy-headline-curation.md), [ADR-0008](./0008-category-taxonomy.md)

## Context (배경)

ADR-0005에서 트렌딩 키워드를 두 갈래로 보존하기로 결정했다.

- **`trends.google`** — Google Trends RSS에서 받은 외부 1차 신호.
- **`trends.derived`** — 우리가 수집한 헤드라인에서 자체 추출한 보조 신호 (Google Trends RSS 차단/포맷 변경 시 fallback + 자체 시각화 재료).

이번 ADR은 두 번째(`derived`)의 **알고리즘**과, 두 신호 모두에 적용되는 **키워드 ↔ 기사 매칭** 정책을 결정한다.

요구사항:
- 1인 운영 + Cloudflare Pages 빌드 환경에서 안정적으로 돌아갈 것 → 가벼운 의존성.
- 한국어와 영문 혼용 헤드라인을 모두 처리.
- 빌드/스크랩 시점에 결정 → 외부 API 호출 비용 회피 (가능하면).

후보:
1. 단순 빈도 + 한국어 조사 stripping + 불용어 사전.
2. n-gram (2~3 연속 단어).
3. 명사 추출 라이브러리 (koalanlp 등 — JVM 또는 큰 사전).
4. LLM API 호출 (Claude/GPT).

매칭 후보: 정확 / 부분 문자열 / 임베딩 유사도.

## Decision (결정)

> 운영자 결정 (2026-05-22):
> 1. 자체 추출 알고리즘 → **단순 빈도 + 한국어 조사 stripping**
> 2. 키워드 ↔ 기사 매칭 → **정확 매칭 (대소문자 무시)**

### 추출 알고리즘 (`trends.derived`)

#### 입력
- 그날 수집한 모든 `Article`의 `title + summary` 텍스트.
- `lang` 필드로 한국어/영문 분기.

#### 정규화
1. 유니코드 letter·digit·공백·`#` 외 문자를 공백으로 치환 (구두점/이모지 제거).
2. 공백 기준 분할 → 토큰 배열.

#### 한국어 처리
- 토큰의 **끝에서 조사 패턴 stripping** (한 글자 또는 두 글자 조사).
- 조사 사전 초기값:
  ```
  은, 는, 이, 가, 을, 를, 의, 에, 와, 과,
  도, 만, 으로, 로, 에서, 에게, 한테, 께,
  부터, 까지, 이라, 라고, 라도, 이며, 며, 나, 이나
  ```
- stripping은 토큰 길이가 (조사 길이 + 2) 이상일 때만 수행 (짧은 단어 보호).
- 불용어 사전(한국어, 100개 내외, 운영하며 보강) 통과 못 한 토큰 제거.
- 한국어 토큰은 **최소 2글자** 이상만 유효.

#### 영문 처리
- 토큰 전체 lowercase.
- 불용어 사전(영문 stop words 표준 100개 + 도메인 어휘 보강) 통과 못 한 토큰 제거.
- 영문 토큰은 **최소 3글자** 이상만 유효.

#### 집계
- 토큰별 `count` 누적.
- 상위 N개 추출 (디폴트 `top N = 20`, geo별 별도 계산).
- `score = count / max(count)` 로 0~1 정규화.

#### geo 분리
- `lang === 'ko'` 토큰만 → `trends.derived.kr`.
- `lang === 'en'` 토큰만 → `trends.derived.global` (영문 매체 = 글로벌 신호 대리).
- Google Trends RSS의 `geo=KR / US`도 같은 두 버킷에 합산되도록 키만 통일 (`trends.google.kr`, `trends.google.global`).

### 매칭 알고리즘 (Trend.relatedUrls 생성)

```
match(keyword, article) ⇔ keyword.toLowerCase() ⊂ (article.title + ' ' + article.summary).toLowerCase()
```

- **정확 부분 문자열 검색** (대소문자 무시).
- 키워드와 기사 텍스트 모두 `.toLowerCase()` + 양 끝 trim 후 비교.
- 한국어는 대소문자 영향 없지만, 같은 normalize 파이프라인 통과.
- 매치된 기사들의 `url`을 `Trend.relatedUrls`에 push (중복 제거).

### 운영 룰

- 불용어 사전(`src/lib/stopwords.ts` 예정)은 정적 모듈로 관리. 추가/제거 PR.
- 조사 사전(`src/lib/particles.ts` 예정)도 같은 방식.
- 알고리즘 결과 품질이 낮으면(예: 의미 없는 토큰이 top에 자주 등장) 불용어/조사 사전을 보강 — ADR 갱신 없이 코드 변경.
- 알고리즘 **구조 자체**를 바꾸는 경우(예: 명사 추출 라이브러리 도입)는 새 ADR로 supersede.

## Consequences (결과)

**긍정**
- 외부 의존성·API 호출 없음 → 빌드 안정성 ↑, 비용 0.
- 빌드 시점에 완료되어 클라이언트 사이드 인덱스 불필요.
- 알고리즘이 단순 → 결과를 사람이 직접 디버깅 가능 (불용어 추가/조사 패턴 보강).
- 정확 매칭은 False positive가 적어 트렌딩 키워드 클릭 시 보여줄 기사가 "왜 매칭됐지?"에 답하기 쉽다.

**부정**
- 한국어 어절 분할 + 조사 stripping은 **품질 60~70% 수준**. "정부의" → "정부"는 잡지만, 복합 명사("SK하이닉스")는 분할되거나 분할 안 됨 케이스가 섞임.
- 정확 매칭이라 "하이닉스" 키워드는 "SK하이닉스" 기사를 못 잡는다 → Google Trends RSS의 `derived` 키워드와 매체 헤드라인 표기가 다를 때 매칭 누락.
- 불용어 사전 운영 부담 — 첫 1~2주는 결과 보면서 적극적으로 보강 필요.
- 영문은 어근 처리(stemming) 없음. "tax" / "taxes" / "taxation"이 별도 토큰.

**중립**
- 알고리즘은 운영하며 진화. 결과 품질이 80%+ 필요해질 때(예: 외부 노출 늘어남) 명사 추출 라이브러리 도입 ADR로 supersede.
- 첫 출발은 운영자(=본인) 만족 기준으로 충분.

## Alternatives Considered (대안)

- **n-gram (2~3 단어 연속)**: 복합 명사 잡기 좋지만 빈도 표 폭발 + 노이즈 ↑ + 불용어 처리 복잡. v0에 부적합.
- **명사 추출 라이브러리 (koalanlp 등)**: 품질은 좋지만 JVM 또는 대형 사전 의존. Cloudflare Pages·GitHub Actions 빌드 환경에서 의존성 무게 부담.
- **LLM API (Claude/GPT) 키워드 추출**: 품질 최고지만 (1) 비용, (2) 빌드마다 외부 API 의존성, (3) ADR-0007의 "자체 요약/가공 금지" 정신과 회색지대 충돌 (키워드 추출은 요약 아님이지만 운영자 판단 필요).
- **부분 문자열 매칭**: 재현율 ↑이지만 False positive(예: "한"이 들어간 모든 기사 매칭) 위험.
- **임베딩 유사도**: 의미 매칭까지 가능, v1 오버킬. 외부 API 비용.

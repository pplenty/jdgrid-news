# ADR-0016: Trend 풍부화 v1 — Google Trends RSS 메타데이터·뉴스 아이템 파싱

- Status: Accepted
- Date: 2026-05-22
- Deciders: yusik
- Related: [ADR-0005](./0005-data-sources-rss-google-trends.md), [ADR-0014](./0014-keyword-extraction-v0.md), [ADR-0007](./0007-content-policy-headline-curation.md)

## Context (배경)

ADR-0005에서 트렌딩 키워드를 Google Trends RSS로부터 받기로 결정했지만, 우리는 `<title>`만 읽고 있다. Google Trends RSS의 `<item>`에는 다음 데이터도 들어있다:

- `ht:approx_traffic` — 대략적 검색량 (`200K+`, `1M+` 등).
- `ht:picture` — 트렌드 대표 이미지 URL.
- `description` — 짧은 컨텍스트/관련 검색어.
- `ht:news_item` (여러 개) — **Google이 그 키워드에 매칭해 큐레이션한 관련 기사들** (제목/URL/매체/이미지).

운영자 피드백 (2026-05-22): "지금은 너무 실시간 검색어 느낌". 원인 추정:
1. 키워드만 노출 — 검색량·컨텍스트 없음.
2. `score` 모두 1로 동일 — 시각 위계 부족.
3. 우리의 정확 부분문자열 매칭(ADR-0014)으로는 `relatedUrls`가 비는 키워드가 많음 (예: "김부선" 같은 인물명이 매체 헤드라인에 정확 일치하지 않음).

해결책: 같은 endpoint에서 더 잘 파싱한다. **외부 의존·정책 리스크 0**. ROI 최고.

다만 `ht:news_item`은 nested namespaced XML 구조라 `rss-parser`의 customFields로는 깔끔히 안 잡힌다 → 별도 파서 필요.

## Decision (결정)

### Trend 타입 확장

`src/lib/types.ts` 의 `Trend`에 다음 옵셔널 필드를 추가:

```ts
export type Trend = {
  keyword: string;
  score: number;
  /** 신호 출처. */
  source: 'google' | 'derived';
  /** Google 제공 대략적 검색량 (예: "200K+", "1M+"). source === 'google'에서만. */
  traffic?: string;
  /** 트렌드 대표 이미지 URL. */
  picture?: string;
  /** 짧은 컨텍스트/관련 검색어. */
  description?: string;
  /** Google이 큐레이션한 관련 기사 (ht:news_item). */
  googleArticles?: GoogleNewsItem[];
  /** 우리가 정확 매칭한 우리 수집 기사 URL (ADR-0014). */
  relatedUrls: string[];
};

export type GoogleNewsItem = {
  title: string;
  url: string;
  source: string;   // 매체명
  picture?: string;
};
```

### 별도 XML 파서 도입

- **fast-xml-parser** (`pnpm add fast-xml-parser`).
  - 무의존(zero-dep), 1인 운영에 부담 없음.
  - rss-parser 대비 namespaced/nested XML을 다루기 쉬움.
- Google Trends RSS만 fast-xml-parser로 별도 파싱. 매체 RSS는 기존 rss-parser 유지.
- 모듈: `src/scraper/google-trends.ts` 신설.

### `googleArticles`와 ADR-0007의 관계

- `googleArticles[].title / url / source / picture`만 저장. **본문이나 자체 가공 요약은 저장하지 않음** — ADR-0007의 5필드 정책과 정합 (헤드라인+출처+링크+썸네일은 허용).
- `picture`는 핫링크로만 사용. 자체 호스팅 금지.

### 신호 통합 정책 (mergeTrends)

- Google 트렌드를 우선 표시 (`source: 'google'`).
- derived 자체 추출은 보조 (`source: 'derived'`).
- 같은 키워드가 양쪽에서 잡히면 Google이 이김.
- 표시 우선순위: traffic 큰 순(Google) → derived count 큰 순.

### 매칭 보강

- `Trend.relatedUrls` (우리 매칭) + `Trend.googleArticles` (Google 매칭) 두 갈래로 보존.
- UI는 둘 다 노출 — 우리 매체 매칭이 있으면 우선, 없으면 Google이 큐레이션한 외부 기사로 폴백.
- 이렇게 하면 매칭 0인 키워드도 클릭 시 비지 않음.

## Consequences (결과)

**긍정**
- 같은 endpoint 더 잘 파싱하므로 외부 의존·정책 리스크 0.
- `relatedUrls`가 비어있던 키워드도 `googleArticles`로 채워짐 → 클릭 후 빈 페이지 사라짐.
- traffic 노출 → "200K+" 같은 시각적 임팩트.
- picture 노출 → 트렌딩 카드가 시각적으로 풍부.
- description 노출 → "왜 트렌드인지" 맥락 부여.

**부정**
- Google Trends RSS의 비공식성 변동 위험은 여전 (ADR-0005에서 이미 명시). 풍부화는 그 위에 얹는 거라 같은 리스크 공유.
- fast-xml-parser 의존성 추가 (~50kb). 단 scraper 빌드에만 영향, 웹 번들엔 안 들어감.
- nested XML 파싱 코드는 Google이 RSS 스키마를 바꾸면 깨질 수 있음 → 파싱 실패는 graceful fallback (기존 RSS-parser 결과만 사용).

**중립**
- `googleArticles`의 매체는 Google이 고른 외부 매체 → 우리 SOURCES 명단에 없는 매체도 등장 가능. 이는 큐레이션 보조라 의도된 동작.
- `picture` URL은 Google CDN(`encrypted-tbn0.gstatic.com` 등). 핫링크 안정성은 보통.

## Alternatives Considered (대안)

- **비공식 `google-trends-api` 라이브러리**: Interest over time, Related queries 등 더 풍부한 데이터 제공. 그러나 (1) 의존성 무거움, (2) 비공식이라 Google이 막을 가능성 더 큼, (3) 우리 v1엔 과잉. v2 이후.
- **rss-parser customFields로 끝까지 우기기**: nested namespaced XML이 깔끔히 안 잡혀서 보일러플레이트 증가. 별도 파서가 깔끔.
- **자체 매칭 알고리즘 강화 (n-gram, 형태소)**: ADR-0014 supersede 필요. 작업 양·품질 보장 부담 큼. Google이 이미 만들어준 매칭을 쓰는 게 ROI ↑.

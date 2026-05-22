# ADR-0018: Trend source fallback — 자체 분류 + Wikipedia Pageviews (ADR-0017 보완)

- Status: Accepted
- Date: 2026-05-22
- Deciders: yusik
- Related: [ADR-0008](./0008-category-taxonomy.md), [ADR-0014](./0014-keyword-extraction-v0.md), [ADR-0016](./0016-trend-enrichment-google.md), [ADR-0017](./0017-realtime-trends-categories.md)

## Context (배경)

ADR-0017에서 Google Realtime Trends API로 카테고리별 트렌드를 가져오기로 결정했으나 endpoint가 폐지된 것을 구현 후 확인 (ADR-0017 §Implementation Discovery). UI/타입/페이지 인프라는 박혀있고, **데이터 source만 채우면 된다**.

운영자 결정 (2026-05-22): 자체 분류(A) + Wikipedia Pageviews(B) 동시 도입. 둘 다 무리스크·무인증.

또한 이 기회에 ADR-0017이 박은 `RealtimeCategory`(Google cat 기준)와 우리 ADR-0008의 `CategoryId`(우리 8분류)가 이중 매핑되는 비대칭을 정리한다. 자체 분류는 우리 카테고리 기준이고, 미래에 Google API가 부활해도 우리 카테고리로 매핑해서 단일 모델을 유지하는 게 깔끔.

## Decision (결정)

### 데이터 모델 통합

`RealtimeTrendStory` / `RealtimeCategory` 폐기. 통합 `TrendStory` 도입 — **우리 `CategoryId` 기준 (ADR-0008)**.

```ts
export type TrendArticle = {
  title: string;
  url: string;
  source: string;
  imageUrl?: string;
  publishedAt?: string;
  snippet?: string;
};

export type TrendStory = {
  title: string;
  entityNames?: string[];
  imageUrl?: string;
  shareUrl?: string;
  category: CategoryId;
  geo: 'KR' | 'global';
  source: 'google_realtime' | 'inferred';
  articles: TrendArticle[];
};

export type WikiTrend = {
  title: string;            // 위키 문서 제목 (사람이 읽기 좋은 형태)
  url: string;              // wikipedia.org/wiki/{title}
  views: number;            // 어제 조회수
  thumbnail?: string;       // page summary API에서 (v1엔 생략)
  description?: string;     // summary 첫 줄 (v1엔 생략)
};

// DailySnapshot.trends 갱신
trends: {
  global: Trend[];     // Daily RSS (ADR-0016)
  kr: Trend[];
  stories?: {          // ADR-0017 rename: realtime → stories (CategoryId 기준)
    kr: TrendStory[];
    global: TrendStory[];
  };
  wikipedia?: {        // ADR-0018 신설
    ko: WikiTrend[];
    en: WikiTrend[];
  };
};
```

### 자체 분류 알고리즘 (A)

`src/scraper/auto-categorize.ts`:

1. 입력: Daily Trend(`trends.kr / trends.global`), 우리가 수집한 `Article[]`.
2. 각 Trend의 `relatedUrls`(우리 매체 매칭 결과, ADR-0014)에 해당하는 article들을 모은다.
3. article들의 `category` (ADR-0008) majority로 trend의 카테고리 추론.
4. 동수 시 ADR-0008의 `CATEGORY_PRIORITY` 우선순위로 tie-break.
5. `relatedUrls`가 비어있는 trend는 분류하지 않음 (story 안 만듦).
6. 각 trend → `TrendStory` 로 변환:
   - `title` = Trend.keyword
   - `imageUrl` = Trend.picture (Google CDN)
   - `entityNames` = undefined (Google realtime 전용 필드)
   - `articles` = relatedUrls 매핑된 우리 article들 (최대 5건) → TrendArticle
   - `source: 'inferred'`

### Wikipedia Pageviews (B)

`src/scraper/wikipedia.ts`:

- Endpoint: `https://wikimedia.org/api/rest_v1/metrics/pageviews/top/{project}/all-access/{YYYY}/{MM}/{DD}`
- Project: `ko.wikipedia` (한국어), `en.wikipedia` (영어).
- 날짜: KST 기준 **어제** (오늘 데이터는 아직 집계 안 됐을 수 있음).
- 헤더: `User-Agent: jdgrid-news/0.1 (mailto:support@jdgrid.com)` — Wikimedia 권장 (운영자 식별).
- 응답: `items[0].articles[]` (rank, article, views).
- 필터링:
  - `article === 'Main_Page'`, `Special:*`, `특수:*` 제외.
  - 언더스코어 → 공백 (사람이 읽기 좋게).
  - URL은 `https://{lang}.wikipedia.org/wiki/{article}` (encoded).
- 상위 20건 보존.
- v1에서는 `thumbnail` / `description` 생략 (page summary API 별도 호출 비용 회피). 추후 보강.

### `/trends` 페이지 데이터 source 우선순위

```
1. snapshot.trends.stories (있으면 사용)
   - 'google_realtime' 소스가 있으면 그것 우선
   - 없으면 'inferred' 소스
2. (1)이 비어있으면 "데이터 없음"
```

자체 분류는 매일 항상 동작 — 즉 `stories.kr/global`은 거의 항상 채워짐. Google realtime API가 부활하면 그 결과가 위에 쌓여 정밀도 ↑.

### Wikipedia UI 위치

- 메인 페이지 **TrendingBanner 아래** 별도 섹션 "오늘의 위키피디아" 또는 **사이드바 추가 영역**.
- 결정: **메인 페이지 별도 섹션** — 사이드바는 이미 카테고리/트렌딩으로 빡빡함.
- /trends 페이지에는 우선 포함 안 함 (분야별이 아니라 단일 리스트라 톤 다름) → 메인에만.

## Consequences (결과)

**긍정**
- 자체 분류로 /trends 페이지가 즉시 데이터로 채워짐 (Google realtime 부재 보완).
- Wikipedia가 "검색"이 아닌 "지식 관심사" 차원 추가 — 정치 편향 자연스럽게 분산.
- 데이터 모델 통합(`RealtimeCategory` → `CategoryId`)으로 미래 호환성 ↑. Google API가 다시 살아나도 동일 모델로 매핑.
- 둘 다 무료·무인증·매우 안정.

**부정**
- 자체 분류는 `relatedUrls`가 0인 trend(Daily RSS의 가십·인물명 다수)는 분류 못 함 → /trends 페이지의 카테고리 그리드가 카테고리별로 듬성듬성할 수 있음.
- Wikipedia top pages는 정치·연예 인물·시사 위주 → 메인 페이지 Wikipedia 섹션도 비슷한 톤. 단 검색과 다른 신호.
- 모델 변경(`realtime` → `stories`)으로 ADR-0017 기준 코드/타입 일부 교체. 1인 운영이라 비용 작지만 정합성 확보 필요.

**중립**
- `stories`는 `realtime`에 비해 source-neutral 이름. 미래 다른 source(예: Naver) 추가도 같은 구조에 쌓을 수 있음.
- Wikipedia summary(설명·썸네일) 보강은 v2 후보.

## Alternatives Considered (대안)

- **A만 (자체 분류만)**: 즉시 효과 있지만 신호 다양성 ↓. Wikipedia 추가가 무리스크라 같이 가는 게 ROI ↑.
- **B만 (Wikipedia만)**: /trends 페이지의 카테고리 그리드가 여전히 빈 상태로 남음.
- **C 옵션 (HN + Reddit + YouTube)**: 분야별 source는 강력하지만 source 수 ↑ → 운영 비용 ↑. v2에 검토.
- **D 옵션 (Naver DataLab)**: OAuth 가입 1회 부담. 한국 한정으로 매우 강력. 본 ADR 후 별도 결정.
- **모델은 그대로 두고 자체 분류만 별도 필드**: ADR-0017의 `realtime` + `inferred` 두 필드 공존. 복잡도 ↑. 통합이 깔끔.

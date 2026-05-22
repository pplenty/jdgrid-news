# ADR-0020: Naver DataLab 쇼핑 — 분야별 트렌드 + 키워드 트렌드 (큐레이션)

- Status: Accepted
- Date: 2026-05-22
- Deciders: yusik
- Related: [ADR-0005](./0005-data-sources-rss-google-trends.md), [ADR-0007](./0007-content-policy-headline-curation.md), [ADR-0018](./0018-trend-fallback-self-categorize-wikipedia.md)

## Context (배경)

운영자 피드백 (2026-05-22): "Google Trends에 쇼핑 트렌드도 있더라". Google엔 무료 쇼핑 트렌드 endpoint가 없고, 한국 쇼핑 트렌드는 **Naver DataLab**이 사실상 표준.

Naver DataLab 공개 API (`developers.naver.com/docs/serviceapi/datalab`):

| 엔드포인트 | 내용 |
| - | - |
| `POST /v1/datalab/shopping/categories` | 분야(카테고리)별 검색량 추이 — 카테고리 비교 시계열 |
| `POST /v1/datalab/shopping/category/keywords` | 카테고리 내 **특정 키워드** 검색량 추이 |
| `POST /v1/datalab/search` | 일반 검색어 트렌드 (쇼핑 외) |

**중요 제약**: "카테고리 내 자동 인기 검색어 발견" API는 **없음**. Naver Shopping Insight 웹에는 인기 검색어 차트가 있지만 HTML 스크래핑(비공식, robots.txt 회색지대)이 필요. 따라서 우리는:

→ **카테고리별 큐레이션 키워드 사전**(예: 패션의류 = 청바지·자켓·운동화·…) 을 둔다. Naver DataLab은 그 키워드들의 최근 검색량 추이를 줘서 우리가 top 정렬 가능.

운영자 결정 (2026-05-22): 쇼핑 인기 검색어 + 카테고리 트렌드 둘 다(A+B).

## Decision (결정)

### API 도입

1. **카테고리별 트렌드** (`/v1/datalab/shopping/categories`)
   - 5 카테고리의 지난 14일 시계열 — UI에서 멀티 라인 비교 그래프.
2. **카테고리 내 키워드 트렌드** (`/v1/datalab/shopping/category/keywords`)
   - 사전 큐레이션 키워드 × 카테고리. 키워드별 14일 시계열 받아 어제 점수로 정렬 → top 5~8건/카테고리.

### 카테고리 셋 (v1, 5개)

| Naver 카테고리 | 코드 | 별칭(UI) |
| - | - | - |
| 패션의류 | 50000000 | 패션 |
| 화장품/미용 | 50000002 | 뷰티 |
| 디지털/가전 | 50000003 | 디지털·가전 |
| 식품 | 50000006 | 식품 |
| 스포츠/레저 | 50000007 | 스포츠 |

### 큐레이션 키워드 (`src/scraper/naver-shopping-keywords.ts`)

카테고리당 8~10개 사전 정의. 운영하며 PR로 보강. 시작 후보 (예시):

- 패션의류: 청바지, 자켓, 원피스, 셔츠, 코트, 운동화, 가방, 스커트, 니트, 후드티
- 뷰티: 마스크팩, 립스틱, 향수, 선크림, 토너, 쿠션, 아이섀도우, 클렌징, 앰플
- 디지털·가전: 아이폰, 갤럭시, 노트북, 이어폰, 모니터, 키보드, 마우스, 에어팟, 태블릿
- 식품: 라면, 즉석밥, 김치, 커피, 음료수, 과자, 간식, 건강식품, 비타민
- 스포츠: 골프, 자전거, 등산, 요가, 헬스, 러닝, 캠핑, 수영, 축구

### 데이터 모델

```ts
export type NaverShoppingKeyword = {
  category: string;            // 우리 별칭 ("패션" 등)
  categoryCode: string;        // Naver 코드
  keyword: string;
  score: number;               // 어제 검색량 (0~100 상대 비율)
  history?: HistoryPoint[];    // 지난 14일 추이
};

export type NaverShoppingCategoryTrend = {
  category: string;
  categoryCode: string;
  history: HistoryPoint[];     // 지난 14일
};

// DailySnapshot 확장
trends: {
  ...,
  naver?: {
    keywordsByCategory: Record<string, NaverShoppingKeyword[]>;  // 카테고리당 top 5~8
    categoryTrends: NaverShoppingCategoryTrend[];
  };
};
```

### 인증

- 환경변수: `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`.
- 로컬: `.env.local` (gitignored, 이미 포함). 형식: `NAVER_CLIENT_ID=...`.
- CI: GitHub Repository → Settings → Secrets and variables → Actions에 등록. `.github/workflows/daily-scrape.yml` 에서 `env:` 로 inject.
- **env 미설정 시 graceful skip** — fetcher가 빈 결과 반환, `snapshot.trends.naver` undefined로 두고, UI는 섹션 자체 안 그림.

### 운영자 작업 (수동)

1. `https://developers.naver.com` 가입·로그인.
2. "Application 등록" → 이름: jdgrid-news. 사용 API: **데이터랩 (검색어 트렌드)**, **데이터랩 (쇼핑인사이트)** 선택.
3. 발급된 Client ID/Secret을 GitHub Repository → Settings → Secrets → New repository secret 으로 `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET` 등록.

### UI

- 메인 페이지에 새 섹션 `🛍 쇼핑 트렌드` — TrendingBanner / WikipediaSection 아래.
- 카테고리별 column (5개): 카테고리명 + 키워드 리스트 + 각 키워드 미니 sparkline.
- 데이터 없으면 (env 미설정) 섹션 자체 안 그림.

## Consequences (결과)

**긍정**
- 한국 쇼핑 차원 첫 도입 — 검색·뉴스·지식과는 다른 신호.
- API 무료 + quota 여유 (1만/일 추정).
- 데이터 모델/UI 일관 (HistoryPoint·Sparkline 재사용).
- env 미설정 시 graceful — 사용자 등록 전후 모두 작동.

**부정**
- 운영자 일회 가입 부담 (Naver Developers).
- 인기 검색어 자동 발견 X → **사전 키워드 관리 부담**. 트렌드를 놓치는 경우 있을 수 있음.
- API 호출 수 ↑: 카테고리 5 × 키워드 8~10 = 40~50 호출 + 카테고리 트렌드 1 호출. cron 시간 +5~10초 추정. 5씩 chunk 병렬로 완화.
- Naver DataLab 응답은 0~100 상대 비율 — 절대값 아니고 그룹 내 정규화. 카테고리 간 비교는 한 API 호출 안에서만 의미 있음.

**중립**
- 쇼핑 외 영역(일반 검색어 트렌드)은 본 ADR에 포함 안 함 — 추후 결정.
- BEST100 같은 HTML 스크래핑은 ADR-0005·0007 정신상 명시적 배제.
- 큐레이션 키워드는 운영 튜닝 영역 (PR로 조정, ADR 갱신 없이).

## Alternatives Considered (대안)

- **HTML 스크래핑 (Naver Shopping BEST)**: robots.txt 회색지대 + 정책 변동성 ↑. ADR-0005에서 RSS 공식만 가는 원칙과 충돌.
- **일반 검색어 트렌드만**: 쇼핑 차원이 빠짐. 운영자 의도 미충족.
- **카테고리 트렌드만 (B)**: 단순하지만 키워드 노출 없으면 "어떤 상품이 인기"는 알 수 없음.
- **상용 API (네이버 쇼핑 검색 API, 쿠팡 등)**: 일부는 유료, 쇼핑 트렌드 X.

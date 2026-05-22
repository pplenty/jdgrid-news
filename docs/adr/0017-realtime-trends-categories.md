# ADR-0017: Trend 구조 고도화 v1 — Google Realtime Trends API 카테고리별 + /trends 페이지

- Status: **Accepted but blocked** (구현 중 endpoint 폐지 확인 — 본문 §Implementation Discovery 참조)
- Date: 2026-05-22
- Deciders: yusik
- Related: [ADR-0005](./0005-data-sources-rss-google-trends.md), [ADR-0007](./0007-content-policy-headline-curation.md), [ADR-0008](./0008-category-taxonomy.md), [ADR-0016](./0016-trend-enrichment-google.md)

## Context (배경)

운영자 피드백 (2026-05-22):
- "구글 트렌드 본 페이지와 다르다, 어떤 기준으로 뽑은 거?" — 현재 `trends.google.com/trending/rss?geo=KR`만 사용. **Daily Trending (24h 전체 통합)** 한 슬라이스만 잡고 있어 본 페이지의 카테고리/실시간과 차이.
- "너무 정치에 치우쳐져 있다" — 통합 endpoint라 시사·정치·연예가 자연스럽게 상위. 알고리즘 편향이 아니라 source 특성.
- "구조가 고도화되면 좋겠다" + "쇼핑 트렌드도 있더라" — **분야별로 분리된 트렌드** 가 핵심 의도.

Google Trends 비공식 API는 본 페이지가 쓰는 데이터를 노출:
- `trends.google.com/trends/api/realtimetrends?cat={b|e|m|t|s|h}&geo=KR` — 분 단위 갱신 + **story 단위(뉴스 토픽 클러스터)** + 관련 기사·이미지·entity 포함.
- 카테고리 매핑(공식 명세 아님, 관측 기반):
  - `b` = Business · `e` = Entertainment · `m` = Health · `t` = Sci/Tech · `s` = Sports · `h` = Top Stories
- 응답은 JSON에 XSSI 방어 prefix `)]}',` 가 붙어옴 → strip 후 parse.

본 ADR은 **비공식 endpoint의 정책 리스크를 수용**한다고 명시적으로 박는다. ADR-0005에서 "비공식 RSS 차단 시 어댑터 교체"로 미리 결정한 흐름을 이어받음.

## Decision (결정)

> 운영자 결정 (2026-05-22):
> 1. Google Trends 카테고리별 API 적극 도입
> 2. Endpoint → Real-time Trends API (story 단위, 분 단위 갱신)
> 3. UI → /trends 페이지 신설

### endpoint와 카테고리 매핑

매일 cron(ADR-0006) 실행 시 다음 6개 카테고리를 병렬 fetch:

| Google cat | 이름 | 우리 매핑 (ADR-0008) |
| - | - | - |
| `h` | Top Stories | `top` |
| `b` | Business | `business` |
| `e` | Entertainment | `culture` |
| `m` | Health | (자체 카테고리 없음 — `science` 보조) |
| `t` | Sci/Tech | `tech` + `science` (둘 다) |
| `s` | Sports | `sports` |

- `world` 와 `politics` 는 Google 카테고리에 1:1로 없음 → **Daily Trending(ADR-0016)으로 보완**, realtime은 비워둠.
- 한국(`geo=KR`) + 영문(`geo=US`) 각각 fetch → KR/global 두 버킷 보존.

### 데이터 모델 확장

`src/lib/types.ts`:

```ts
export type RealtimeCategory =
  | 'top_stories'
  | 'business'
  | 'entertainment'
  | 'health'
  | 'sci_tech'
  | 'sports';

export type RealtimeArticle = {
  title: string;
  url: string;
  source: string;
  imageUrl?: string;
  publishedAt?: string;
  snippet?: string;
};

export type RealtimeTrendStory = {
  /** Story 제목 (뉴스 토픽 클러스터 라벨). */
  title: string;
  /** 관련 엔티티 (인물·장소·물건 — Google이 추출). */
  entityNames: string[];
  imageUrl?: string;
  /** Google Trends story URL. */
  shareUrl?: string;
  category: RealtimeCategory;
  geo: 'KR' | 'global';
  articles: RealtimeArticle[];
};
```

`DailySnapshot.trends` 확장 (옵셔널 필드 추가, 기존 호환):

```ts
trends: {
  global: Trend[];   // 기존 Daily (ADR-0016)
  kr: Trend[];       // 기존 Daily
  realtime?: {       // 추가 (본 ADR)
    kr: RealtimeTrendStory[];
    global: RealtimeTrendStory[];
  };
};
```

### `/trends` 페이지

- 정적 라우트, 빌드 시점에 latest.json 기반.
- 레이아웃:
  - 상단: 페이지 제목 + 출처 표기 ("via Google Realtime Trends · YYYY-MM-DD").
  - 카테고리별 섹션 — 각 섹션 = `RealtimeTrendStory` 카드 그리드.
  - KR / global 토글 또는 두 섹션 분리 (디테일은 구현 단계).
- 카드 = imageUrl + title + entityNames(태그) + 관련 기사 2~3건(GoogleArticleRow와 유사).
- 사이드바에 "트렌드 상세" 링크 추가.

### ADR-0007 정합

- `articles[].title / url / source / imageUrl` 만 저장.
- `snippet`은 매체가 RSS에 노출하는 짧은 발췌와 동등하다고 판단해 저장 허용 (Google이 큐레이션해서 제공한 짧은 인용 — 자체 가공 아님).
- imageUrl 은 Google CDN 핫링크. 자체 저장 금지.

### 운영 룰

- realtime fetch 실패 시 graceful — `snapshot.trends.realtime = undefined`. UI는 "데이터 없음" 처리.
- Google이 응답 포맷 바꾸면 파서 한 곳(`src/scraper/google-realtime.ts`)에서만 갱신.
- 비공식 endpoint 차단 위험 — 차단 시 본 ADR을 supersede하는 새 ADR로 다른 source 검토 (Naver DataLab 등).

## Consequences (결과)

**긍정**
- 정치 편향 분산 — 카테고리별로 분리되니 sports/business/tech/culture가 동등하게 노출됨.
- Story 단위 데이터 — 단순 키워드 대신 "사건"으로 묶여 있어 UI 정보 밀도 ↑.
- entityNames로 관련 인물/물건 라벨링 가능 (예: "오세훈" → entity로 표시).
- 같은 매체 매칭 한계(ADR-0014)를 Google이 큐레이션한 기사로 보완.

**부정**
- 비공식 endpoint — Google이 막거나 포맷 바꿀 가능성. 모니터링 필수.
- cron 시 추가 fetch (6 cat × 2 geo = 최대 12 호출). 실행 시간 +5~10초 추정.
- 응답이 큼 — 카테고리별 story 20개 × 관련 기사 5~10개 → snapshot.json 크기 50~100KB 추가.
- `world`/`politics`/`science(자체)`는 Google cat에 1:1로 없어 매핑이 거침.

**중립**
- `health` 카테고리는 우리 ADR-0008 8분류에 없음. UI에는 표시하되 우리 카테고리 매핑은 약 (보조용으로 science 옆에 둘지 별도 표시할지는 구현 단계).
- `/trends` 페이지의 KR/global 토글 vs 분리 표시는 구현 자율.
- 쇼핑 카테고리는 Google realtime API에 없음 — Naver DataLab 등 별도 출처 필요 (본 ADR 범위 밖).

## Implementation Discovery (2026-05-22 후속)

본 ADR을 박고 구현·테스트하던 중 Google이 비공식 API endpoint를 **폐지**한 것을 확인.

직접 검증 결과 (2026-05-22):

| Endpoint | HTTP |
| - | - |
| `/trending/rss?geo=KR` (공식 RSS, ADR-0016에서 사용) | **200** ✓ |
| `/trends/api/realtimetrends?cat=h&geo=KR&...` | 404 ✗ |
| `/trends/api/dailytrends?geo=KR&...` | 404 ✗ |

공식 RSS만 살아있고, 비공식 API 계열은 모두 차단된 상태. `pytrends`·`google-trends-api` 같은 라이브러리들이 사용해온 endpoint들이라 영향 범위 큼.

**현재 코드 상태**:
- `src/scraper/google-realtime.ts` 는 작성되어 있고 호출은 되지만, 404 graceful fail → 빈 배열 반환.
- `snapshot.trends.realtime` 은 결과적으로 `undefined` (또는 빈 객체).
- `/trends` 페이지는 정상 빌드되지만 "실시간 트렌드 데이터가 없습니다" 안내만 노출.

본 ADR의 결정 자체(카테고리별 트렌드를 /trends 페이지로 분리)는 유효. **데이터 source가 부재한 상태**일 뿐. 후속 ADR로 다른 source를 박아 같은 UI에 데이터를 채워 넣는 식으로 supersede 예정 — 후보:

- **자체 분류** — Daily Trends RSS(여전히 동작)의 키워드를 우리 매체 매칭·매체 카테고리 majority로 ADR-0008 카테고리에 추론. 무리스크.
- **Wikipedia Pageviews** — 한국어/영문 위키 어제 top, 무료·무인증·안정. 카테고리별이 아니라 "지식 관심사" 차원.
- **분야별 별도 source** — Hacker News Top(Tech), Reddit r/* (Entertainment 등), YouTube Data API.
- **Naver DataLab** — 한국 검색·쇼핑 한정 강력. OAuth 등록 1회 필요(무료).

## Alternatives Considered (대안)

- **Daily Trends + cat 파라미터**: `dailytrends?cat=N` 의 숫자 카테고리. 형태가 키워드 단위라 기존 코드와 호환은 좋지만, story 클러스터의 부가 데이터(entityNames, 다중 기사)를 잃음.
- **둘 다 (real-time + daily) 동시 운영**: 데이터 더 풍부하지만 snapshot 크기·cron 시간 부담. 일단 real-time만.
- **공식 RSS만 유지**: 정치 편향·구조 부족 문제 그대로. 운영자 요구 미충족.
- **Naver DataLab으로 한국 부분 강화**: 별도 운영자 가입 필요(OAuth). 본 ADR 결정에서 일단 보류. 추후 supersede 가능.

# ADR-0042: 사이트 내 검색 — 빌드타임 인덱스 + 클라이언트 필터 + SearchAction

- Status: Accepted
- Date: 2026-06-10
- Deciders: yusik
- Related: [ADR-0002](./0002-frontend-nextjs-static-export.md), [ADR-0028](./0028-keyword-detail-aggregation.md), [ADR-0040](./0040-seo-structured-data-og-image.md)

## Context (배경)

고도화 로드맵 Tier 4(제품 기능)의 첫 항목. 후보는 검색 / 뉴스레터 / i18n. 정적 사이트(`output: 'export'`, Cloudflare) 제약에서 ROI 를 비교:

- **검색** — 빌드타임 JSON 인덱스 + 클라이언트 필터로 **서버 없이 100% 정적 호환**. UX 직접 개선 + ADR-0040 에서 보류한 JSON-LD `SearchAction`(sitelinks 검색창) 해금. 외부 의존·비용 0.
- **뉴스레터** — 외부 발송 인프라·계정·동의관리 필요 + 독자 선행(닭-달걀). AdSense 미승인 단계라 시기상조.
- **i18n** — `output:export` 가 Next 내장 i18n 미지원(수동 로케일 라우팅) + 콘텐츠가 한국 중심이라 영어권 적합성 의문. 표면 큼.

→ 운영자 결정(2026-06-10, AskUserQuestion): **검색 먼저.**

기존에 `/k/[keyword]`(트렌드 키워드 통합 카드, ADR-0028)·`/c/[category]` 페이지가 정적 생성돼 있어, 검색은 이들로 가는 내부 내비 + 외부 기사 링크의 진입점이 된다.

## Decision (결정)

### 1. 검색 인덱스 — 빌드타임 생성, 페이지에 임베드 (`src/lib/search.ts`)

- `buildSearchIndex(snapshot)` 순수 함수 — 최신 스냅샷에서 **키워드(/k) + 카테고리(/c) + 기사(외부 링크)** 3종 `SearchDoc[]` 생성. 키워드는 소문자 기준·기사는 id 기준 중복 제거(top 버킷은 타 카테고리 재집계라 중복).
- 인덱스는 `/search` 서버 컴포넌트가 빌드타임에 만들어 클라이언트 컴포넌트 prop 으로 임베드(별도 fetch·런타임 없음).

### 2. 검색 스코어 — 클라이언트, 정규화는 검색 시점 (`searchDocs`)

- `exact(100) > prefix(60) > title-includes(40) > haystack-includes(20) > all-tokens(15)` + type 가중(keyword 6 > category 4 > article 0) + 짧은 제목 보너스. 빈/공백 query 는 빈 결과.
- 정규화(`NFC`+lowercase+trim)는 **검색 시점**에 — 인덱스를 가볍게 유지(제목/url/type/subtitle/category 만 직렬화).

### 3. UI

- **`/search` 페이지** (`SearchClient`, client) — 입력 + 그룹 결과(키워드/카테고리/뉴스). 키워드·카테고리는 내부 `<Link>`, 기사는 외부 `<a target=_blank>`.
- **`?q=` 진입값은 마운트 시 `window.location.search` 에서 읽음** — `useSearchParams` 를 쓰지 않음(아래 Consequences). 입력 시 `router.replace` 로 주소창 디바운스 동기화(공유·SearchAction 랜딩 재현).
- **헤더 검색박스**(`SearchBox`) — 데스크탑 인라인 폼(제출 → `/search?q=`), 모바일은 헤더 우측 검색 아이콘 링크.

### 4. JSON-LD `SearchAction` (`src/lib/jsonld.ts`)

- 루트 `WebSite` 노드에 `potentialAction` SearchAction 추가 — `target.urlTemplate = ${SITE_BASE}/search/?q={search_term_string}`. **ADR-0040 에서 "검색 엔드포인트 부재"로 보류했던 항목을 이제 활성화.** trailingSlash 정합으로 `/search/?q=`.
- `/search` 는 sitemap 등재 + breadcrumb(홈 > 검색).

## Consequences (결과)

**긍정**

- 서버·외부 의존·비용 0 — 정적 사이트에 완전 부합. 일일 스크레이프 후 빌드 시 인덱스 자동 갱신.
- 키워드·카테고리·뉴스 한 곳에서 탐색 → 체류·내부 순회 ↑.
- `SearchAction` 해금 → 구글 sitelinks 검색창 후보(ADR-0040 미완 항목 종료).
- 순수 함수(`buildSearchIndex`/`searchDocs`) 분리 → 단위 테스트 8종(56→64). 결정적.

**부정 / 트레이드오프**

- **`useSearchParams` 대신 `window.location`** — useSearchParams 는 `output:export` 에서 Suspense·fallback 을 강제해 정적 HTML 이 fallback 만 출력(검색 UI 부재·플래시). 마운트 시 `window.location.search` 를 읽어 **검색 UI 가 정적 HTML 에 그대로 포함**되도록 함(SEO·무플래시). 대가: 초기 1 tick 동안 q=''(서버/클라 일치, 미스매치 없음) 후 URL 반영.
- **인덱스가 `/search` HTML 에 임베드** → 페이지 크기가 일일 기사 수에 비례(현재 ~380KB, gzip 후 대폭 축소, `/search` 방문 시에만 로드). 홈·타 페이지엔 영향 없음.
- 검색 범위 = **최신 스냅샷만**(과거 일자 미포함). /k 도 최신 트렌드만 생성되므로 정합. 다일 검색은 후속.

**중립**

- 클라이언트 substring/token 스코어(외부 검색 라이브러리 미사용) — 인덱스가 작고 한/영 substring 이 핵심이라 무의존이 번들·정확도 우위. 규모 커지면 MiniSearch 등 재고.

## Alternatives Considered (대안)

- **뉴스레터 / i18n** — 위 Context 의 ROI 비교로 후순위(운영자 결정).
- **MiniSearch/Fuse 등 클라이언트 검색 라이브러리** — 번들 가중 + 한글 substring 엔 과함. 무의존 핸드롤 스코어로 시작.
- **별도 `search-index.json` 정적 파일 + 런타임 fetch** — 캐시 분리 이점 있으나 추가 요청·라우트. MVP 는 페이지 임베드로 단순화(방문 시에만 비용).
- **`useSearchParams` + Suspense** — 관용적이나 정적 출력이 fallback 만 → 검색 UI 가 HTML 에 부재. 기각.

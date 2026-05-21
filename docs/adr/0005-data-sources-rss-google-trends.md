# ADR-0005: 데이터 소스는 RSS + Google Trends RSS

- Status: Accepted
- Date: 2026-05-21
- Deciders: yusik
- Related: [ADR-0004](./0004-data-storage-git-json.md), [ADR-0006](./0006-scheduling-github-actions-cron.md)

## Context (배경)

뉴스 헤드라인 + 트렌딩 키워드의 원천을 어디서 가져올지 정해야 한다. 후보:

### 뉴스 헤드라인

1. **RSS 피드** — 매체가 공식 제공. 안정적, robots.txt 위반 없음. 한계: RSS 없는 매체는 못 받음.
2. **HTML 스크래핑** (cheerio/puppeteer) — RSS 없는 매체도 가능. 단점: selector 유지보수, 매체별 차단 위험, 법적 회색지대.
3. **상용 API** (NewsAPI, MediaStack 등) — 통합 깔끔. 무료 tier 좁고 헤드라인 길이/사용 제한 있음.

### 트렌딩 키워드

1. **Google Trends RSS** (`daily / realtime`) — 공식 RSS 형식. 국가별 트렌드 받기 쉽다.
2. **자체 추출** — 수집한 헤드라인 빈도 + TF-IDF. 외부 의존 0이지만 "사람들이 검색하는" 신호와 다름.
3. **Twitter / X 트렌딩** — API 유료, 정책 변동성 큼.
4. **Naver DataLab** — 한국 한정으로는 좋지만 OAuth 필요 + quota.

사용자 사전 선호: "RSS + Google Trends API".

## Decision (결정)

### 뉴스 헤드라인
- **공식 RSS만 사용**한다. HTML 스크래핑·헤드리스 브라우저는 v1 범위에서 도입하지 않는다.
- 소스 정의는 `scraper/sources.ts` 에 선언적으로 둔다.
  ```ts
  type Source = {
    id: string;           // e.g. "bbc-world"
    name: string;         // e.g. "BBC News - World"
    url: string;          // RSS URL
    category: CategoryId; // 우리 카테고리 ID
    lang: 'ko' | 'en';
    weight?: number;      // 카테고리 내 우선순위
  };
  ```
- 국내·해외 합쳐 **10~15개**로 출발. 빠지는 매체는 PR로 추가.

### 트렌딩 키워드
- **Google Trends RSS**를 1차 신호로 쓴다.
  - Daily trends: `https://trends.google.com/trending/rss?geo=KR` (예시)
  - Daily trends global: `https://trends.google.com/trending/rss?geo=US` 등 영어권 1개를 글로벌 대리로 사용 또는 다중 geo 합산.
- **자체 헤드라인 빈도 추출**은 보조 신호로 병행한다 (Google Trends RSS가 차단/포맷 변경됐을 때의 fallback + 자체 시각화 재료).
- 두 신호는 `trends.json`에서 별도 필드(`google`, `derived`)로 보존한다.

## Consequences (결과)

**긍정**
- RSS만 쓰니 법적/운영적 리스크가 가장 낮다.
- Google Trends RSS는 무인증, 무료, 카테고리/지역 분리 깔끔.
- 자체 추출과 외부 신호를 동시에 보존 → 한쪽 막혀도 다른 쪽으로 운영 가능.

**부정**
- RSS 없는 매체는 못 다룬다 (예: 일부 한국 신문사는 RSS 약함). → 매체 다양성에 한계.
- Google Trends RSS는 **비공식 API**에 가깝다. Google이 포맷을 바꾸거나 막을 수 있음. → 어댑터 함수로 격리해 교체 비용을 최소화.
- "사람들이 클릭하는" 진짜 신호(소셜 트렌드)는 못 잡는다 → 추후 ADR로 확장 검토.

**중립**
- 카테고리 매핑은 매체별 RSS 분류와 우리 카테고리(§5)를 매핑하는 테이블로 흡수.
- RSS의 `pubDate`가 부정확한 매체가 있음 → 정규화 시 `min(pubDate, fetchedAt)` 또는 매체별 보정.

## Alternatives Considered (대안)

- **NewsAPI**: 단일 API로 통합 편리하지만, 무료 tier가 매우 좁고(개발 전용) 헤드라인 텍스트 일부만 반환됨.
- **Puppeteer 기반 스크래핑**: 차단/CAPTCHA 대응 비용 크고, Cloudflare Pages 빌드 환경에서 다루기 까다로움.
- **Naver DataLab / Daum 실검 (구)**: 한국 한정 신호로 강하지만 인증·정책 변동성·복구 가능성 부담.
- **Twitter API v2**: 유료. 정책 변동성 큼.

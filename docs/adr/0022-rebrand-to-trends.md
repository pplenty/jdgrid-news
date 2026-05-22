## ADR-0022: 브랜드 재정의 — `news` → `trends` (도메인·정체성·페이지 구조·별자리 모티프)

- Status: Accepted
- Date: 2026-05-22
- Deciders: yusik
- Supersedes (부분): [ADR-0012](./0012-domain.md) 도메인 결정 / [ADR-0021](./0021-trend-as-main-hero.md) 메인 비중 결정
- Related: [ADR-0009](./0009-ui-layout-sidebar.md), [ADR-0015](./0015-ui-implementation-details.md)

## Context (배경)

ADR-0021로 메인 페이지를 "트렌드 hero"로 재배치하고 운영자가 "트렌드 기능이 너무 좋다, 메인 기능으로 고도화"를 요청. 실제 데이터 풍부화(ADR-0016/0018/0019/0020)로 사이트 정체성이 **헤드라인 인덱스 → 트렌드 대시보드** 쪽으로 무게중심이 이동했음.

운영자 결정 (2026-05-22):
1. 탑스토리(헤드라인)를 메인에서 분리 → 별도 페이지로.
2. 도메인 `news.jdgrid.com` → **`trends.jdgrid.com`**.
3. 사이트명 `news` → **`trends`**, 메타·로고 모두 치환.
4. 정체성에 어울리는 **별자리(constellation) 컨셉** 디자인 모티프 도입.
5. iTunes Korea 차트 (음악·앱) 추가 (추천 source).

jdgrid 패밀리(`jdgrid.com`, `yutils.jdgrid.com`, `trading.jdgrid.com`) 톤 (2026-05-22 분석):
- 소문자 산세리프 텍스트 로고, 심볼 없음.
- 라이트 모드 기본, 미니멀, 유틸리티 중심.
- 그리드 함축(`*grid*`)하지만 시각적 모티프는 미사용.

`trends`만의 차별점으로 **별자리(별·점·연결선)** 를 더한다 — "데이터 포인트 사이를 잇는 패턴"이라는 사이트 의도와 직결.

## Decision (결정)

### 1. 도메인

- 운영 도메인: **`https://trends.jdgrid.com`** (Cloudflare Pages 커스텀 도메인 변경, DNS 갈아끼우기).
- ADR-0012의 `news.jdgrid.com` 결정 supersede.
- GitHub repo 이름(`jdgrid-news`)은 유지 — GitHub redirect 자동, 비용 0.

### 2. 사이트명·메타

- 사이드바·헤더 로고: **`trends`** (소문자, jdgrid 패밀리 일관).
- `<title>`: `trends — 오늘의 인사이트` (또는 비슷).
- `metadataBase`: `https://trends.jdgrid.com`.
- `User-Agent` (scraper): `jdgrid-trends/0.1 (+https://trends.jdgrid.com)`.
- About 페이지 자기 호칭 `news는` → `trends는`.

### 3. 페이지 구조 재편

| 경로 | 내용 | 변화 |
| - | - | - |
| `/` | **트렌드 전용** — TrendingHero + Wikipedia + Naver Shopping + iTunes Korea | 헤드라인 제거 |
| `/headlines` (신설) | TOP STORIES + 카테고리별 4-카드 그리드 (× 7) | 기존 메인의 헤드라인 부분 이전 |
| `/c/[category]` | 카테고리별 헤드라인 전체 (그대로) | 변화 없음 |
| `/k/[keyword]` | 키워드 매칭 기사 (그대로) | 변화 없음 |
| `/trends` | 카테고리별 trend story 상세 (그대로) | 변화 없음 |
| `/d/[date]` | 과거 일자 메인 (그대로) | 변화 없음 |
| `/about` | 출처·면책·연락처 (자기 호칭만 갱신) | 텍스트 변경 |

사이드바 메뉴 재편:
- 상단: 로고 `trends`
- "오늘" 섹션: 홈(/), Headlines(/headlines), Trends 상세(/trends)
- "카테고리" 섹션: 8 카테고리 (그대로, /c/* 헤드라인 카테고리)
- "트렌딩" 섹션: TrendBlock (그대로)
- 하단: About

### 4. 별자리 디자인 모티프

- **로고**: `trends` 텍스트 + 좌측에 작은 별자리 SVG(점 3~4개 + 연결선).
- **파비콘**: 같은 별자리 SVG (16/32px). `public/favicon.svg` 단일 SVG로.
- **악센트 컬러**: 기존 파랑(`#3b82f6`) → **인디고/네이비** (`#4f46e5` 또는 `#6366f1`) — "별빛/밤하늘" 인상 강화.
- **배경 액센트**: 메인 hero의 gradient를 인디고 톤으로.
- **다크 모드**: 시스템 follow 유지 (ADR-0009). 다크 모드에서 별자리 모티프가 더 살아남.
- 다른 페이지·컴포넌트는 톤 그대로.

### 5. iTunes Korea 차트 (신규 source)

- Apple `rss.applemarketingtools.com/api/v2/kr` — 음악(`most-played/25/songs`) + 앱(`top-free/25/apps`).
- 무료·무인증·매우 안정.
- 데이터: `feed.results[].name / artistName / artworkUrl100 / url`.
- 메인 페이지에 새 섹션 `🎵 Korea Music & Apps`.
- `snapshot.trends.itunes?: { music: ItunesTrend[]; apps: ItunesTrend[] }`.

### 6. 정체성에 대한 부수 결정

- **ADR-0007(콘텐츠 정책)은 그대로 유지** — 5필드(title/summary/url/source/imageUrl) 원칙, 본문 저장 금지. "트렌드"가 메인이라도 콘텐츠 정책 변화 없음.
- iTunes 데이터도 같은 5필드 원칙 — `feed.results[]`의 name/artistName/artworkUrl100/url만 저장.

## Consequences (결과)

**긍정**
- 사이트 정체성이 명확해짐 — "오늘의 한국·세계 트렌드 인사이트".
- 트렌드 vs 헤드라인 분리로 메인 첫 인상 더 깔끔.
- 별자리 모티프가 다른 jdgrid 패밀리와 차별점 — `trends`만의 시각 정체성.
- iTunes Korea로 음악·앱 차원 추가, 검색·뉴스와 다른 신호.
- 인디고 톤으로 사이트 인상이 "신뢰감 있는 데이터 사이트"에 더 가까워짐.

**부정**
- 도메인 변경 — DNS·Cloudflare Pages 커스텀 도메인 갈아끼우기 필요 (사용자 작업).
- GitHub repo 이름(`jdgrid-news`)과 도메인(`trends.jdgrid.com`) 불일치. redirect로 해결되지만 일관성 약화. repo rename 권장 (사용자 결정).
- 헤드라인 페이지 분리로 SEO 영향 — 기존 `/` URL이 헤드라인을 안 줌. `/headlines`로 redirect 또는 사이드바 노출로 흡수.
- ADR-0012 / ADR-0021 부분 supersede — 향후 ADR 트레이스 시 두 흐름 추적 필요.

**중립**
- 별자리 컨셉은 "subtle" 모티프 — 너무 화려하면 jdgrid 패밀리 톤과 충돌. 로고+파비콘만 시작.
- iTunes는 영문 콘텐츠 비중도 있음 (artist name 영문). 한국 사용자엔 자연.

## Alternatives Considered (대안)

- **도메인 유지(`news.jdgrid.com`) + 사이트명만 변경**: URL이 사이트 정체성과 어긋남. 새 사용자가 "왜 news인지" 의문.
- **트렌드를 별도 도메인(`trends.jdgrid.com`)에 두고 `news.jdgrid.com`은 헤드라인으로 분리**: 두 사이트 운영. 1인 운영엔 부담.
- **별자리 대신 다른 모티프 (그래프 라인, 시계열 곡선 등)**: 의미는 더 직접적이지만 "trends"라는 단어가 이미 그 의미. 별자리는 더 추상·정체성 강함.
- **모든 페이지 통합 (탑스토리도 메인에 유지)**: 운영자 명시 "탑스토리 분리".
- **iTunes 대신 Steam·GitHub Trending**: 한국 사용자 친화도 ↓. iTunes가 우선.

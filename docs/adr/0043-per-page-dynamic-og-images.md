# ADR-0043: 페이지별 동적 OG 이미지 — 빌드타임 생성 + 한글 폰트 devDependency

- Status: Accepted
- Date: 2026-07-14
- Deciders: yusik
- Related: [ADR-0002](./0002-frontend-nextjs-static-export.md), [ADR-0028](./0028-keyword-detail-aggregation.md), [ADR-0040](./0040-seo-structured-data-og-image.md)

## Context (배경)

ADR-0040 은 루트 공통 OG 이미지 1장(`next/og` ImageResponse, 빌드타임 정적 생성)만 도입했고, **페이지별 동적 OG(키워드 삽입)는 후속으로 보류**했다. 이후 /k·/c·/d 에 페이지별 메타데이터(title/description/canonical)가 깔리면서(커밋 a9b37ec), 공유 시 노출되는 이미지도 페이지 내용을 반영하면 공유 CTR 을 증폭할 수 있는 상태가 됐다.

제약 두 가지:

1. **한글 렌더링** — 루트 OG 는 폰트 의존을 피하려 영문 브랜드 텍스트만 썼다. 키워드/카테고리는 한글이라 satori(ImageResponse 내부 엔진)에 한글 글리프 폰트 데이터를 공급해야 한다. satori 는 **woff2 를 읽지 못한다**(ttf/otf/woff만) — 사이트가 CDN 에서 쓰는 dynamic-subset woff2 를 재사용할 수 없다.
2. **빌드 비용** — `output: 'export'` 라 모든 이미지는 빌드타임 생성. 장수는 /k ≈40 · /c 9 · /d ≤90 = 빌드당 ~140장.

→ 운영자 결정(2026-07-13, AskUserQuestion): **폰트는 npm devDependency / 적용 범위는 /k·/c·/d 전부 / 신규 ADR 로 기록.**

## Decision (결정)

### 1. 폰트 소싱 — `pretendard` devDependency, node_modules 에서 OTF 로드

- `pretendard` 패키지를 devDependency 로 추가하고, 빌드타임에 `node_modules/pretendard/dist/public/static/Pretendard-Bold.otf`(1.5MB)를 `fs.readFile` 로 로드(모듈 스코프 캐시 — 빌드 워커당 1회).
- repo 무변(폰트 파일 커밋 없음), lockfile 버전 고정, 오프라인 빌드 유지. 사이트 본문과 동일 서체(Pretendard)로 브랜드 일관.

### 2. 공용 템플릿 (`src/lib/og-template.tsx`) — 루트 OG 와 같은 브랜드 룩

- `renderOgImage({ badge, title, subtitle })` — 다크 배경 + 브랜드 로우 + 액센트 배지 + 대형 타이틀 + 도메인. 세 라우트가 공유.
- 타이틀 길이별 폰트 크기 단계 축소 + 48자 말줄임(`src/lib/og-text.ts`, 단위 테스트).

### 3. 적용 라우트 — /c·/d 는 파일 컨벤션, /k 는 라우트 핸들러

- **/c·/d**: 세그먼트별 `opengraph-image.tsx` 파일 컨벤션. `output: export` 에선 이미지 라우트에도 **자체 `generateStaticParams` export 필수**. og/twitter 이미지 태그·캐시버스터 해시 자동 주입.
- **/k**: 파일 컨벤션 사용 불가 — **Next 가 인코딩이 필요한 동적 파라미터(한글·공백)의 og:image URL 을 이중 인코딩**(`%EA…` → `%25EA…`, `%20` → `%2520`)해 크롤러가 404 를 받는다(ADR-0028 이중 인코딩 버그와 같은 계열, 이번엔 메타데이터 URL 생성기 쪽). 대신:
  - 정적 **라우트 핸들러** `src/app/og/k/[keyword]/route.ts`(`force-static` + generateStaticParams)가 PNG 생성 — 출력 경로는 페이지와 동일하게 raw UTF-8 디렉토리.
  - `/k` 의 `generateMetadata` 가 `openGraph.images`/`twitter.images` 를 **수동 참조** — URL 인코딩을 우리가 제어(단일 `encodeURIComponent`, 라이브 검증된 페이지 라우팅과 동일 패턴). 캐시버스터는 `?v=<스냅샷 날짜>`(내용이 매일 갱신).
- /k 세그먼트의 `generateStaticParams`/`decodeKeyword` 는 `params.ts` 로 추출해 page 와 라우트 핸들러가 공유(이중 인코딩 회귀 방지 로직 단일화).

### 4. 콘텐츠

- **/k**: 배지 "오늘의 검색 트렌드" + 키워드 + `검색량 {traffic} · {날짜}`.
- **/c**: 배지 "카테고리 트렌드" + 한글 라벨 + `{영문 라벨} · 오늘의 헤드라인`.
- **/d**: 배지 "트렌드 다이제스트" + 한국어 날짜 + 고정 설명.

## Consequences (결과)

**긍정**

- 공유(카카오/슬랙/X 등) 시 페이지 내용이 이미지에 반영 — 페이지별 메타데이터(a9b37ec)와 합쳐 공유 CTR 레버 완성. ADR-0040 보류 항목 종료.
- 빌드 +수초 수준(~140장, 전체 빌드 ~17s), 외부 의존·런타임 비용 0.
- 한글 OG 렌더링 기반 확보 — 루트 OG 도 향후 한글 카피 가능(현행 유지).

**부정 / 트레이드오프**

- **메커니즘 이원화** — /c·/d(파일 컨벤션) vs /k(라우트 핸들러 + 수동 참조). Next 의 비-ASCII 파라미터 이중 인코딩이 고쳐지면 /k 도 파일 컨벤션으로 회귀 가능. 코드 주석 + 본 ADR 로 근거 고정.
- OTF 1.5MB 를 빌드마다 읽음(워커당 1회 캐시) — 무시 가능.
- /d 는 날짜 수만큼(≤90) 거의 동일한 이미지 — 낭비로 보이나 장당 ~30KB·빌드타임 생성이라 비용 미미, 날짜가 박혀 공유 맥락은 정확.

**중립**

- 확장자 없는 PNG 파일(`opengraph-image`, `og/k/<키워드>`) — Cloudflare 가 `image/png` 로 서빙함을 루트 OG 라이브 헤더로 확인.
- Bold(700) 단일 웨이트만 로드 — 배지/서브타이틀도 700, 색·크기로 위계 표현.

## Alternatives Considered (대안)

- **repo 에 폰트 커밋** — 자급자족이지만 1.5MB repo 증가. devDependency 로 동일 효과(운영자 결정으로 기각).
- **빌드타임 CDN fetch** — repo·의존성 무변이나 빌드가 네트워크 의존(CDN 장애 = 빌드 실패). 기각.
- **영문/로마자만 렌더** — 폰트 문제는 피하나 한글 키워드가 핵심 콘텐츠라 목적 훼손. 기각.
- **/k만 적용** — 가치는 /k 가 최대지만 템플릿 공유로 /c·/d 추가 비용이 미미해 전부 적용(운영자 결정).
- **후처리 스크립트로 이중 인코딩 HTML 치환** — 파일 컨벤션 유지 가능하나 빌드 파이프라인에 취약한 문자열 치환 단계 추가. 라우트 핸들러가 Next 공식 메커니즘 안에서 해결. 기각.

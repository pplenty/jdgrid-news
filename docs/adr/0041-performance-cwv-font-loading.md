# ADR-0041: 성능 / Core Web Vitals — 비차단 폰트 로딩 + content-visibility

- Status: Accepted
- Date: 2026-06-10
- Deciders: yusik
- Related: [ADR-0002](./0002-frontend-nextjs-static-export.md), [ADR-0009](./0009-ui-layout-sidebar.md), [ADR-0015](./0015-ui-implementation-details.md), [ADR-0040](./0040-seo-structured-data-og-image.md)

## Context (배경)

Tier 2 SEO(ADR-0040)로 오가닉 유입 기반을 깔았다. 다음 레버는 **Core Web Vitals** — 검색 랭킹 요소이자 이탈률 직결. 오가닉 트래픽은 모바일·느린 회선 비중이 크므로 CWV(LCP/CLS/INP)가 실제 체감과 순위를 좌우한다.

빌드 베이스라인 측정 결과 **JS는 이미 매우 가벼움**:

- First Load JS 공유 102 kB, 페이지별 176 B ~ 807 B (거의 전부 서버 렌더, 클라이언트 컴포넌트는 Sidebar/Header/Theme 3개뿐).
- 이미지 `<img>` 8곳 **전부** 부모에 크기 예약(`aspect-square`/`aspect-video`/`h-N w-N`) + `loading="lazy"` + `decoding="async"` → **이미지發 CLS 리스크 사실상 0**.

즉 번들·이미지는 손댈 게 없고, 남은 진짜 병목은 둘:

1. **렌더 블로킹 외부 폰트 CSS** — Pretendard dynamic-subset 을 `cdn.jsdelivr.net` 에서 동기 `<link rel="stylesheet">` 로 로드. 텍스트 중심 한글 사이트라 LCP 요소가 대개 큰 텍스트 → 이 cross-origin CSS 가 첫 페인트를 직접 막음(preconnect 는 이미 있었음). 느린 모바일에서 수백 ms.
2. **죽은 FOUT 메커니즘** — `globals.css` 의 `body:not(.fonts-loaded)` 자간 보정이 있으나 `.fonts-loaded` 클래스를 **아무도 안 붙임** → 반쪽 구현. (의도: 폰트 교체 시 reflow 완화)
3. **긴 대시보드의 초기 렌더 비용** — 화면 밖 섹션들(위키/iTunes/YouTube/HN/Reddit/네이버)도 초기에 전부 레이아웃·페인트.

## Decision (결정)

> 운영자 결정 (2026-06-10, AskUserQuestion): 폰트 로딩 전략 = **비차단(non-blocking) + FOUT 스왑**. 현 dynamic-subset(한글 글리프만 다운로드, 바이트 최소) 유지하되 렌더 블로킹 제거.

### 1. 비차단 폰트 로딩 + FOUT 스왑 (`layout.tsx`)

- `<link rel="preload" as="style">` 로 파서가 폰트 CSS 를 **일찍 고우선 다운로드 시작**.
- 인라인 `FONT_LOAD_SCRIPT` 가 `<link rel="stylesheet" media="print">` 를 동적 첨부 → `onload` 시 `media='all'` 로 스왑. **첫 페인트는 시스템 폴백**(Apple SD Gothic Neo / 맑은 고딕)으로 즉시 → Pretendard 로 교체.
- 폰트 실제 로드 완료 시(`document.fonts.ready`) `document.body.classList.add('fonts-loaded')` → 기존 자간 보정 해제 메커니즘이 **비로소 살아남**(FOUT 중 자간 -0.003em, 교체 후 해제로 reflow 완화).
- `<noscript>` 폴백: JS 비활성 환경에서만 동기 `<link rel="stylesheet">`.
- **트레이드오프**: 콜드 로드마다 짧은 FOUT(시스템 폰트 → Pretendard). 한글 시스템 폰트가 Pretendard 와 시각적으로 가깝고 폴백 체인·자간 보정으로 완화되어 수용. 대신 FCP/LCP 최대 개선.

### 2. `content-visibility: auto` — 화면 밖 섹션 렌더 지연 (`globals.css` + `page.tsx`)

- `.cv-auto { content-visibility: auto; contain-intrinsic-size: 0 520px; }` 유틸.
- 메인의 **명백히 화면 밖** 섹션(위키 이하)에 적용. 브리핑·TrendingHero·Movers 는 above-fold 라 eager 유지.
- `intrinsic-size` 는 스크롤 점프 방지용 높이 추정치. **콘텐츠는 DOM 에 그대로** → 검색 색인·접근성 영향 없음(페인트만 지연).

### 3. CLS — 현행 유지

- 이미지 크기 예약이 이미 전수 적용되어 있어 추가 작업 불요. 본 ADR 에서 검증·문서화만.

## Consequences (결과)

**긍정**

- 폰트 CSS 가 첫 페인트를 막지 않음 → FCP/LCP 개선(특히 느린 모바일). 텍스트 즉시 표시.
- 살아난 `.fonts-loaded` 로 FOUT 중 자간 보정 → 교체 reflow 완화.
- `content-visibility` 로 긴 대시보드의 초기 레이아웃/페인트·메인스레드 비용 절감 → LCP/INP/TBT 도움.
- JS 번들 증가 0(인라인 스크립트 수백 바이트), 외부 호출 0, 빌드타임 비용 0.

**부정**

- **FOUT** — 콜드 로드마다 짧은 폰트 깜빡임. (운영자 수용 결정)
- `content-visibility:auto` 의 화면 밖 콘텐츠는 **즉시 풀페이지 스크린샷·인쇄 시 빈칸**으로 잡힐 수 있음(페인트 타이밍 아티팩트). 실제 스크롤 사용자·크롤러(DOM)·소셜 OG(별도 생성 이미지)는 영향 없음.
- `intrinsic-size` 추정치(520px)와 실제 섹션 높이(480~693px) 차이로 첫 렌더 전 스크롤바 위치 미세 추정. 렌더 후 정정.

**중립**

- dynamic-subset 유지 결정 → self-host(next/font, ~1MB+ variable woff2)는 한글 전체 커버 시 바이트가 더 커 기각. cross-origin 연결은 preconnect 로 완화.

## Verification (검증)

배포 전 로컬 빌드 + 실제 헤드리스 브라우저(gstack browse) 도그푸딩:

- 빌드 OK, First Load JS 불변(106 kB). 동기 jsdelivr stylesheet = 1개(전부 `<noscript>` 내부). preload 1개.
- 폰트 스왑: jsdelivr 링크 `media` 가 `print`→`all` 로 전환됨, `document.fonts.check('16px Pretendard')=true`, 92 폰트페이스 로드, `body.fonts-loaded=true`, body 계산 폰트=Pretendard. **콘솔 에러 0**.
- `content-visibility`: 스크롤 시 4개 cv-auto 섹션 정상 페인트(offsetHeight 480~693px, 실제 콘텐츠). 모바일·데스크탑 레이아웃 정상, CLS 없음.
- typecheck/lint 클린, 테스트 56/56 통과.

## Alternatives Considered (대안)

- **self-host (next/font/local)** — same-origin + 자동 preload + font-display:swap 로 cross-origin·FOUT 최소화하나, 전체 한글 커버 variable woff2 가 ~1MB+ → dynamic-subset(필요 글리프만) 대비 첫 다운로드 바이트가 더 큼. 모바일 불리로 기각.
- **현행 렌더 블로킹 유지** — FOUT 0 이나 외부 CSS 가 FCP/LCP 를 직접 막음. CWV 목표와 배치되어 기각.
- **페이지별/섹션별 더 공격적인 `content-visibility`** — above-fold 까지 적용 시 LCP 손해·아티팩트 확대. 화면 밖만 보수적으로 적용.

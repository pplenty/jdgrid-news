# ADR-0002: 프론트엔드는 Next.js (App Router) + Static Export

- Status: Accepted
- Date: 2026-05-21
- Deciders: yusik
- Related: [ADR-0003](./0003-hosting-cloudflare-pages.md), [ADR-0004](./0004-data-storage-git-json.md)

## Context (배경)

대시보드 페이지는 다음 특성을 가진다.

- **갱신 주기**: 매일 1~2회. 실시간 SSR이 필요하지 않다.
- **데이터 출처**: 빌드 시점에 `data/*.json`을 읽으면 충분 (ADR-0004).
- **상호작용**: 필터링/탭/검색 정도. 단순한 클라이언트 인터랙션.
- **SEO**: 검색 유입을 노리려면 정적 HTML이 유리.
- **운영자**: 1인. 인프라 복잡도는 곧 비용.

후보 프레임워크:

1. **Next.js (App Router) + `output: 'export'`** — 정적 HTML 생성, 필요시 클라이언트 컴포넌트로 인터랙션.
2. **Astro** — 정적 사이트 친화적이지만 React 컴포넌트 표준화에 추가 학습.
3. **순수 Vite + React** — 가볍지만 라우팅·SEO·이미지 등 직접 구현.
4. **Next.js + SSR/ISR** — 데이터가 빌드 시점에 결정되는 우리 케이스에서는 과잉.

## Decision (결정)

- **Next.js 15 (App Router) + TypeScript + Tailwind**를 사용한다.
- `next.config.ts`에 `output: 'export'`를 설정해 **정적 export** 모드로 빌드한다.
- 동적 라우트 (`/c/[category]`, `/d/[date]`, `/k/[keyword]`)는 `generateStaticParams`로 빌드 시점에 모든 경로를 생성한다.
- 이미지는 외부 호스트 그대로 `<img>` 또는 `next/image`의 `unoptimized` 옵션을 사용 (Cloudflare Pages의 이미지 최적화 별도 구성은 v1 이후).
- 클라이언트 인터랙션 (탭, 키워드 클릭 등)은 `'use client'` 컴포넌트로 격리.

## Consequences (결과)

**긍정**
- 빌드 산출물이 순수 정적 파일 → 어떤 정적 호스팅에든 올릴 수 있음 (이식성).
- SSR 인프라 불필요 → 운영 비용·복잡도 0.
- 빌드 시점에 모든 페이지가 결정되므로 캐시 무력화 이슈 없음.
- TypeScript + App Router로 컴포넌트 분리·타입 안정성 확보.

**부정**
- SSR/ISR을 못 씀 → 향후 실시간 데이터를 원하면 마이그레이션 비용.
- `next/image`의 동적 최적화 불가. 외부 이미지 그대로 사용 시 LCP 손해 가능.
- API 라우트(`app/api/*`)도 export 모드에선 빌드 안 됨 → 모든 데이터 가공은 빌드 전 scrape 단계에서 처리.

**중립**
- App Router의 RSC 비동기 컴포넌트는 export 모드에서도 동작 (빌드 시점 평가).
- 클라이언트 사이드 검색/필터링은 빌드된 JSON을 fetch하는 식으로 구현.

## Alternatives Considered (대안)

- **Astro**: 정적 사이트의 정답에 가깝지만, React 생태계(특히 차트/시각화 라이브러리)와의 친화도, 그리고 본인이 익숙한 스택을 우선했다.
- **순수 Vite + React Router**: 라우팅/SEO/메타데이터를 직접 구성해야 하고, 빌드 시점에 정적 경로 생성하는 패턴도 보일러플레이트가 많다.
- **Next.js + ISR (Vercel)**: 실시간 갱신이 필요하지 않은데 굳이 ISR을 도입하면 캐시 무효화·revalidate 시점을 또 결정해야 한다 — 단순함을 잃는다.
- **Hono + 정적 빌드**: 흥미롭지만 본 프로젝트의 페이지 수/복잡도 대비 오버킬.

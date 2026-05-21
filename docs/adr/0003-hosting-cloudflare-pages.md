# ADR-0003: 호스팅은 Cloudflare Pages

- Status: Accepted
- Date: 2026-05-21
- Deciders: yusik
- Related: [ADR-0002](./0002-frontend-nextjs-static-export.md), [ADR-0006](./0006-scheduling-github-actions-cron.md)

## Context (배경)

ADR-0002에서 결정한 Next.js static export 산출물(`out/`)을 어디에 올릴지 결정해야 한다. 요구사항:

- **무료 또는 매우 저렴**할 것. (1인 운영, 트래픽 예측 불가).
- **글로벌 응답 속도**가 빠를 것. (해외 외신을 다루는 사이트이므로 해외 방문자도 가정).
- **GitHub 연동 자동 배포**가 가능할 것. (`main` push → 자동 빌드).
- 정적 자산 외에 추후 가벼운 동적 기능(예: 검색 API, 이미지 프록시)을 붙일 가능성.

후보:

1. **Cloudflare Pages** — 무제한 대역폭, 글로벌 CDN, Workers 연계로 동적 기능 가능. Build minutes 500/월.
2. **Vercel** — Next.js의 native 플랫폼. 무료 tier 관대하지만 대역폭/Function quota가 있고, 일부 한국 PoP가 약함.
3. **GitHub Pages** — 가장 단순. 다만 빌드 분량 제한 + jamstack 기능 없음 + Workers 같은 동적 확장 불가.
4. **Netlify** — Vercel과 유사. 대역폭 100GB/월로 작은 편.

사용자 사전 선호: "Cloudflare Pages로 가고 싶다."

## Decision (결정)

- 호스팅 플랫폼은 **Cloudflare Pages**.
- 리포 연동: GitHub `pplenty/jdgrid-news`. 빌드 명령: `pnpm build` (또는 `npm run build`). 출력 디렉토리: `out`.
- 환경: **Production** = `main` 브랜치, **Preview** = 그 외 모든 PR/브랜치.
- 추후 동적 기능이 필요해지면 같은 도메인에 **Cloudflare Workers / Pages Functions**로 붙인다 (별도 인프라 도입 없이 확장).

## Consequences (결과)

**긍정**
- 무제한 대역폭 → 트래픽 스파이크 무서움 없음.
- 글로벌 CDN 응답 속도 우수 (특히 한국 + 글로벌 양쪽).
- Pages Functions로 향후 검색·이미지 프록시·웹훅을 같은 도메인에서 처리 가능.
- 빌드 500회/월은 일 1회 push 기준 16배 여유.

**부정**
- Next.js의 `output: 'export'`만 안전하게 지원. SSR/ISR을 쓰려면 `@cloudflare/next-on-pages` 어댑터 필요 (현재는 export로 가니 무관).
- Vercel 대비 Next.js DX(프리뷰 코멘트, Analytics 등)의 통합도가 살짝 낮음.

**중립**
- Cloudflare 계정 + DNS는 별도 관리. 추후 커스텀 도메인 붙이려면 Cloudflare DNS로 옮기는 게 가장 매끄럽다.

## Alternatives Considered (대안)

- **Vercel**: Next.js 자체 플랫폼이라 매끄럽지만, 우리는 SSR/ISR을 안 쓰기 때문에 Vercel만의 강점이 줄어든다. 또한 대역폭 quota가 더 빡빡하다.
- **GitHub Pages**: 가장 단순하지만, 추후 Workers 같은 동적 확장이 불가능해 옵션이 좁아진다.
- **Netlify**: 대역폭 quota가 가장 작고, 빌드 분 제한도 더 엄격.
- **자체 VPS (Fly.io, Render)**: 정적 사이트에 컨테이너는 과잉. 운영 부담만 늘어남.

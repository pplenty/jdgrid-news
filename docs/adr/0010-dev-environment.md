# ADR-0010: 개발 환경 — pnpm + Node 22 LTS + TypeScript strict + ESLint·Prettier

- Status: Accepted
- Date: 2026-05-22
- Deciders: yusik
- Related: [ADR-0002](./0002-frontend-nextjs-static-export.md), [ADR-0003](./0003-hosting-cloudflare-pages.md)

## Context (배경)

스캐폴딩 직전에 런타임·언어·코드 품질 도구를 확정해야 한다. 한 번 박히면 lock 파일 형식, `tsconfig.json`, ESLint·Prettier 설정이 굳어 되돌리기 비용이 작지 않다.

요구사항:
- Cloudflare Pages 빌드 환경과 호환 (ADR-0003).
- Next.js 15 + App Router 호환 (ADR-0002).
- 1인 운영 — 도구 수는 적게, 학습 비용 낮게.
- TypeScript 안전성과 구현 속도의 균형.

## Decision (결정)

> 운영자 결정 (2026-05-22):
> 1. 패키지 매니저 + Node → **pnpm + Node 22 LTS**
> 2. TypeScript 엄격도 → **`strict: true` 기본**
> 3. 린트/포맷 도구 → **ESLint + Prettier**

### 패키지 매니저 + Node

- **pnpm** (latest v9 또는 v10) 사용. 컨텐츠 주소 기반 저장소로 디스크 효율 ↑, 향후 모노레포 전환 시 워크스페이스 자연스러움.
- **Node 22 LTS** 고정.
  - Cloudflare Pages 환경변수에 `NODE_VERSION=22`.
  - 로컬은 `.nvmrc` 또는 `package.json`의 `engines.node` 필드에 명시.
- `pnpm-lock.yaml` 커밋 필수. `npm`·`yarn` lock 파일은 생성 금지 (`.gitignore` 또는 PR 룰).

### TypeScript

- `tsconfig.json`은 Next.js의 기본 템플릿에서 시작 → **`"strict": true`** 만 보장.
- 추가 옵션(예: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`)은 도입 부담을 고려해 v1에서 OFF. 필요해지면 별도 PR로 켜고 한 번에 마이그레이션.
- 모듈 해석은 Next.js 기본(`"moduleResolution": "bundler"`).

### 린트/포맷

- **ESLint** — Next.js 공식 프리셋(`eslint-config-next`) 기반. 필요한 룰(예: `import/order`)만 보강.
- **Prettier** — 포매팅 전담. ESLint와의 충돌은 `eslint-config-prettier`로 해소.
- 에디터 통합: VSCode/JetBrains 어느 쪽이든 동작하도록 `.editorconfig`도 함께 둔다.
- pre-commit 훅·CI lint 게이트는 별도 결정 (인벤토리 항목 #6, 추후 결정).

## Consequences (결과)

**긍정**
- pnpm + Node 22 LTS 조합은 Cloudflare Pages·Next.js 모두 안정 지원.
- pnpm 워크스페이스 → 향후 `web/` + `scraper/` 모노레포 전환 시 추가 도구 도입 없이 자연스러움.
- `strict: true`로 핵심 안전망은 확보, 추가 옵션은 필요 시 점진 도입 — 구현 속도 ↑.
- ESLint + Prettier는 가장 검증된 조합. Next.js 가이드·플러그인 생태계 그대로 활용.

**부정**
- Biome 같은 통합 도구가 주는 단일 명령·속도 이점은 포기.
- `noUncheckedIndexedAccess` OFF → 배열/객체 인덱스 접근 시 undefined 검증이 강제되지 않음. 데이터 파싱 코드에서 주의 필요.
- pnpm은 Cloudflare Pages가 자동 감지하지만, 가끔 빌드 캐시 이슈가 보고됨 — `package.json#packageManager` 필드 명시로 완화.

**중립**
- Node 24가 LTS화되면 그 시점에 별도 PR로 업그레이드. ADR 갱신 없이 처리 가능 (운영 튜닝 영역).
- ESLint 9의 flat config 사용 여부는 구현 단계 결정.

## Alternatives Considered (대안)

- **npm + Node 22**: 표준 도구만 쓰는 단순함. 그러나 디스크 효율·속도에서 pnpm 우위. 모노레포 전환 시 추가 학습.
- **bun**: 가장 빠르고 native TS 실행. 그러나 Next.js + Cloudflare Pages 빌드 환경과의 호환성에서 신생 도구 리스크. v1에선 배제.
- **TypeScript 최대치(`exactOptionalPropertyTypes` 등)**: 안전성 최상이나 1인 운영 + RSS 파싱처럼 타입이 느슨한 외부 데이터를 다루는 코드 양이 많아 마찰 비용이 큼.
- **Biome 단일 도구**: lint+format 한 번에 + 빠름. 그러나 ESLint 플러그인 생태계와 단절, Next.js 공식 권장은 ESLint.
- **ESLint only (Prettier 없이)**: 도구 1개 줄지만 포매팅 룰이 사람마다 어긋남. 1인이라도 미래의 협업자(또는 AI)와의 일관성 위해 Prettier 유지.

# ADR-0011: 저장소 구조 — 단일 패키지 + 디렉토리 분리

- Status: Accepted
- Date: 2026-05-22
- Deciders: yusik
- Related: [ADR-0004](./0004-data-storage-git-json.md), [ADR-0010](./0010-dev-environment.md)

## Context (배경)

ADR-0010에서 pnpm을 선택했다 — 모노레포 전환 시 워크스페이스가 자연스럽다는 옵셔널리티는 확보된 상태. 이제 실제 저장소 조직 형태를 정해야 한다.

특성:
- 1인 운영, v1 규모는 크지 않음.
- web(Next.js, ADR-0002)과 scraper(Node 스크립트, ADR-0005)가 같은 git에서 동작.
- 데이터는 별도 DB 없이 git의 `data/` 디렉토리(ADR-0004).
- web과 scraper가 같은 데이터 스키마(`Article`, `Category` 등)를 공유해야 함.

후보:
1. **단일 패키지 + 디렉토리 분리** — 한 package.json, `src/` 하위에 영역별 폴더.
2. **pnpm 워크스페이스 모노레포** — `web/` + `scraper/` 패키지 분리, 각자 package.json.
3. **Next.js 루트 + `scripts/`** — Next.js 스캐폴딩을 루트에 펴고, 스크래퍼는 `scripts/`에 동거.

## Decision (결정)

> 운영자 결정 (2026-05-22): **단일 패키지 + 디렉토리 분리**

### 디렉토리 레이아웃

```
jdgrid-news/
├── data/                # 수집 결과 (ADR-0004 일자별 JSON)
│   ├── 2026-05-22.json
│   ├── latest.json
│   └── trends/...
├── docs/                # PLAN, ADR
│   ├── PLAN.md
│   └── adr/
├── public/              # Next.js 정적 자산 (favicon, og 이미지 등)
├── src/
│   ├── app/             # Next.js App Router (페이지/레이아웃)
│   ├── scraper/         # RSS 수집·정규화·data/ 쓰기
│   └── lib/             # 공유 타입·상수·유틸 (web ↔ scraper)
├── .github/
│   └── workflows/       # CI + 데일리 cron (ADR-0006)
├── .nvmrc               # Node 22
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── next.config.ts
├── .eslintrc.json
└── .prettierrc
```

### 영역 책임

- **`src/app/`**: Next.js App Router. 데이터를 빌드 시점에 `data/`에서 읽는 RSC + 클라이언트 컴포넌트.
- **`src/scraper/`**: RSS fetch, 정규화, dedupe, 카테고리 분류, `data/*.json` 쓰기. 진입점은 `src/scraper/index.ts`.
- **`src/lib/`**: 양쪽이 함께 import하는 공유 코드. 타입(`Article`, `Trend`, `Category`), 상수(카테고리 ID 목록, 우선순위 룰), 유틸(URL 정규화, dedupe, 키워드 추출). **순수 함수 + 타입 위주, 런타임 의존성 최소화.**

### pnpm 스크립트 (예정)

```jsonc
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "scrape": "tsx src/scraper/index.ts",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "format": "prettier --write ."
  }
}
```

(구체적인 스크립트 이름·옵션은 구현 단계 자유도. 위는 명명 규칙 가이드.)

### tsconfig 경로 별칭

- `@/*` → `./src/*` (Next.js 기본).
- `@/lib/*`, `@/scraper/*`, `@/app/*` 같은 세부 별칭은 필요 시 추가.

## Consequences (결과)

**긍정**
- 도구·설정 중복 없음. eslintrc/tsconfig/package.json 1벌만 유지.
- web과 scraper가 `src/lib/`로 **타입·상수를 자연스럽게 공유** — 데이터 스키마 변경 시 한 곳에서 수정.
- pnpm 스크립트로 `pnpm scrape` / `pnpm build` 명령이 직관적.
- 모노레포 도구(turbo 등) 학습 비용 0.

**부정**
- scraper 전용 의존성(`rss-parser`, `cheerio` 등)이 같은 `dependencies` 트리에 들어감. Next.js 정적 export(ADR-0002) 산출물엔 사용 안 한 의존성이 안 들어가지만, install 시간·`node_modules` 크기엔 영향.
- 미래에 web과 scraper가 충돌하는 의존성(예: 서로 다른 Node 메이저)을 쓰게 되면 모노레포 분리가 필요 — 그 시점에 별도 ADR로 supersede.
- scraper의 dev dependencies(`tsx`, `rss-parser` 등)와 web의 production dependencies가 같은 lock에 묶여 보안 감사 영역이 커짐.

**중립**
- `src/` 안에 묶는 컨벤션은 Next.js·IDE·tsconfig 모두 자연스럽게 지원. 루트 노이즈가 줄어듦.
- 스크래퍼 실행은 `tsx`(권장) 또는 `ts-node`. 구현 단계에서 택일.

## Alternatives Considered (대안)

- **pnpm 워크스페이스 모노레포**: 의존성 트리 격리 + 미래 확장 자연스러움. 그러나 1인 + v1 규모에선 설정 중복(eslintrc·tsconfig 2벌, package.json 2벌)·도구 학습 비용이 상회. 분리가 정말 필요해질 때 supersede 가능.
- **Next.js 루트 + `scripts/scrape.ts`**: 가장 단순. 스크래퍼가 단일 파일·100줄 수준이면 적합했겠지만, RSS 소스 수십 개·dedupe·키워드 추출이 들어가면 `scripts/` 한 줄로는 좁다 → `src/scraper/`로 디렉토리 격상.
- **멀티 리포(`jdgrid-news-web` + `jdgrid-news-scraper`)**: 데이터 교환에 별도 협의 필요. 1인엔 오버킬.

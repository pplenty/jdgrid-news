# ADR-0034: 단위 테스트 도입 (Vitest)

- Status: Accepted
- Date: 2026-05-28
- Deciders: yusik
- Related: [ADR-0033](./0033-scraper-http-layer-retry.md), [ADR-0014](./0014-keyword-extraction-v0.md), [ADR-0027](./0027-ops-source-cleanup-dedupe.md)

## Context (배경)

프로젝트에 자동화 테스트가 0개였다. 핵심 로직의 튜닝 상수·알고리즘 근거가 코드 주석에만 존재해 회귀 위험이 컸다:

- **dedupe** Jaccard 0.8 임계값 (ADR-0027) — 조정 시 과(過)/소(少) 병합 감지 못 함.
- **keywords** `PARTICLE_PROTECT_MARGIN`, stopwords (ADR-0014). 실제로 2026-05-27 particle margin 버그(3글자 토큰 strip 누락)가 운영 중 발견된 전례 — 테스트가 있었다면 조기 포착.
- **google-trends** `trafficToScore` 임계 테이블 — 경계값 동작 불명확.
- ADR-0033 의 retry 로직은 외부 네트워크 의존이라 수동 검증이 어렵다 (실패 주입 불가).

## Decision (결정)

**Vitest** 도입.

- devDependency `vitest`, scripts `test`(= `vitest run`) / `test:watch`.
- `vitest.config.ts` — `@` alias = `src`, node 환경, `include: src/**/*.test.ts`.
- 테스트 파일은 소스 옆 `*.test.ts` 배치.
- **33 tests**:
  - `dedupe`: 정확 id 중복 / Jaccard 0.8 근접 병합 / 짧은 제목 exact-match.
  - `keywords`: `stripKoreanParticles`(margin 보호 포함) / `tokenize` / `extractDerivedKeywords` / `matchArticles`.
  - `google-trends`: `trafficToScore` 임계 테이블 + comma/decimal 파싱.
  - `lib/date`: KST 변환 / 월 경계 / zero-pad.
  - `http`: `fetchJson`/`fetchText` + retry(5xx 3회 / 4xx 즉시 / network) + `errMessage` — `global.fetch` 모킹.

## Consequences (결과)

**긍정**
- 회귀 안전망 — dedupe/keyword 상수를 근거 갖고 조정 가능. particle margin 류 버그 재발 시 즉시 포착.
- ADR-0033 retry 로직을 fetch 모킹으로 결정적 검증 (실패 주입).
- `pnpm test` 가 로컬 pre-push 게이트로 동작.

**부정**
- `tsc --noEmit` 가 `.test.ts` 까지 검사 → vitest 타입(devDep) 필요. 빌드 번들엔 미포함(어떤 라우트도 import 안 함)이라 배포 영향 없음.
- retry 풀 사이클 테스트는 실제 backoff(~1.2s) 대기 — fake timer 미사용. 전체 suite 3초대라 허용.

**중립**
- 현재 CI 미연동 — 로컬 게이트만. push/PR 시 자동 실행은 후속(아래).
- UI 컴포넌트·페이지는 테스트 미대상 — 정적 export + 데이터 변환 위주라 단위 로직(scraper/lib) 우선.

## Alternatives Considered (대안)

- **Jest**: Next 생태계에 흔하나 ESM/TS 설정이 무겁다. Vitest 는 vite 기반으로 `.ts`·`@` alias 설정이 가볍고 빠름.
- **node:test (내장)**: 의존성 0이나 watch/mock/expect 생태계가 약하고 `.ts` 실행에 tsx 별도 배선 필요.
- **테스트 안 함 (현행 유지)**: particle margin 버그 전례가 회귀 위험을 실증 — 비채택.
- **E2E/통합 테스트 우선**: 점수 계산·토큰화 같은 순수 로직은 단위 테스트가 적합. E2E 는 정적 사이트라 가치 대비 비용 큼.

## Implementation Notes

- `vitest.config.ts` 의 `@` alias = `resolve(__dirname, 'src')` — 코드의 `@/lib` import 해소.
- http retry 테스트는 `global.fetch` 를 `vi.fn()` 으로 모킹, `afterEach` 에서 복원. fake timer 미사용(실제 backoff 감수).
- `trafficToScore` 등 일부 내부 함수는 테스트 위해 export 로 승격 (ADR-0033 에서 처리).
- **후속(미결)**: push/PR 시 `pnpm test` 를 돌리는 CI 워크플로우 추가 — `daily-scrape.yml`(scrape 전용)과 별개 워크플로우. 이번 ADR 범위 밖, 별도 진행.

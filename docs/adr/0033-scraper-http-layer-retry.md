# ADR-0033: scraper HTTP 계층 공통화 + retry/backoff

- Status: Accepted
- Date: 2026-05-28
- Deciders: yusik
- Related: [ADR-0005](./0005-data-sources-rss-google-trends.md), [ADR-0017](./0017-realtime-trends-categories.md), [ADR-0027](./0027-ops-source-cleanup-dedupe.md), [ADR-0030](./0030-yonhap-replacement-donga-khan.md)

## Context (배경)

scraper 는 8개 외부 source fetcher (wikipedia · reddit · naver · itunes · youtube · google-realtime · hackernews · google-trends) 를 가진다. 소스를 늘려오며(ADR-0005/0025/0026 등) 누적된 중복·결함:

- 각 fetcher 가 `fetch + headers{User-Agent} + AbortSignal.timeout(15s) + !res.ok 체크 + try/catch + 빈 결과 반환` 보일러플레이트를 복붙. 새 source 추가마다 같은 코드.
- `FETCH_TIMEOUT_MS = 15_000` 8개 파일, `USER_AGENT` 8개 파일 중복 (단 wikipedia = mailto, reddit = platform 형식 UA 는 정책상 의도적 차이).
- KST 날짜 offset `9 * 3_600_000` 가 wikipedia · naver 에 중복 + `normalize.ts` 엔 Intl 기반 `formatDateKst` 가 별도로 공존 — KST 계산이 두 방식.
- **재시도 없음.** ADR-0030 의 Yonhap ECONNRESET, GitHub Actions Azure datacenter IP 의 일시적 네트워크 실패가 단발 실패로 그대로 빈 결과 → 그날 해당 source 누락. 진짜 영구 차단인지 일시 장애인지 구분 없이 1회 시도 후 포기.

## Decision (결정)

scraper 의 HTTP 호출을 단일 계층으로 모은다.

**`src/scraper/config.ts`** — 공통 상수 중앙화:

```ts
export const FETCH_TIMEOUT_MS = 15_000;
export const USER_AGENT = 'jdgrid-trends/0.1 (+https://trends.jdgrid.com)';
export const WIKIPEDIA_USER_AGENT = 'jdgrid-trends/0.1 (mailto:support@jdgrid.com)'; // Wikimedia 정책
export const REDDIT_USER_AGENT = 'web:jdgrid-trends:v0.1 (+https://trends.jdgrid.com)'; // platform 형식 (ADR-0026)
```

**`src/scraper/http.ts`** — throw 기반 fetch 래퍼:

- `fetchJson<T>(url, opts)` / `fetchText(url, opts)` — 성공값만 반환, 실패 시 throw.
- `HttpError(status, url, body)` — `!res.ok` 응답. status + 본문 일부 보존.
- `errMessage(err)` — `HttpError` 면 `HTTP {status} {body}`, 그 외 `Error.message`.
- **retry**: `429 / 5xx / 네트워크·timeout` → 최대 2회(총 3회), exponential backoff 400 → 800ms. **`4xx`(429 제외)는 즉시 throw.**

**호출부 규약**: `try { await fetchJson(...) } catch (e) { console.warn(errMessage(e)); return [] }` — graceful skip(빈 배열/null) 은 호출부 책임. http.ts 는 transport 만, 도메인 fallback 은 분리.

**`src/lib/date.ts`** — KST 날짜 단일 출처 (`formatDateKst` / `kstDateString` / `kstDateParts`). 수동 offset 산술 폐기, timezone 변환은 Intl 에 위임 (한국 DST 없어 N일 전은 `Date.now() - n*86_400_000`).

부수: `google-trends.trafficToScore` 를 임계값 테이블로 정리 + export (ADR-0034 테스트 대상).

## Consequences (결과)

**긍정**
- 새 source 추가 비용 감소 — fetcher 본문이 `fetchJson` 한 줄 + 파싱/매핑만. UA/timeout 은 config 한 곳.
- 일시적 네트워크 실패(ECONNRESET·5xx) 회복 — 3회 backoff. GitHub Actions 의 산발적 실패에 강함 (ADR-0030 류 재발 완화).
- `HttpError.status` 보존으로 호출부가 상태별 분기 가능 (Wikipedia 404 → 다음 날짜 retry, realtime 4xx → 조용한 skip).
- 8개 fetcher 평균 10~20줄 단축, 상수 중복 16건 제거.

**부정**
- retry 가 워스트 케이스 지연 추가 — 5xx 지속 source 는 400+800ms backoff 후 포기. 12개 병렬 fetch 라 전체 영향은 작지만 (Promise.all), 한 source 가 3회 timeout(15s×3)이면 45s. cron 15분 한도 대비 여유 있음.
- http.ts 가 모든 fetcher 의 공통 의존 — 변경 시 영향 범위 넓음 (단위 테스트로 방어, ADR-0034).

**중립**
- graceful skip 을 호출부에 남긴 건 의도 — source 별 fallback 정책(빈 배열 / null / 다음 날짜 retry)이 달라 transport 가 일괄 처리 불가.
- KST 통일은 동작 변화 없음 (한국 DST 없어 기존 offset 방식과 결과 동일) — 순수 중복 제거.

## Alternatives Considered (대안)

- **null/[] 반환 유틸**: 호출부가 try/catch 없이 간결해지지만 실패 원인 소실 + source 별 특수 분기(404 retry-by-date) 불가. 채택 안 함.
- **retry 라이브러리 (p-retry 등)**: 의존성 추가. 정책이 단순(3회 고정 backoff)해 ~15줄로 충분.
- **4xx 도 재시도**: 폐지된 endpoint(google-realtime 404)에 헛된 backoff 비용 + Wikipedia 404-retry-by-date 로직과 충돌. 4xx 즉시 throw 가 정답.
- **래퍼에서 graceful skip(빈 배열 반환)**: 도메인 결정을 transport 가 떠안음. Wikipedia 404 분기 불가. 호출부 책임으로 분리.

## Implementation Notes

- `4xx 즉시 throw` 가 Wikipedia 의 `404 → 다음 날짜 retry` 와 양립 — 404 가 즉시 throw 되니 호출부 catch 에서 `err instanceof HttpError && err.status === 404` 분기로 다음 날짜 시도.
- google-realtime 은 endpoint 폐지(ADR-0017)라 모든 `HttpError` 를 조용히 skip (로그 X), 네트워크 에러만 warn — 404 스팸 방지.
- Naver POST 는 `fetchJson` 의 `method`/`headers`(X-Naver-*)/`body` 옵션으로. Content-Type 헤더 명시.
- 검증: typecheck/lint clean, `pnpm scrape` 24/24 sources · 977 articles 정상, `http.test.ts` 단위 테스트(ADR-0034).

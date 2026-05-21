# ADR-0004: 데이터 저장은 Git에 일자별 JSON (DB 없음)

- Status: Accepted
- Date: 2026-05-21
- Deciders: yusik
- Related: [ADR-0002](./0002-frontend-nextjs-static-export.md), [ADR-0006](./0006-scheduling-github-actions-cron.md)

## Context (배경)

뉴스 수집 결과(헤드라인 + 메타데이터 + 트렌딩 키워드)를 어디에 저장할지 결정해야 한다.

특성:

- **쓰기 패턴**: 하루 1~2회 배치. 동시 쓰기 없음.
- **읽기 패턴**: 빌드 시점 1회 (정적 export, ADR-0002). 사이트 방문자는 빌드 산출물만 본다.
- **데이터 크기**: 일자 1건당 수십 KB ~ 수백 KB 추정. 1년 후 누적 50~200MB 수준.
- **검색/필터**: v1 범위에서는 빌드 시점 인덱싱으로 충분.
- **운영자**: 1인. DB 운영을 추가하지 않는 것이 best.

후보:

1. **Git 리포에 JSON 파일 커밋** — 무료, 단순, 버전 관리 자체가 됨.
2. **Vercel KV / Cloudflare KV / D1** — 키-값 또는 SQLite. 무료 tier 있음.
3. **Supabase / PlanetScale** — 풀 DB. 오버킬.
4. **외부 객체 스토리지 (R2, S3)** — 정적 자산처럼 다루지만 git 버전 관리 없음.

## Decision (결정)

- 수집 결과는 **`data/` 디렉토리에 JSON 파일로 저장하고 Git에 커밋**한다.
- 파일 레이아웃:
  - `data/YYYY-MM-DD.json` — 해당 일자 스냅샷.
  - `data/latest.json` — 가장 최근 스냅샷 (메인 페이지가 빌드 시 읽음).
  - `data/trends/YYYY-MM-DD.json` — (선택) 트렌딩만 분리해야 할 만큼 커지면 분리.
- 정규화 규칙은 `scraper/normalize.ts`(예정)에 모은다. 스크래퍼는 항상 같은 스키마를 만들어야 한다.
- 오래된 파일도 **삭제하지 않는다**. 빌드 시 최근 N일치만 정적 페이지로 생성하고 나머지는 미생성 (저장은 유지).

## Consequences (결과)

**긍정**
- 비용 0. 운영 인프라 0.
- 버전 관리 = 자연스러운 히스토리. `git log data/2026-05-21.json`으로 어떤 스크래퍼가 어떤 결과를 만들었는지 추적.
- 빌드와 데이터가 같은 리포 → CI에서 atomically push, Cloudflare가 자동 재빌드 (ADR-0003 흐름과 일치).
- 데이터 손실 시 git이 자체 백업.

**부정**
- 리포 크기가 시간이 갈수록 늘어남. 1년에 ~100MB는 받아들일 만하지만 5년 누적은 부담 가능 → 그 시점에 `git filter-repo`로 오래된 일자 정리 또는 별도 데이터 저장소로 분리 (그때 별도 ADR).
- 임의 쿼리 불가. 키워드 검색 등은 빌드 시점 인덱싱 또는 클라이언트 사이드 fetch로 해결.
- 빌드마다 모든 JSON을 읽어들이는 게 비효율적 → 빌드 단계에서 인덱스 파일(`data/index.json`)을 생성해 메인 페이지 빌드는 이걸만 읽도록 한다.

**중립**
- 동일 일자 재스크래핑 시 같은 파일을 덮어쓴다. Git diff로 어떤 헤드라인이 바뀌었는지 확인 가능 (운영성 보너스).
- 추후 DB가 필요해지면 `data/`를 그대로 마이그레이션 소스로 쓸 수 있다.

## Alternatives Considered (대안)

- **Cloudflare KV / D1**: 무료 tier 있고 read latency 좋음. 그러나 빌드 산출물이 정적 export(ADR-0002)인 이상 DB로 향한 추가 통신이 필요 없고, 운영 면도 늘어난다.
- **Supabase / Postgres**: 진짜 DB 기능이 필요하지 않은 단계라 오버킬.
- **R2 / S3 + JSON**: git 버전 관리를 잃고, 별도 자격증명/배포 흐름이 늘어난다.
- **SQLite를 git에 커밋**: 바이너리 파일이라 diff가 안 보인다. JSON이 더 투명함.

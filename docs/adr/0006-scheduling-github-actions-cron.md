# ADR-0006: 스케줄링은 GitHub Actions cron

- Status: Accepted
- Date: 2026-05-21
- Deciders: yusik
- Related: [ADR-0003](./0003-hosting-cloudflare-pages.md), [ADR-0004](./0004-data-storage-git-json.md), [ADR-0005](./0005-data-sources-rss-google-trends.md)

## Context (배경)

수집 스크립트(`scraper/`)를 **매일 정해진 시각**에 돌리고, 그 결과를 `data/`에 커밋해야 한다 (ADR-0004). 스케줄링 후보:

1. **GitHub Actions cron** — 무료, repo 안에 정의. 결과를 같은 repo에 push하기 쉬움.
2. **Cloudflare Workers Cron Triggers** — 무료 tier 있음. 그러나 git push를 직접 하려면 별도 자격증명 필요.
3. **Vercel Cron** — 호스팅이 Vercel일 때 의미 있음. 우리는 Cloudflare 사용 (ADR-0003).
4. **외부 cron 서비스** (cron-job.org 등) — webhook 호출 형태. git push로 연결하려면 중간 계층 필요.
5. **자체 서버** — 1인 운영에 인프라 추가는 부담.

요구사항:
- 매일 KST 06:00 ± 30분 (출근 전 확인을 가정).
- 실행 실패 시 알림 또는 재시도.
- 실행 결과를 git에 직접 push 가능해야 함 (ADR-0004와 짝).

## Decision (결정)

- **GitHub Actions의 `schedule.cron`** 으로 매일 1회 scrape 실행.
- 권장 cron: `0 21 * * *` (UTC 21:00 = KST 06:00).
- 워크플로우 위치: `.github/workflows/daily-scrape.yml`.
- 실행 흐름:
  1. Checkout (write 권한)
  2. Node 셋업 + 의존성 설치
  3. `pnpm scrape` 실행 → `data/`에 파일 생성/갱신
  4. 변경이 있으면 `git commit` + `git push` (커밋 메시지: `chore(data): YYYY-MM-DD scrape`)
  5. (옵션) 실패 시 GitHub Issue 자동 생성 또는 Slack/Discord webhook
- **수동 실행**도 가능하게 `workflow_dispatch` 트리거 함께 추가.
- 실행 시간 표류 방지를 위해 cron은 단일 시각만 둔다. 재시도는 다음 날로 흡수 (정전·외부 차단으로 1회 빠져도 다음날 복구).

## Consequences (결과)

**긍정**
- 별도 인프라 0. 모든 자동화가 같은 리포 안에서 끝남.
- `data/`에 push 즉시 Cloudflare Pages가 재빌드 (ADR-0003) → 운영자 개입 없는 일일 사이클.
- GitHub Actions 로그가 그대로 운영 로그가 된다.

**부정**
- GitHub Actions cron은 트리거가 **수 분~수십 분 지연**되는 경우가 종종 있다. KST 06:00 칼같이는 어렵고 "아침 시간대" 보장 정도.
- 무료 tier에 분 단위 quota가 있음. 일 1회 ~5분 잡으면 월 150분 미만으로 여유는 크다.
- write 권한이 필요하므로 `permissions: contents: write` 설정 필수.

**중립**
- 글로벌 트렌드(예: 미국 신호)도 함께 받기 때문에 UTC 21:00이 양쪽 시차에 무난.
- 추후 빈도를 올리려면 (예: 12시간마다) cron만 추가 — 구조 변경 없음.

## Alternatives Considered (대안)

- **Cloudflare Workers Cron**: Workers 환경에서 git push까지 자동화하려면 GitHub PAT을 secret에 두고 REST API로 푸시해야 함 — 가능하지만 굳이.
- **외부 cron + webhook**: 트리거를 받아 GitHub Actions의 `workflow_dispatch`를 호출하는 형태도 가능. 그러나 GitHub Actions 자체가 cron을 지원하므로 중간 계층은 불필요.
- **자체 서버 + cron**: 운영 비용·복구 책임이 늘어남.
- **빌드 시점 ad-hoc scrape**: Cloudflare 빌드 환경 안에서 직접 RSS를 받아 정적 페이지를 만드는 방법도 가능. 그러나 빌드 시점에 외부 네트워크 의존성이 들어가면 배포 안정성이 떨어진다. 또한 ADR-0004가 가정한 "git에 데이터가 박혀 있다"는 흐름과 어긋난다.

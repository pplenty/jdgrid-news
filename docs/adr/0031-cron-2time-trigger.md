# ADR-0031: cron 2-time trigger — 누락 흡수 (ADR-0006 supersede)

- Status: Accepted
- Date: 2026-05-27
- Deciders: yusik
- Related: [ADR-0006](./0006-scheduling-github-actions-cron.md)

## Context (배경)

ADR-0006 §Decision: "UTC 21:00 = KST 06:00, 단일 시각만 두고 다음 날로 흡수".

운영 발견 (2026-05-23 ~ 2026-05-26, 4일 연속):
- 5-23 21:00 UTC: `cancelled 10m20s` (timeout 10min)
- 5-24 21:00 UTC: `cancelled 15m17s` (timeout 15min)
- 5-25 22:09 UTC: `success 29s` (process.exit fix 적용 후 첫 정상)
- 5-26 21:00 UTC: **누락** (GitHub Actions schedule 큐 묵음 누락)

4회 중 2회 `cancelled` (process.exit fix로 해결, ADR-0029 이슈 직접 관련 X — 별도 fix `809c501`) + 2회 **schedule 누락**. ADR-0006 의 "다음 날로 흡수" 정책으론 누락 케이스에 약함:

- 누락된 날 사이트의 데이터 stale (수십 시간)
- Cloudflare 자동 재빌드도 안 일어남 (data push 없으므로)
- 운영자가 매번 수동 `gh workflow run` 트리거하기엔 번거로움

GitHub Actions schedule 누락은 [공식 docs](https://docs.github.com/en/actions/writing-workflows/choosing-when-your-workflow-runs/events-that-trigger-workflows#schedule) 에서도 "queue overhead 시 지연/누락" 명시. 알려진 한계.

## Decision (결정)

cron 트리거 **2개 시각**으로 확장 + **scrape skip 가드** 추가.

```yaml
on:
  schedule:
    - cron: '0 21 * * *'  # UTC 21:00 = KST 06:00 (주 시각)
    - cron: '0 0 * * *'   # UTC 00:00 = KST 09:00 (누락 흡수)
  workflow_dispatch: {}
```

**Skip 가드** (`steps.check`):
- 같은 날 `data/YYYY-MM-DD.json` 이미 존재하면 scrape skip.
- `workflow_dispatch` (수동 트리거) 는 무조건 실행 — 운영자 강제 재수집 케이스 보존.

흐름:
1. UTC 21:00 cron 정상 동작 → `data/today.json` 생성 + commit.
2. UTC 00:00 cron 트리거 → `data/today.json` 이미 있음 → scrape skip → 0 cost.
3. UTC 21:00 cron 누락 시 UTC 00:00 cron 정상 동작 → `data/today.json` 생성 + commit (3시간 늦지만 흡수).
4. UTC 21:00 cancelled (process.exit fix 후 거의 없음) + UTC 00:00 정상 → 흡수.

ADR-0006 의 "단일 시각" 정책은 본 ADR로 supersede. ADR-0006 의 다른 결정 (push 시점 무관 / commit 한 번에 / RSS 일별 윈도우) 은 유지.

## Consequences (결과)

**긍정**
- schedule 누락 흡수 — 두 시각 모두 누락될 확률은 4일 중 0회 ([일반 ~5% × 5% = 0.25%] 거의 없음).
- 정상 일에는 두 번째 run 이 `skip=true` 로 즉시 종료 (10~20초). 무료 quota 영향 최소.
- 운영자 수동 트리거 (`gh workflow run`) 은 그대로 동작 — `workflow_dispatch` 는 가드 무시.

**부정**
- GitHub Actions 무료 quota 사용 약간 증가 (skip run 도 작은 시간 점유). 개인 free tier 2000분/월 한도 대비 무시 가능 (skip = 20s × 30일 = 10분/월).
- 같은 날 두 번째 trigger 가 첫 commit 직후 (예: 5분 차) 일어나면 race condition 가능. 단 첫 commit 이 push 까지 1분 안에 끝나고 두 번째 trigger 까지 3시간 간격이라 거의 발생 안 함.
- 두 시각 모두 누락 시 보호 없음 — 확률 매우 낮으나 운영자가 알아야 함.

**중립**
- ADR-0006 의 "다음 날로 흡수" 정책은 단일-시각 가정 산물. 본 ADR 후 폐기 — 같은 날 안에서 흡수.

## Alternatives Considered (대안)

- **단일 시각 유지 + 운영자 수동 트리거**: 운영자 부담. 누락 패턴 자주 발생하므로 자동화 가치 큼.
- **시각 3개 이상 (21:00 + 23:00 + 01:00 UTC)**: skip 가드 있으니 추가 비용은 작지만 over-engineering. 2회로 충분 (3일 연속 누락 관찰 없음).
- **GitHub Actions 외부 cron (Render / fly.io / 외부 스케줄러)**: 인프라 추가 부담. 단일 GitHub Actions 로 충분.
- **scrape 자체에 schedule 재확인** (예: scrape 안에 "오늘 데이터 있으면 skip"): workflow level 가드가 더 깔끔 — install/setup 비용도 절약.

## Implementation Notes

- workflow 의 `Check today's data` step 에서 `data/YYYY-MM-DD.json` 파일 존재만 확인. file size·content 검증 X (이미 commit 됐다면 정상 데이터로 신뢰).
- 두 cron 사이 3시간 간격 — 첫 trigger 의 install (30s) + scrape (10s) + commit·push (5s) 합 1분 미만이라 충돌 없음.
- 만약 첫 trigger 가 매우 느려져서 (예: install 캐시 miss + scrape 5분) 두 번째 trigger 가 첫 commit 전에 시작되면 둘 다 scrape 함 — 일시적 비효율. `concurrency.group: daily-scrape` 가 이미 박혀있어 직렬화됨 (`cancel-in-progress: false`).

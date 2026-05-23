# ADR-0023: 분석 강화 v1 — Movers + Category Comparison

- Status: Accepted
- Date: 2026-05-23
- Deciders: yusik
- Related: [ADR-0004](./0004-data-storage-git-json.md), [ADR-0016](./0016-trend-enrichment-google.md), [ADR-0020](./0020-naver-datalab-shopping.md), [ADR-0021](./0021-trend-as-main-hero.md)

## Context (배경)

사용자 피드백: 메인이 "트렌드 대시보드"로 자리잡았으니 단순 노출을 넘어 **인사이트 (analytics)** 를 더하자. 갈래 B (분석 강화) 선택.

ADR-0004 (Git JSON 저장)로 매일 snapshot이 누적되어 어제 vs 오늘 비교가 가능. 별도 데이터베이스·외부 source 없이 이미 가진 자료로 가치 ↑.

## Decision (결정)

### 1. Movers (어제↔오늘 비교)

오늘 Google Daily Trends 키워드를 어제 snapshot과 비교해 **"오늘 새로 떠올랐거나 큰 폭으로 상승한 키워드"** 를 노출.

- 입력: `snapshot.trends.kr/global` (오늘) + `loadByDate(yesterday).trends.kr/global` (어제).
- 출력 카테고리:
  - 🆕 **New** — 어제 트렌드 셋에 없던 키워드 (오늘 top 20 안에서).
  - 📈 **Rising** — 둘 다에 있지만 순위 ≥ 5계단 상승.
- 표시 항목당: 키워드 + traffic + (rank delta 또는 NEW 배지) + 매체.
- KR / Global 각 top 5씩.
- 어제 snapshot이 없으면 (운영 초기) 섹션 자체 미렌더.

### 2. Category Comparison (Naver 5 카테고리 14일 멀티라인)

`snapshot.trends.naver.categoryTrends`의 5 카테고리 × 14일 데이터를 한 차트에 겹쳐 비교. NaverShoppingSection 안에 추가하거나 별도 섹션.

- **자체 SVG 멀티라인** (의존성 0, ADR-0010 정신과 정합).
- 5색 라인 + 범례 + 끝점 라벨.
- 호버 시 정확한 값(추가 없으면 작은 tooltip 또는 라벨만).
- 모바일은 가로 스크롤 또는 압축 버전.

### 3. 새 데이터/모델 변경 없음

- snapshot 구조 그대로. Movers는 빌드 시점에 어제 snapshot 추가 로드 후 비교.
- `loadByDate`·`listSnapshotDates`는 이미 `src/lib/data.ts`에 있음.
- 차트 라이브러리 도입 X (자체 SVG).

### 4. UI 위치

| 위치 | 내용 |
| - | - |
| 메인 페이지 — TrendingHero 직후 | `MoversSection` (KR / Global 2 컬럼) |
| 메인 페이지 — NaverShoppingSection 안 | 카테고리 헤더 영역에 `MultiLineChart` (5 라인) 작은 영역 |

## Consequences (결과)

**긍정**
- 사용자가 이미 본 키워드와 새로 뜬 키워드를 즉시 구분 → 매일 같은 사이트 와도 변화 인지.
- 외부 source·인증 추가 0 — 우리 누적 snapshot만 활용.
- 차트 라이브러리 의존성 0 — 번들 ↑ 없음.

**부정**
- 어제 snapshot 부재 시 Movers 빈 영역 — 운영 초기 며칠은 불완전. 1주일 누적 후 안정.
- 자체 SVG 차트는 hover tooltip·인터랙션 구현 비용 — v1엔 정적 표시만.
- 빌드 시점에 어제 snapshot 한 번 더 읽음 — 빌드 시간·메모리 ↑ 미미.

**중립**
- 향후 7일·30일 변화도 가능 (Wikipedia history 활용). v2 후보.
- 워드클라우드·키워드 네트워크 등 더 깊은 분석은 별도 ADR.

## Alternatives Considered (대안)

- **Recharts/visx 차트 라이브러리 도입**: 풍부한 차트지만 ~30~50kb 추가. 단순 멀티라인엔 과잉.
- **API로 별도 변동 데이터**: Google·Naver 변동 API 없음. 자체 누적이 유일.
- **워드클라우드 우선**: 시각 임팩트는 좋지만 정보 가치는 movers 대비 ↓.
- **D 옵션 (키워드 통합 카드) 동시 진행**: 작업 양 ↑. B 먼저 완료 후 검토.

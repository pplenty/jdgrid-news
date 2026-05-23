# ADR-0024: 메인 페이지 영역 정리 — 콘텐츠 vs 분석 분리

- Status: Accepted
- Date: 2026-05-23
- Deciders: yusik
- Related: [ADR-0021](./0021-trend-as-main-hero.md), [ADR-0022](./0022-rebrand-to-trends.md), [ADR-0023](./0023-analytics-v1.md)

## Context (배경)

ADR-0021 이후 메인 페이지에 트렌드 콘텐츠와 분석 섹션이 누적되어 **7 섹션** 으로 길어짐:
1. TrendingHero
2. MoversSection
3. WikipediaSection
4. ItunesSection
5. NaverShoppingSection (+ 멀티라인 차트)
6. WordCloudSection (분석)
7. MediaCategorySection (분석)

스크롤 부담 ↑, 첫 인상이 무거워짐. 운영자 결정 (2026-05-23): 메인 페이지 영역 정리.

## Decision (결정)

### 메인 페이지는 "콘텐츠 source 중심"

| # | 섹션 | 성격 |
| - | - | - |
| 1 | TrendingHero | 검색 트렌드 hero |
| 2 | MoversSection | 변화 인사이트 (어제↔오늘 — 시각 임팩트 큼) |
| 3 | WikipediaSection | 지식 관심사 source |
| 4 | ItunesSection | 음악·앱 source |
| 5 | NaverShoppingSection | 쇼핑 source (+카테고리 차트 그대로) |

→ **5 섹션** (Movers 포함 트렌드 + 4 콘텐츠 source). 분석 메타 정보는 별도 페이지.

### `/analytics` 페이지 신설 — 메타 분석 모음

- WordCloudSection (자체 키워드 빈도)
- MediaCategorySection (매체×카테고리 분포)
- 향후 추가 분석 (Wiki 7일 변동률 leaderboard, 키워드 클러스터 등)도 이쪽에 누적.
- 메인의 변화 인사이트(Movers, Wiki 변동률 배지)는 그대로 유지 — 첫 인상에서 변화 신호는 필요.

### 사이드바 메뉴 재정렬

기존 "카테고리" 영역 헤더 옆에 `Headlines →` 만 있던 빠른 링크 → 작은 메뉴 영역 신설:

```
빠른 이동
  · Headlines    (헤드라인 인덱스)
  · Trends 상세  (카테고리별 trend stories)
  · Analytics    (메타 분석)
─────────────
카테고리 (...)
```

### 푸터 About 컬럼에도 `/analytics` 추가

링크 4개: 소개·면책 / Headlines / Trends 상세 / **Analytics** / Contact.

## Consequences (결과)

**긍정**
- 메인 첫 인상 가벼움 — 5 콘텐츠 섹션만 보임, 스크롤 부담 ↓.
- 분석 페이지 별도 운영 → 향후 분석 추가 시 메인 부담 없이 누적.
- "메타 분석"이라는 별도 카테고리 — 사용자가 의도적으로 들어가서 정보 밀도 ↑.

**부정**
- 사용자가 `/analytics` 페이지 존재를 모르면 분석 접근 안 함 → 사이드바·푸터 노출 필수.
- 분석 페이지 추가 빌드 대상 (정적 export 1 페이지 ↑) — 비용 미미.

**중립**
- /analytics 와 /trends 가 둘 다 분석성 페이지. 차이는 /trends = 카테고리별 trend story, /analytics = 메타 통계.
- 향후 둘 통합 가능 (탭 형태 등). v2 검토.

## Alternatives Considered (대안)

- **메인에서 분석 섹션 압축 표시 (collapsible)**: 클릭 인터랙션 필요. 정적 export 환경에서 client component 추가 비용. /analytics 분리가 더 깔끔.
- **메인 페이지 탭화** (콘텐츠/분석 탭): 큰 UI 변경. v2 후보.
- **현 상태 유지**: 운영자 요구 미충족 (페이지 길어짐).
- **분석 영역을 /trends 페이지에 통합**: /trends 페이지 정체성(카테고리별 trend story)와 결이 다름.

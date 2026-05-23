# ADR-0028: `/k/[keyword]` — 키워드 통합 카드 (signals + Wikipedia + 매체 분포)

- Status: Accepted
- Date: 2026-05-23
- Deciders: yusik
- Related: [ADR-0016](./0016-trend-enrichment-google.md), [ADR-0018](./0018-trend-fallback-self-categorize-wikipedia.md), [ADR-0019](./0019-wikipedia-sparkline.md), [ADR-0023](./0023-analytics-v1.md)

## Context (배경)

`/k/[keyword]` 페이지는 현재 두 섹션만 보여줌:
- "우리가 매칭한 기사" (매체 매칭)
- "Google이 큐레이션한 외부 기사" (`googleArticles`)

같은 키워드에 대해 우리는 여러 신호를 이미 가지고 있는데(traffic, picture, Wikipedia 페이지뷰 추이, 매체 분포 등) 한 페이지에 통합 안 됨. D 갈래 (사용자 자율 위임): **키워드 통합 카드**.

## Decision (결정)

페이지를 3단으로 재구성:

### 1. 헤더 + 시그널 요약

기존 헤더(keyword + traffic 배지 + description)에 **signal chips** 추가:

| 시그널 | 출처 | 표시 |
| - | - | - |
| Traffic | Google Daily Trends (`Trend.traffic`) | `📈 200+` |
| Wikipedia | snapshot.trends.wikipedia.ko/en에 정확 일치 항목 | `📚 한국어 위키 29K views` |
| 우리 매체 | `findArticlesByKeyword` 결과 카운트 | `📰 12건 매칭` |
| Google 큐레이션 | `Trend.googleArticles?.length` | `🌐 5 외부 기사` |

각 chip은 작은 카드. 0이거나 데이터 없으면 표시 안 함.

### 2. Wikipedia 미니 카드 (있을 때)

위키 매칭이 있으면 별도 영역:
- 페이지 제목 + 어제 views + sparkline (7일치, ADR-0019 데이터 재사용)
- 위키피디아 문서 열기 외부 링크

ko·en 둘 다 있으면 둘 다 카드.

### 3. 매체별 분포 (우리 매칭 기사 있을 때)

`ourArticles`를 매체별로 그룹핑 → 작은 horizontal stacked bar 또는 칩 리스트.

```
매체 분포: [한겨레 8] [연합뉴스 3] [조선일보 1]
```

### 4. 기존 두 섹션 (변화 X)

- 우리 매체 매칭 기사 그리드
- Google 큐레이션 기사 리스트

### Naver는 통합 X (이번엔)

Naver DataLab의 검색 키워드 트렌드 API는 키워드별 fetch가 필요. 빌드 시점에 키워드 40개 × 시계열 호출은 cron 부담 ↑. v2 후보로 보류.

## Consequences (결과)

**긍정**
- 한 키워드에 대한 다중 신호를 한 페이지에서 즉시 확인.
- Wikipedia history sparkline은 ADR-0019 데이터 재사용 — 추가 fetch 0.
- 시그널 chip은 빈 경우 자동 숨김 → 화면 깨끗.

**부정**
- 같은 키워드가 Google Trends와 Wikipedia에 정확히 일치하지 않으면 매칭 누락. 정확 매칭만 시도.
- 매체 분포 mini bar는 한 두 매체 비중 시 시각 가치 ↓.

**중립**
- Naver 검색 키워드 트렌드 API 통합은 v2.
- 한 카드 안에 시그널이 많아져 정보 밀도 ↑ — 모바일에선 세로 길이 늘어남.

## Alternatives Considered (대안)

- **Naver 키워드 트렌드 fetch 통합**: 키워드별 cron 부담. v2.
- **Recharts 같은 차트 라이브러리 도입**: sparkline은 이미 자체 SVG로 충분.
- **현 상태 유지**: 다중 신호 활용 못함, 사용자 자율 진행 의도 미충족.

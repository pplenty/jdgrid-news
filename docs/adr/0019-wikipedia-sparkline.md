# ADR-0019: Wikipedia 인기 문서 7일 historical sparkline

- Status: Accepted
- Date: 2026-05-22
- Deciders: yusik
- Related: [ADR-0018](./0018-trend-fallback-self-categorize-wikipedia.md)

## Context (배경)

ADR-0018에서 Wikipedia Pageviews top을 단일 일자 스냅샷으로 도입했다. 운영자 피드백 (2026-05-22) — "구조 고도화 / 시간 흐름 시각화"가 다음 갈래.

Wikimedia REST API는 per-article daily series를 무료/무인증으로 제공:

```
GET https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/
    {project}/all-access/all-agents/{article}/daily/{startYYYYMMDD}/{endYYYYMMDD}
```

응답: `items[]` 각각 `{ timestamp, views, ... }`. 단 article 하나당 한 요청.

## Decision (결정)

### 데이터 모델

`WikiTrend.history?: HistoryPoint[]` 옵셔널 필드 추가:

```ts
export type HistoryPoint = { date: string; views: number };  // YYYY-MM-DD

export type WikiTrend = {
  title: string;
  views: number;
  url: string;
  thumbnail?: string;
  description?: string;
  history?: HistoryPoint[];  // 추가 — 지난 7일 일자별 views
};
```

### Fetch 정책

- **top 10개** (한·영 각 10 = 총 20 article) 에 대해서만 historical fetch.
- 지난 7일 (Wikimedia 데이터 안정성 고려해 어제 기준으로 8일 전 ~ 어제).
- 5개씩 chunk로 병렬 (Wikimedia API에 친화적인 페이스).
- 개별 article fetch 실패 시 graceful — 그 article만 `history: undefined`, 다른 article은 계속.

### UI

- `WikipediaSection`의 리스트 항목 오른쪽 끝에 **16px 높이 × ~50px 폭** sparkline (inline SVG polyline) 추가.
- `history` 없으면 sparkline 영역 비움 (rank/title/views/space 구조 유지).
- Sparkline은 단색 stroke, currentColor 사용 — 라이트/다크 모드 자연 대응.

### Wikipedia top 11~20개는?

- snapshot에 그대로 보존 (views 정보만).
- sparkline 없음 — fetch 부담 감소가 우선. 추후 필요해지면 20개 전부로 확장.

## Consequences (결과)

**긍정**
- "이 문서가 며칠째 인기인지 / 갑자기 튀어 오른 건지" 시각적으로 파악.
- 추가 외부 의존성 0 (Wikimedia 같은 source의 같은 API 시리즈).
- 빌드/클라이언트 부담 0 (sparkline 데이터는 snapshot.json에 박힘, 빌드 시점에 SVG 그림).

**부정**
- cron 시간 ~3~5초 추가 (20 article × 200~300ms, 5씩 병렬).
- Wikimedia API rate limit (공식 무제한이지만 친화적 사용 권장) — 5씩 chunk로 완화.
- 작은 sparkline은 모바일에서 식별 어려울 수 있음 — 폭 조정 가능.

**중립**
- 11~20위는 sparkline 없이 평문. 보강 후보.
- Daily Trends 키워드별 historical은 위키 article 매칭률 낮아 별도 작업 (비공식 Google API 부담).

## Alternatives Considered (대안)

- **top 20개 전부 historical**: 부담 2배. v1엔 10개로.
- **클라이언트 fetch**: 정적 export(ADR-0002)와 정합 X.
- **Daily Trends 키워드의 Wikipedia 매칭**: 키워드가 정확한 위키 article 제목으로 매칭되는 비율이 낮음. 시도 가치보다 비용 ↑.
- **Google Trends Interest over time**: 비공식 endpoint, ADR-0017에서 폐지 확인 흐름과 같은 리스크.

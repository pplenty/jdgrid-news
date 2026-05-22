# ADR-0021: 메인 페이지 비중 재배치 — 트렌드를 hero 영역으로

- Status: Accepted
- Date: 2026-05-22
- Deciders: yusik
- Related: [ADR-0009](./0009-ui-layout-sidebar.md), [ADR-0016](./0016-trend-enrichment-google.md), [ADR-0018](./0018-trend-fallback-self-categorize-wikipedia.md), [ADR-0020](./0020-naver-datalab-shopping.md)

## Context (배경)

운영자 피드백 (2026-05-22): "트렌드 기능 너무 좋다. 이걸 메인 기능으로 좀 고도화할 수도 있나?"

ADR-0009는 메인 페이지의 첫 인상을 "헤드라인 인덱스" 로 디자인했다 — TrendingBanner는 상단 띠(좁고 강조 약함), 그 아래 TOP STORIES와 카테고리 그리드가 본문이었다. 트렌드 풍부화(ADR-0016/0018/0019/0020)로 데이터가 깊어지면서 트렌드 영역의 정보 가치가 헤드라인을 넘어섰음. 첫 인상을 재배치할 필요.

운영자 단계 결정 (A → B → C 흐름 중 A 선택): **메인 영역 비중 재배치 먼저** — 코드 변경 최소화, 시각 효과 ↑.

## Decision (결정)

### 새 메인 페이지 영역 순서

```
1. 🔥 오늘의 트렌드 (HERO)
     KR top 5 큰 카드 + Global top 5 큰 카드 + 각 키워드 picture·traffic·매체
     강조 톤 (subtle gradient 배경, 패딩 ↑, 폰트 ↑)
     "카테고리별 상세" 링크 → /trends
2. 📚 위키피디아 관심사 (그대로)
3. 🛍 쇼핑 트렌드 (그대로)
4. ⭐ TOP STORIES (헤드라인, 보조 톤으로 약간 후순위)
5. 카테고리별 4-카드 그리드 × 7
```

### TrendingHero 신설

- 새 컴포넌트 `src/app/_components/TrendingHero.tsx`.
- props: `{ kr: Trend[]; global: Trend[]; date: string }`.
- 레이아웃: 2-column 그리드 (KR / Global). 모바일 1-column.
- 카드: 순위 + picture(48~56px) + 키워드(굵게, 큰 폰트) + `{traffic} · {매체}` 부제 + 매칭 기사 수.
- 톤: 메인의 첫 인상이라 subtle gradient 배경(accent-subtle/40 → transparent), 패딩 큼, h1 사이즈.

### TrendingBanner 유지

- `/d/[date]` 같은 보조 페이지에서는 기존 `TrendingBanner` 그대로 사용.
- 즉 메인 페이지만 hero로 승격. 다른 페이지는 영향 X.

### 헤드라인 영역 톤 조정

- "TOP STORIES" 섹션 헤더 폰트 그대로, 위치만 hero/wiki/naver 다음으로.
- 카테고리 그리드는 그대로 (좋은 정보 밀도).

## Consequences (결과)

**긍정**
- 첫 인상이 "오늘의 한국·세계 트렌드"로 바뀜 — 운영자 의도와 일치.
- 트렌드 picture + traffic이 메인에 큰 시각으로 노출 → 풍부화 효과 첫 화면에 드러남.
- 헤드라인은 위치 후순위지만 그대로 노출 — 사용자가 스크롤하면 본다.
- TrendingBanner는 유지되어 보조 페이지엔 변화 없음 — regression 위험 ↓.

**부정**
- "헤드라인 인덱스/큐레이션"이라는 ADR-0007의 사이트 정체성 묘사와 살짝 결이 다름 (트렌드 인사이트 사이트로 가까워짐) — 본질은 그대로 (헤드라인+요약+링크), 첫 화면 배치만 변경.
- Hero 영역이 모바일에서 길어짐 → 헤드라인까지 스크롤 거리 늘어남. 모바일 hero는 압축 디자인 필요.

**중립**
- TrendingHero와 TrendingBanner 두 컴포넌트 공존 — 향후 통합 검토.
- 더 큰 고도화(B 변동률·비교 그래프, C 새 source)는 본 ADR과 별개로 후속.

## Alternatives Considered (대안)

- **메인 페이지 전체를 /trends 같은 구조로 (B)**: 큰 변화. 헤드라인 위치 약화 너무 강함. v1에는 과함.
- **TrendingBanner 그대로 두고 강조만**: 영역 비중이 그대로라 사용자 의도 미충족.
- **헤드라인 페이지를 /headlines로 옮기고 `/`는 trend dashboard**: 라우트 큰 변화. 정적 export·기존 SEO 영향. v2 후보.
- **A + B 동시 진행**: 한 번에 너무 많이. A부터 시작이 운영자 결정.

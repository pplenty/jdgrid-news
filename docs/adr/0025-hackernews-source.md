# ADR-0025: Hacker News Top — 영문 Tech 트렌드 source 추가

- Status: Accepted
- Date: 2026-05-23
- Deciders: yusik
- Related: [ADR-0005](./0005-data-sources-rss-google-trends.md), [ADR-0007](./0007-content-policy-headline-curation.md)

## Context (배경)

운영자가 새 source 추가(C 갈래)를 선택. 가장 무리 없이 시작할 후보:

| Source | 인증 | 한국 적합도 | 안정성 |
| - | - | - | - |
| **Hacker News (Algolia)** | ✗ 무인증 | ★ 영문 tech 위주 | ★★★ Algolia 호스팅 |
| YouTube Korea Trending | API key 발급 | ★★★ 한국 친화 | ★★ |
| NYT Best Sellers | API key 발급 | ★ 영문 도서 | ★★ |
| Reddit r/all/top | User-Agent만 | ★ 영문 | ★★ (정책 변동) |
| Product Hunt | RSS/JSON | ★ 영문 SaaS | ★★ |

첫 추가는 **무인증·즉시 가능**한 HN으로 시작. 결과 보고 추가 source 결정.

## Decision (결정)

### Endpoint

Algolia HN Search API:

```
GET https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=20
```

- 무료, 무인증, 매우 안정 (Algolia가 운영).
- 응답: `hits[]` 각각 `objectID / title / url / points / num_comments / author / created_at`.
- 한 호출에 top 20 — 매체별 카테고리 RSS 같은 다중 호출 부담 X.
- `url`이 없는 self-post(Ask HN, Show HN 등)는 `https://news.ycombinator.com/item?id={id}` 로 fallback.

### 데이터 모델

```ts
export type HackerNewsStory = {
  /** HN item id. */
  id: number;
  title: string;
  /** 외부 링크 또는 self-post HN URL. */
  url: string;
  points: number;
  numComments: number;
  author: string;
  createdAt: string;
};

// DailySnapshot 확장
trends: {
  ...,
  hackernews?: HackerNewsStory[];
};
```

### UI 위치·디자인

- 메인 페이지 **`ItunesSection` 다음** 에 새 섹션 `🟧 Hacker News Top`.
- 톤: iTunes/Wikipedia와 비슷한 list — 순위·제목·points·comments·작성자.
- 외부 링크 새 탭, `referrerPolicy="no-referrer"`.
- ADR-0007 정합: 제목·URL·메타데이터(points/comments/author/createdAt)만 저장, 본문 X.

### Footer 갱신

Footer `Data Sources` 컬럼에 `🟧 Hacker News` 1줄 추가.

## Consequences (결과)

**긍정**
- 무인증·무료·매우 안정. 운영자 등록 부담 0.
- Tech·startup·OSS 트렌드 — 한국 사용자에게도 가치 (개발자 비중).
- 한 호출 → 빠름. cron 시간 영향 미미.

**부정**
- 영문 위주 — 한국 사용자에게 결이 다를 수 있음. 한 섹션 정도가 적당.
- HN front_page는 정치·문화 토픽도 종종 포함 (보통 tech 위주이지만 변동성).
- Algolia HN API의 가용성은 community 운영 의존 — 막힐 가능성은 매우 낮으나 0은 아님.

**중립**
- HN은 영어권 tech 커뮤니티 단일 신호 — 다양성 ↑를 원하면 후속 source(YouTube·NYT 등) 추가.
- 한국어 번역·요약은 안 함 (ADR-0007 자체 가공 금지 정신).

## Alternatives Considered (대안)

- **Firebase HN API**: top story ID 리스트 + 개별 item 호출 (~30 호출). Algolia 한 호출이 효율 ↑.
- **YouTube Korea Trending 우선**: 한국 친화 ↑이지만 API key 발급 필요. 운영자 등록 부담 있어 HN 다음 검토.
- **Reddit r/all/top**: 무인증이지만 정책 변동성·User-Agent 검증 필요. HN보다 신호 정제도 ↓.
- **NYT Books**: 영문 도서 트렌드. tech 차원과 결이 다름, HN과 별도 source로 추가 가능.

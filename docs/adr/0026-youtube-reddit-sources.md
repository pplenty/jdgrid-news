# ADR-0026: YouTube Korea + Reddit Top — 영상·커뮤니티 트렌드 source

- Status: Accepted
- Date: 2026-05-23
- Deciders: yusik
- Related: [ADR-0005](./0005-data-sources-rss-google-trends.md), [ADR-0007](./0007-content-policy-headline-curation.md), [ADR-0020](./0020-naver-datalab-shopping.md), [ADR-0025](./0025-hackernews-source.md)

## Context (배경)

ADR-0025 (Hacker News) 이후 추가 source 두 갈래:
- **YouTube Korea Trending** — 영상 차원, 한국 친화 ↑. API key 발급 필요(무료 quota).
- **Reddit r/all/top** — 영문 커뮤니티, 무인증 (User-Agent만).

운영자 결정 (2026-05-23): 둘 다 차례로 도입.

## Decision (결정)

### 1. YouTube Korea Trending

- Endpoint: `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode=KR&maxResults=20&key={KEY}`
- API key 환경변수: `YOUTUBE_API_KEY` (없으면 graceful skip)
- quota: `videos.list = 1 unit`, 일 quota 10,000 → 매일 1회 호출 안전 여유.
- 데이터: `items[].id / snippet.title / snippet.channelTitle / snippet.thumbnails.high.url / snippet.publishedAt / statistics.{viewCount,likeCount,commentCount}`.
- URL: `https://www.youtube.com/watch?v={id}`.

### 2. Reddit r/all/top

- Endpoint: `https://www.reddit.com/r/all/top.json?t=day&limit=25`
- User-Agent 검증 필수: `jdgrid-trends/0.1 (https://trends.jdgrid.com)`
- 무인증·무료. 단 Reddit 정책 변동 가능 (ADR-0005 §RSS-only 정신과 비슷한 리스크).
- 데이터: `data.children[].data.{id, title, subreddit, url, permalink, score, num_comments, thumbnail, created_utc}`.
- thumbnail이 `self / default / nsfw / ""` 같은 sentinel이면 미사용.
- 외부 링크는 `url`, Reddit 토론은 `https://www.reddit.com{permalink}`.

### 데이터 모델

```ts
export type YouTubeTrend = {
  id: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  url: string;            // youtube.com/watch?v={id}
  viewCount: number;
  likeCount: number;
  commentCount: number;
  publishedAt: string;
};

export type RedditPost = {
  id: string;
  title: string;
  subreddit: string;
  /** 외부 링크 (자체 게시글이면 reddit URL). */
  url: string;
  /** 토론 URL — reddit.com + permalink. */
  permalink: string;
  score: number;
  numComments: number;
  thumbnail?: string;
  createdAt: string;
};

// DailySnapshot 확장
trends: {
  ...,
  youtube?: YouTubeTrend[];
  reddit?: RedditPost[];
};
```

### UI 위치

- **YouTubeSection** — `ItunesSection` 다음 (한국 콘텐츠 묶음: Wiki ko · iTunes · YouTube KR).
- **RedditSection** — `HackerNewsSection` 다음 (영문 커뮤니티 묶음: HN · Reddit).
- 메인 흐름 (이제 8 콘텐츠 섹션):

  ```
  Hero → Movers → Wiki → iTunes → YouTube → HN → Reddit → Naver
  ```

### 운영자 작업 (YouTube)

1. Google Cloud Console → 새 프로젝트 또는 기존 프로젝트.
2. APIs & Services → YouTube Data API v3 활성화.
3. Credentials → Create API key → 복사.
4. GitHub Secrets에 `YOUTUBE_API_KEY` 등록.
5. 로컬은 `.env.local`.

### ADR-0007 정합

- YouTube: title·channel·thumbnail·URL·count 메타데이터만 저장. 본문(영상 description) 저장 X.
- Reddit: title·subreddit·URL·thumbnail·메타데이터만. 본문(self-text) 저장 X.

## Consequences (결과)

**긍정**
- 영상 차원 (YouTube) — K-POP·예능·게임 등 다른 트렌드 신호.
- 영문 커뮤니티 차원 (Reddit) — 시사·문화·기술 종합.
- 둘 다 환경변수 부재 시 graceful skip → 운영자 미발급 상태에서도 빌드·메인 페이지 정상 동작.

**부정**
- YouTube API key 운영자 발급 부담 (한 번).
- Reddit 정책 변동 가능 — User-Agent 차단·API 제한 발생 시 대응 필요.
- 메인 페이지 8 섹션 누적 → 가시성 ↓. ADR-0024 후속 정리 검토 필요.

**중립**
- YouTube thumbnail은 Google CDN 핫링크. ADR-0007 정신과 정합.
- Reddit thumbnail은 sentinel 값(`self`, `default`) 자주 등장 → 사실상 미표시 비율 높음.

## Alternatives Considered (대안)

- **NYT Books / Spotify**: 음악·도서 차원이지만 한국 친화 ↓ 또는 OAuth 부담.
- **공공데이터포털**: 통계 위주, 일상 트렌드와 결이 다름.
- **Twitter/X v2**: 유료 ($100/mo) — 명시적 배제.
- **Product Hunt**: 신제품 차원, 영문 SaaS 위주. YouTube·Reddit 다음 후보.

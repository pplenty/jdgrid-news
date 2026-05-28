# jdgrid-news — 프로젝트 플랜

> 매일 한 페이지에서 국내/해외 주요 뉴스와 관심 키워드를 한눈에 보는 뉴스 대시보드.

- 상태: Draft (v0.1)
- 작성일: 2026-05-21
- 저장소: https://github.com/pplenty/jdgrid-news
- 도메인: https://trends.jdgrid.com ([ADR-0022](./adr/0022-rebrand-to-trends.md)) — ADR-0012 (`news.jdgrid.com`)의 supersede

---

## 1. 목표

1. **하루 1회 갱신되는 뉴스 대시보드**를 운영해 본인 + 일반 방문자가 5분 안에 "오늘 세상이 어떻게 돌아가는지" 파악할 수 있게 한다.
2. **국내/해외 구분 없이** 카테고리별로 주요 헤드라인을 한 화면에 모은다.
3. **글로벌 + 국내 관심 키워드**를 시각화해 "지금 사람들이 뭘 검색·이야기하는지" 즉시 보여준다.
4. 운영 비용은 **0원에 수렴**, 유지보수 부담을 최소화한다 (단일 운영자 가정).

### 비목표 (Non-goals)

- 실시간(분 단위) 속보 — 매일 1~2회 배치면 충분.
- 본문 전체 수집/저장 — 헤드라인 + 요약 + 원문 링크까지만.
- 회원/댓글/구독 — v1 범위 밖.
- 뉴스 추천/개인화 — v1 범위 밖.

---

## 2. 사용자 시나리오

- **아침 출근 전 1분**: 메인 페이지를 열면 카테고리별 톱 헤드라인 + 글로벌/국내 트렌딩 키워드를 본다.
- **특정 주제 빠른 확인**: "IT", "세계" 같은 카테고리 탭으로 더 깊이 본다.
- **트렌드 추적**: 트렌딩 키워드 클릭 → 해당 키워드가 등장한 오늘자 기사 목록을 본다.
- **어제 흐름 비교**: 날짜 셀렉터로 과거 일자의 메인 페이지를 그대로 다시 본다.

---

## 3. 시스템 구성 (High-level)

```
┌────────────────────┐     ┌───────────────────────┐     ┌────────────────────┐
│ GitHub Actions cron│     │ scraper/ (Node)       │     │ data/ (Git)        │
│  매일 21:00 UTC    │ ──▶ │  - RSS fetch          │ ──▶ │  YYYY-MM-DD.json   │
│  (KST 06:00)       │     │  - Google Trends RSS  │     │  latest.json       │
└────────────────────┘     │  - 키워드 빈도 추출   │     │  trends.json       │
                           └───────────────────────┘     └─────────┬──────────┘
                                                                   │ git push
                                                                   ▼
                                              ┌────────────────────────────────┐
                                              │ Cloudflare Pages (GitHub 연동) │
                                              │  Next.js static export 자동빌드│
                                              └────────────────────────────────┘
```

- **수집**: GitHub Actions cron이 `scraper/` 스크립트를 매일 실행. RSS + Google Trends RSS를 받아 정규화 후 `data/`에 JSON 커밋.
- **저장**: DB 없음. 일자별 JSON 파일 + 가장 최근 스냅샷(`latest.json`).
- **표시**: Next.js (App Router) **static export**로 정적 HTML 생성. Cloudflare Pages가 `main` push마다 자동 빌드/배포.

상세 결정은 ADR 참고 (§7).

---

## 4. 데이터 모델 (초안)

`data/YYYY-MM-DD.json`:

```json
{
  "generatedAt": "2026-05-21T21:00:00Z",
  "categories": [
    {
      "id": "world",
      "label": "세계",
      "items": [
        {
          "id": "sha1(url)",
          "title": "...",
          "summary": "...",
          "url": "https://...",
          "source": "BBC",
          "publishedAt": "2026-05-21T18:30:00Z",
          "lang": "en",
          "imageUrl": "https://..."
        }
      ]
    }
  ],
  "trends": {
    "global": [{ "keyword": "...", "score": 0.92, "relatedUrls": [...] }],
    "kr":     [{ "keyword": "...", "score": 0.88, "relatedUrls": [...] }]
  }
}
```

- `id`는 URL 정규화 후 SHA1 앞 12자.
- 같은 기사가 여러 매체에서 나오면 제목 유사도 + URL 호스트 기준으로 1차 dedupe.

---

## 5. 카테고리 (확정 — [ADR-0008](./adr/0008-category-taxonomy.md) + [ADR-0032](./adr/0032-society-category.md))

영문 매체(BBC, Reuters, AP 등) RSS 분류 + 한국 매체 사회 카테고리 합한 9개.

| id          | label (KR) | label (EN) | 비고                                     |
| ----------- | ---------- | ---------- | ---------------------------------------- |
| `top`       | 종합       | Top        | 각 카테고리 상위 N건을 가중 집계해 자동 생성 |
| `world`     | 세계       | World      | 국제 일반                                |
| `politics`  | 정치       | Politics   | 국내·국제 정치 통합                      |
| `society`   | 사회       | Society    | 국내 사회·사건사고·교육·복지 (ADR-0032)  |
| `business`  | 경제       | Business   | 산업·금융·시장                           |
| `tech`      | 기술       | Tech       | 빅테크·AI·SW                             |
| `science`   | 과학       | Science    | 연구·환경·기후 포함                      |
| `sports`    | 스포츠     | Sports     | 국내·해외                                |
| `culture`   | 문화       | Culture    | 예술·연예·라이프스타일                   |

- **단일 분류** — 한 기사 = 한 카테고리. 충돌 시 우선순위: `politics > society > business > world > tech > science > sports > culture`.
- **매체 RSS → 우리 카테고리** 매핑은 `scraper/sources.ts`에 선언적으로 박는다.
- 매체가 통합 RSS만 제공하면 `top` 후보로만 사용 (가중 집계 입력). 룰 기반 분류는 v1 이후.

---

## 6. 페이지 구성 — [ADR-0009](./adr/0009-ui-layout-sidebar.md)

### 공통 레이아웃

- **데스크탑**: 좌측 사이드바 (가변 폭, 기본 ~256px) + 메인 콘텐츠 2단.
- **모바일**: 헤더 ☰ → 좌측 슬라이드 드로어로 사이드바 전환.
- **사이드바**: CATEGORIES(옆에 오늘자 기사 수 `(N)`) + TRENDING(🌐 Global / 🇰🇷 Korea 칩) + About/GitHub.
- **헤더**: 로고 + 우상단 액션(날짜 셀렉터 · 테마 토글 ☾/☀).
- **테마**: 시스템 `prefers-color-scheme` follow + 사용자 토글 (LocalStorage 저장).
- **타이포**: 산세리프 + 가독성 우선 톤 (Pretendard 또는 Inter+Noto Sans KR 후보).

### 페이지 라우트

| 경로                | 설명                                                              |
| ------------------- | ----------------------------------------------------------------- |
| `/`                 | 오늘자 대시보드. 상단 TRENDING 띠 + TOP STORIES + 카테고리별 4-카드. |
| `/c/[category]`     | 해당 카테고리 오늘자 전체 목록 (가로형 카드 리스트).                |
| `/k/[keyword]`      | 트렌딩 키워드 클릭. 오늘자 기사 중 키워드 매칭된 목록.              |
| `/d/[date]`         | 과거 일자 메인 (빌드 시 최근 30~90일치 생성).                       |
| `/about`            | 데이터 출처·면책·운영 정보.                                         |

### 메인 페이지 와이어프레임 (`/`)

```
┌──────────────────────┬──────────────────────────────────────────────┐
│ jdgrid·news       ⚙  │  헤더: 로고만, 우상단에 날짜 ▼  ☾/☀          │
├──────────────────────┼──────────────────────────────────────────────┤
│ 📰 CATEGORIES        │  🔥 TRENDING (상단 띠, 큰 글씨, 강조)         │
│ ▸ Top         (32)   │  🌐 #G7  #Trump-tariff  #AI-safety  …         │
│   World       (24)   │  🇰🇷 #SK하이닉스  #총선  #금리인하  …         │
│   Politics    (18)   ├──────────────────────────────────────────────┤
│   Business    (21)   │  TOP STORIES · 2026-05-21                    │
│   Tech        (16)   │  ┌────────────────┐ ┌──────────┐ ┌──────────┐│
│   Science     (12)   │  │ [hero thumb]   │ │ [thumb]  │ │ [thumb]  ││
│   Sports      (19)   │  │ Big headline   │ │ Headline │ │ Headline ││
│   Culture     (14)   │  │ Reuters · 2h   │ │ BBC · 3h │ │ AP · 4h  ││
│                      │  │ short summary  │ │ summary  │ │ summary  ││
│ ──────────────────   │  └────────────────┘ └──────────┘ └──────────┘│
│ 🔥 TRENDING (참조)    ├──────────────────────────────────────────────┤
│ 🌐 Global            │  🌍 WORLD                        [모두 보기 →]│
│   #G7 summit         │  ┌────────┐┌────────┐┌────────┐┌────────┐    │
│   #Trump tariff      │  │ thumb  ││ thumb  ││ thumb  ││ thumb  │    │
│ 🇰🇷 Korea             │  │ title  ││ title  ││ title  ││ title  │    │
│   #SK하이닉스         │  │ src·t  ││ src·t  ││ src·t  ││ src·t  │    │
│   #총선              │  └────────┘└────────┘└────────┘└────────┘    │
│                      ├──────────────────────────────────────────────┤
│ ──────────────────   │  🏛 POLITICS / 💼 BUSINESS / 🤖 TECH / …     │
│ About                │  (각각 4-카드 그리드 반복)                    │
│ GitHub               ├──────────────────────────────────────────────┤
│                      │  Footer: 출처 · 면책 · About · GitHub        │
└──────────────────────┴──────────────────────────────────────────────┘
```

- **TRENDING 중복 노출**: 메인 상단 띠는 강조용 (큰 글씨, 시각 임팩트). 사이드바 하단은 참조용 (다른 페이지에서도 항상 보임). 카테고리/키워드 페이지엔 상단 띠 없음.
- 카드 4개 그리드는 모바일에서 1~2열로 reflow.

### 모바일 와이어프레임

```
┌─────────────────────┐         ┌─────────────────────┐
│ ☰  jdgrid·news  ☾  │         │ ✕  jdgrid·news      │
├─────────────────────┤         ├─────────────────────┤
│ 🔥 TRENDING          │         │ 📰 CATEGORIES        │
│ #G7 #SK하이닉스 …    │         │   Top         (32)  │
├─────────────────────┤         │   World       (24)  │
│ TOP STORIES         │         │   Politics    (18)  │
│ ┌─────────────────┐ │         │   …                 │
│ │ [hero]          │ │         │ ──────────────────  │
│ │ Headline        │ │  (☰)→  │ 🔥 TRENDING          │
│ │ Reuters · 2h    │ │         │   #G7 summit        │
│ └─────────────────┘ │         │   #SK하이닉스       │
│ ┌─────────────────┐ │         │ ──────────────────  │
│ │ [thumb] title   │ │         │ About               │
│ └─────────────────┘ │         │ GitHub              │
│ 🌍 WORLD       모두→│         └─────────────────────┘
│ ...                 │
└─────────────────────┘
```

- 모바일에선 상단 TRENDING은 한 줄로 압축. 사이드바는 ☰로 호출 시 전체 노출.
- 카테고리 페이지·키워드 페이지에선 상단 TRENDING 띠 생략, 사이드바 트렌딩만 유지.

---

## 7. ADR 인덱스

- [ADR-0001 — Record architecture decisions](./adr/0001-record-architecture-decisions.md)
- [ADR-0002 — Frontend: Next.js (App Router) + Static Export](./adr/0002-frontend-nextjs-static-export.md)
- [ADR-0003 — Hosting: Cloudflare Pages](./adr/0003-hosting-cloudflare-pages.md)
- [ADR-0004 — Data Storage: Git에 일자별 JSON (DB 없음)](./adr/0004-data-storage-git-json.md)
- [ADR-0005 — Data Sources: RSS + Google Trends RSS](./adr/0005-data-sources-rss-google-trends.md)
- [ADR-0006 — Scheduling: GitHub Actions cron](./adr/0006-scheduling-github-actions-cron.md)
- [ADR-0007 — Content Policy: 헤드라인 인덱스/큐레이션 (전문 저장·재가공 금지)](./adr/0007-content-policy-headline-curation.md)
- [ADR-0008 — Category Taxonomy: 영문 매체 기준 8분류 + top 자동 집계 + 단일 분류](./adr/0008-category-taxonomy.md)
- [ADR-0009 — UI Layout: 사이드바 중심 (yutils 일관성, 가변 폭)](./adr/0009-ui-layout-sidebar.md)
- [ADR-0010 — Dev Environment: pnpm + Node 22 LTS + TS strict + ESLint·Prettier](./adr/0010-dev-environment.md)
- [ADR-0011 — Repo Structure: 단일 패키지 + `src/` 디렉토리 분리](./adr/0011-repo-structure.md)
- [ADR-0012 — Domain: news.jdgrid.com](./adr/0012-domain.md)
- [ADR-0013 — RSS Sources v1: 해외 6 + 국내 6](./adr/0013-rss-sources-v1.md)
- [ADR-0014 — Keyword Extraction v0: 단순 빈도 + 조사 stripping + 정확 매칭](./adr/0014-keyword-extraction-v0.md)
- [ADR-0015 — UI Implementation Details: Pretendard + lucide-react + 16:9 카드](./adr/0015-ui-implementation-details.md)
- [ADR-0016 — Trend Enrichment v1: Google RSS ht:news_item + ht:approx_traffic + picture](./adr/0016-trend-enrichment-google.md)
- [ADR-0017 — Realtime Trends Categories: Google realtime API cat=b/e/m/t/s/h + /trends 페이지](./adr/0017-realtime-trends-categories.md)
- [ADR-0018 — Trend Source Fallback: 자체 분류 + Wikipedia Pageviews (ADR-0017 보완)](./adr/0018-trend-fallback-self-categorize-wikipedia.md)
- [ADR-0019 — Wikipedia Sparkline: top 10 7일 historical](./adr/0019-wikipedia-sparkline.md)
- [ADR-0020 — Naver DataLab Shopping: 분야별 + 큐레이션 키워드 트렌드](./adr/0020-naver-datalab-shopping.md)
- [ADR-0021 — Main Page Re-balance: 트렌드를 hero 영역으로](./adr/0021-trend-as-main-hero.md)
- [ADR-0022 — Rebrand to trends: 도메인·정체성·페이지 구조·별자리 모티프](./adr/0022-rebrand-to-trends.md)
- [ADR-0023 — Analytics v1: Movers + Category Comparison](./adr/0023-analytics-v1.md)
- [ADR-0024 — Main Page Cleanup: 콘텐츠 vs 분석 분리 (/analytics 신설)](./adr/0024-main-page-cleanup.md)
- [ADR-0025 — Hacker News Top: Algolia API, 영문 tech 트렌드 source](./adr/0025-hackernews-source.md)
- [ADR-0026 — YouTube Korea + Reddit Top: 영상·커뮤니티 source](./adr/0026-youtube-reddit-sources.md)
- [ADR-0027 — Ops: 실패 매체 교체 + dedupe v1 (Jaccard 0.8)](./adr/0027-ops-source-cleanup-dedupe.md)
- [ADR-0028 — Keyword Detail: signals + Wikipedia + 매체 분포](./adr/0028-keyword-detail-aggregation.md)
- [ADR-0029 — Cloudflare Workers Static Assets (ADR-0003 모드 supersede)](./adr/0029-cloudflare-workers-static-assets.md)
- [ADR-0030 — Yonhap 6 source 제거 + 동아·경향 분산 대체 (ADR-0013 부분 supersede)](./adr/0030-yonhap-replacement-donga-khan.md)
- [ADR-0031 — cron 2-time trigger (ADR-0006 supersede)](./adr/0031-cron-2time-trigger.md)
- [ADR-0032 — society 카테고리 추가 (ADR-0008 부분 supersede, 8→9 카테고리)](./adr/0032-society-category.md)
- [ADR-0033 — scraper HTTP 계층 공통화 + retry/backoff (fetch 유틸·config·KST 통일)](./adr/0033-scraper-http-layer-retry.md)
- [ADR-0034 — 단위 테스트 도입 (Vitest, 33 tests)](./adr/0034-unit-testing-vitest.md)
- [ADR-0035 — keyword extraction v1 형태소 명사 추출 (garu-ko WASM, ADR-0014 발전)](./adr/0035-keyword-extraction-v1-morphological.md)

---

## 8. 마일스톤

### M0 — 스캐폴딩 (1일)
- Next.js 15 + TypeScript + Tailwind 셋업, `output: 'export'` 설정.
- `scraper/` 디렉토리 + `data/` 디렉토리 + 더미 JSON.
- Cloudflare Pages 연결, "Hello world" 정적 페이지 배포.

### M1 — MVP 수집 파이프라인 (2~3일)
- `scraper/sources.ts`에 RSS 소스 10~15개 등록 (국내 5~7 + 해외 5~7).
- `pnpm scrape` 명령으로 로컬에서 `data/YYYY-MM-DD.json` 생성.
- Google Trends RSS (daily / KR + global) 통합.
- 키워드 빈도 추출 v0 (단순 토큰화 + 불용어).

### M2 — 자동화 (1일)
- GitHub Actions cron: 매일 KST 06:00에 scrape → commit → push.
- Cloudflare Pages가 push 감지하면 자동 재빌드.

### M3 — UI v1 (2~3일)
- 대시보드 페이지 (`/`)
- 카테고리/키워드/날짜 페이지
- 모바일 반응형

### M4 — 운영성/정합성 (지속)
- 중복 기사 dedupe 강화
- 매체별 카테고리 매핑 보정
- 키워드 추출 v1 (KoNLPy 또는 ngram + 동의어 결합)

---

## 9. 위험 & 미해결 이슈

| 항목                            | 위험                                                                   | 대응                                                                                    |
| ------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| RSS 차단/포맷 변경              | 일부 매체가 RSS를 변경하거나 비공식 차단                               | scrape 실패는 개별 매체 단위로 skip + 로그. 전체 실패 시 직전 `latest.json` 유지.       |
| Google Trends RSS 비공식 엔드포인트 | Google이 비공식 RSS를 막을 가능성                                      | 어댑터화. 차단 시 trendsmap/다른 신호로 교체 가능하게.                                  |
| 한국어 키워드 추출 품질         | 단순 빈도만으론 의미 없는 토큰이 상위에 옴 (조사, 부사 등)              | v0: 불용어 사전. v1: 형태소 분석 추가 검토.                                             |
| 저작권/면책                     | 헤드라인+요약+링크는 일반적으로 fair use지만 매체에 따라 클레임 가능   | [ADR-0007](./adr/0007-content-policy-headline-curation.md) — 5개 필드만 저장, 본문/자체 요약/이미지 재호스팅 금지. `/about`에 출처·면책 명시. |
| Cloudflare Pages 빌드 한도      | Free tier에 빌드 횟수 제한 (월 500회)                                  | 하루 1회 push면 월 30회 수준 — 여유 충분.                                               |
| 키워드 클릭 페이지의 카디널리티 | 매일 새 키워드 페이지가 무한히 늘면 빌드 시간/저장소 부담               | "오늘자" 기사만 인덱싱, 과거 키워드 페이지는 정적 생성하지 않음 (날짜 페이지로 흡수).   |

---

## 10. 다음 액션

1. **M0 ✓** — 첫 커밋 `8d9a97a` (35 files). 로컬 빌드/scrape 검증 완료. 남은 운영자 작업: `git push` + Cloudflare Pages 연결([ADR-0012](./adr/0012-domain.md)).
2. **M2 자동화 ✓ (워크플로우만)** — `.github/workflows/daily-scrape.yml` 작성([ADR-0006](./adr/0006-scheduling-github-actions-cron.md)). push 후 GitHub Actions 탭에서 `workflow_dispatch`로 1차 검증.
3. **M1 수집 파이프라인 구현** — `src/scraper/sources.ts`에 RSS URL 채우기([ADR-0013](./adr/0013-rss-sources-v1.md)), `src/scraper/index.ts` 본격 구현 (RSS fetch, 정규화, dedupe, 분류, 키워드 추출([ADR-0014](./adr/0014-keyword-extraction-v0.md)), `data/*.json` 쓰기).
4. **M3 UI 구현 시 결정** — 폰트(Pretendard vs Inter+Noto Sans KR), 카드 디자인 디테일, 빈 상태·404 페이지.
5. **운영 정착 후 결정** — About 본문, SEO 메타데이터, 모니터링, 저작권 클레임 매뉴얼.

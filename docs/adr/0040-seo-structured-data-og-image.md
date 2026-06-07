# ADR-0040: SEO 구조화 — JSON-LD + OG 이미지 + 검색엔진 등록

- Status: Accepted
- Date: 2026-06-08
- Deciders: yusik
- Related: [ADR-0002](./0002-frontend-nextjs-static-export.md), [ADR-0022](./0022-rebrand-to-trends.md), [ADR-0038](./0038-en-source-commerce-deals-filter.md), [ADR-0039](./0039-daily-trend-briefing.md)

## Context (배경)

AdSense 수익 = 트래픽 × 광고. 승인 게이트(ADR-0038/0039 콘텐츠·방침)를 닫은 뒤, 다음 레버는 **오가닉 트래픽**이다. 점검 결과 SEO 기반이 비어 있었다:

- **JSON-LD 구조화 데이터 전무** — 검색엔진이 사이트/목록/계층을 구조적으로 이해 못 함 (리치 결과·색인 품질 손해).
- **OG 이미지 없음** — 공유 시 썸네일 부재 → 소셜 CTR 손해.
- **Google Search Console 미등록** — 네이버만 등록(ADR 외 chore). 색인 현황·sitemap 제출 부재.

sitemap·robots 는 이미 존재(ADR-0022 후속). 이번엔 구조화 데이터 + OG + GSC.

## Decision (결정)

> 운영자 결정 (2026-06-08): **Tier 2 SEO 진행** — JSON-LD 구조화 데이터 + 빌드타임 OG 이미지 + Google Search Console 등록.

### 1. JSON-LD (`src/lib/jsonld.ts` 순수 빌더 + `_components/JsonLd.tsx` 렌더)

- **루트 layout**: `Organization` + `WebSite` `@graph` (발행자 정체성, 1회). `WebSite.publisher` → `Organization @id` 링크.
- **메인(/)**: `ItemList` — 오늘 트렌드 키워드(KR+global top, `/k` 페이지로 링크, 중복 제거).
- **카테고리(/c)·키워드(/k)**: `BreadcrumbList` (홈 > …).
- **`SearchAction` 보류** — 사이트에 자유 검색 엔드포인트가 없음(`/k` 는 사전생성 정확 키워드만). 가짜 검색 타깃은 무효/오해라 미포함. 검색 도입(Tier 4) 시 추가.
- **보안**: `JsonLd` 가 `<` → `<` 이스케이프 — 키워드 등 일부 값이 외부 RSS 유래라 `</script>` 주입 차단.

### 2. OG 이미지 (`src/app/opengraph-image.tsx`)

- **next/og `ImageResponse` 빌드타임 정적 생성** (`dynamic = 'force-static'` — output:export 필수). 루트 배치라 전 페이지 공통 og:image 자동 주입.
- **영문 브랜드 텍스트** — Satori 기본 폰트가 한글 미포함이라 글리프 깨짐 회피.
- **content-type**: 생성 파일이 확장자 없는 `out/opengraph-image` → Cloudflare 자동추론 실패 위험. `public/_headers` 로 `Content-Type: image/png` 명시(Workers Assets `_headers` 지원).

### 3. Google Search Console

- 네이버와 동일 메커니즘 — `metadata.verification.other['google-site-verification']` 메타(운영자 코드 수령 후 추가). sitemap `/sitemap.xml` 은 이미 준비됨 → GSC 에서 제출.
- (jdgrid.com 을 GSC **도메인 속성**(DNS)으로 등록했다면 trends 서브도메인 자동 커버 → 메타 불요, sitemap 제출만.)

## Consequences (결과)

**긍정**

- 검색엔진이 사이트/목록/계층을 구조적으로 이해 → 리치 결과·색인 품질·사이트링크 후보.
- 공유 썸네일 확보 → 소셜·메신저 CTR.
- 순수 빌더 분리 → 단위 테스트(jsonld.test.ts 4종), 결정적.
- 무비용 — 빌드타임 생성, 런타임/외부 호출 0.

**부정**

- `SearchAction` 부재로 사이트링크 검색창 미확보(검색 도입 전까지).
- OG 이미지 영문 — 한글 브랜드 카피는 폰트 번들 필요(추후).
- `_headers` content-type 은 Cloudflare Workers Assets 의 `_headers` 지원에 의존 — 미지원/오작동 시 OG 가 octet-stream 으로 나갈 수 있음(배포 후 content-type 검증 필요).

**중립**

- 페이지별 동적 OG(키워드 삽입)는 미도입 — 빌드 비용·복잡도 대비 우선순위 낮음. 루트 공통 이미지로 시작.

## Alternatives Considered (대안)

- **페이지별 동적 OG 이미지**(generateImageMetadata): 키워드/카테고리별 맞춤 썸네일. 빌드 시 N장 생성 비용 + 복잡도. 루트 공통 우선, 추후.
- **public/og.png 정적 자산 + 수동 metadata.images**: content-type 확실하나 디자인 변경 시 수동 재생성. ImageResponse(코드 생성) + `_headers` 채택.
- **SearchAction 포함**: 검색 엔드포인트 부재로 무효. 기각(검색 도입 시).
- **마이크로데이터/RDFa**: JSON-LD 가 Google 권장·유지보수 용이. JSON-LD 채택.

## Implementation Notes

- `src/lib/jsonld.ts`(siteGraph/itemList/breadcrumb/keywordUrl/categoryUrl), `jsonld.test.ts`(4), `_components/JsonLd.tsx`(이스케이프), layout/page/c/k 배선.
- `src/app/opengraph-image.tsx`(force-static, 1200×630), `public/_headers`.
- 빌드 검증(2026-06-08): 홈 Organization+WebSite+ItemList, /c BreadcrumbList, og:image=`/opengraph-image?<hash>`, `out/opengraph-image` = PNG 1200×630, `out/_headers` 반영. tests 52→56.
- **배포 후 필수 확인**: `curl -I https://trends.jdgrid.com/opengraph-image` 의 `Content-Type: image/png`.

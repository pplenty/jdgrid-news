# ADR-0012: 도메인 — news.jdgrid.com

- Status: Accepted
- Date: 2026-05-22
- Deciders: yusik
- Related: [ADR-0003](./0003-hosting-cloudflare-pages.md), [ADR-0009](./0009-ui-layout-sidebar.md)

## Context (배경)

사이트 공개를 위해 도메인이 필요하다. 운영자는 `jdgrid.com` 도메인을 가지고 있고 그 아래에서 `yutils.jdgrid.com` 같은 서브도메인으로 사이드 프로젝트들을 운영 중이다 (ADR-0009의 UI 일관성 결정도 이 맥락에서 나옴).

후보:
1. **`news.jdgrid.com`** — jdgrid 패밀리 서브도메인. yutils와 같은 패턴.
2. **`jdgrid-news.com`** — 독립 도메인 (GitHub 레포 이름과 동일).
3. **`jdgrid.com/news`** — path 기반.
4. 기타 서브도메인 (`today.`, `daily.`, `brief.`).

## Decision (결정)

> 운영자 결정 (2026-05-22): **`news.jdgrid.com`**

### 연결 구성

- **DNS**: Cloudflare가 관리하는 `jdgrid.com` 존에 `news` 서브도메인을 추가.
- **호스팅**: Cloudflare Pages 프로젝트(ADR-0003)에 `news.jdgrid.com`을 커스텀 도메인으로 등록 → Pages가 DNS 레코드(CNAME)를 자동 구성.
- **HTTPS**: Cloudflare가 자동 발급·갱신.
- **`www` 또는 apex 리다이렉트**: 해당 없음 (서브도메인이므로).

### 환경 분리

- **Production**: `news.jdgrid.com` ← `main` 브랜치.
- **Preview**: Cloudflare Pages가 부여하는 `*.pages.dev` 또는 `*.<project>.pages.dev` 자동 서브도메인 (브랜치별). 커스텀 도메인 미부여.

## Consequences (결과)

**긍정**
- yutils와 같은 `*.jdgrid.com` 패턴 → 같은 운영자라는 시그널이 도메인에서부터 명확.
- 도메인 추가 비용 0 (기존 jdgrid.com에 서브도메인 추가).
- DNS 변경만으로 연결 완료. 추후 호스팅을 옮겨도 DNS만 갈아끼우면 됨.
- `jdgrid.com` 메인 사이트의 신뢰도와 약하게 연동 (긍정 측면).

**부정**
- 독립 브랜드 임팩트(예: `jdgrid-news.com`)는 약함. SEO에서도 도메인 자체에 "news" 키워드가 박힌 효과는 path 기반(`jdgrid.com/news`)보다 약함.
- `jdgrid.com` 메인 사이트에 문제가 생기면(예: 운영 중단·평판 이슈) `news.` 서브도메인도 같이 영향을 받을 수 있음 (부정 측면).

**중립**
- 다국어(예: `/ko`, `/en`) path 구조 도입 여부는 별도 결정. 현재는 단일 한국어 페이지 가정, 영문 카테고리 라벨은 UI 표시만.
- `robots.txt`, `sitemap.xml`은 도메인 결정 후 구현 단계에서 작성.
- 추후 `jdgrid.com` 자체를 정리하거나 메인 사이트를 만들 때 본 ADR을 재검토.

## Alternatives Considered (대안)

- **`jdgrid-news.com`**: 독립 브랜드 임팩트는 가장 강함. 그러나 도메인 구매 비용 + jdgrid 패밀리 일관성 손실. yutils와의 시각 일관성(ADR-0009)을 도메인까지 일관시키는 게 낫다고 판단.
- **`jdgrid.com/news`**: SEO에서 도메인 권위(domain authority) 누적이 단일 도메인에 집중되는 이점. 그러나 jdgrid.com 메인을 빌드/배포할 때 path 충돌을 항상 관리해야 함 — yutils가 서브도메인 모델인 것과 같은 이유로 분리가 깔끔.
- **`today.jdgrid.com` / `daily.jdgrid.com`**: 성격을 더 잘 전달할 수 있으나, "news"가 가장 직관적. 이름 짓기 비용 회피.

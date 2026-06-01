# ADR-0038: EN source 품질 — 커머스/딜 글 수집 단계 필터

- Status: Accepted
- Date: 2026-06-02
- Deciders: yusik
- Related: [ADR-0013](./0013-rss-sources-v1.md), [ADR-0014](./0014-keyword-extraction-v0.md), [ADR-0036](./0036-keyword-extraction-v1-english-morphological.md)

## Context (배경)

영어 키워드 추출(ADR-0036, compromise #Noun)이 기능어 노이즈를 제거한 뒤에도, EN 트렌드/워드클라우드가 **가젯 스펙·커머스 쪽으로 기우는** 현상이 남았다. 7일 누적 오프라인 재추출(2026-06-02, 네트워크 0)로 원인을 정량화:

- **The Verge = EN 기사의 26.3%**(57/217) — Guardian(31.3%) 다음 2위 비중.
- 그중 **35%(20/57)가 딜/바이어스가이드** — "The best Memorial Day sales", "DualSense almost 30 percent off", "2026 graduation gift guide", "on sale for less".
- Verge-only 키워드: `battery·speaker·bluetooth·sound·ring·walmart·arduboy…` (가젯 스펙/커머스) vs non-Verge: `cancer·iran·ceasefire·ebola·patients…` (실뉴스). 대비가 극명.

The Verge 의 `rss/index.xml`(Atom)은 **커머스 글을 `<category term="Deals">`·`term="Verge Shopping">` 으로 직접 태깅**한다(라이브 피드 확인). 이는 stopword 로 가젯 명사를 일일이 덮는 두더지잡기(ADR-0014 가 경계한 "땜질 누적")가 아니라, **source 레벨에서 비-뉴스 콘텐츠를 거를** 정밀 신호다. ADR-0035/0037 세션이 남긴 "EN source 품질" backlog 항목.

## Decision (결정)

> 운영자 결정 (2026-06-02): **채택** — 가젯 딜을 섞어 보내는 매체에 한해 **수집 단계에서 커머스/딜/가이드 글을 제거**. (AskUserQuestion 선택지: "딜/가이드 글 수집 단계 필터" — 피드 교체·스펙 불용어 보강·source 제거 대신.)

`Source.dropCommerce` 플래그를 추가하고 `verge-tech` 에만 켠다. 플래그가 켜진 매체의 RSS 아이템에 한해 `isCommercePost()` 로 판별해 정규화 이전에 드롭:

1. **RSS category (1순위·고정밀)** — term 이 `{deals, verge shopping, commerce, buying guide, gift guide, shopping}` 중 하나면 커머스. 매체가 직접 단 라벨이라 오탐이 거의 없다. rss-parser 기본값은 Atom `<category term>` 을 안 잡으므로 customField `['category','categories',{keepArray:true}]` 로 캡처.
2. **고정밀 제목/요약 패턴 (2순위·보조)** — `% off`·`half off`·`on sale`·`gift guide`·`buying guide`·`prime day`·`black/cyber friday/monday`·`$N right now/or less/off`. category 미태깅 글을 보조 포착.

**`review`·비교(vs)·일반 'guide'(이벤트 가이드 등)·단독 'deal/sale' 명사는 타깃 아님** — 정상 테크 콘텐츠/뉴스이고, 단독 'deal'(trade deal 류)은 오탐 위험이라 텍스트 패턴에서 제외하고 category 'Deals' 에 위임.

## Consequences (결과)

**긍정**

- **source 레벨 정밀 제거** — stopword 누적(battery·speaker·bluetooth…) 없이 비-뉴스 콘텐츠 자체를 차단. 가젯 명사가 *진짜 뉴스*(신제품 발표)에 등장할 땐 보존.
- **검증된 정밀도** — 오프라인 57건 중 텍스트 패턴만으로 8건(14%) 드롭, **오탐 0**. 라이브 풀 필터(category+텍스트)는 딜 글 정확히 포착, 정상 뉴스(Anthropic IPO·Computex)와 이벤트 가이드는 유지. category 합산 시 실제 제거율은 더 높음(태깅된 딜 전부).
- **config 주도·확장 가능** — 다른 커머스 혼합 매체 추가 시 `dropCommerce: true` 만. 로직은 source-filter.ts 단일 출처.
- **운영 가시성** — `[scrape] dropped N commerce/deals items (ADR-0038)` 로그.

**부정**

- **휴리스틱 한계** — category 미태깅 + 비표준 제목의 딜은 누락 가능(recall < 100%). 정밀도 우선 트레이드오프(뉴스 오탐 회피).
- **피드 구조 의존** — Verge 가 category 스킴을 바꾸면 1순위 신호 약화 → 2순위(텍스트)로 graceful degrade.

**중립**

- `weight` 필드(균등 1.0, 미사용)와 별개. 가중치가 아니라 **인입 필터**로 결정(키워드 추출이 weight 를 안 쓰므로 가중치 변경은 무효였을 것).
- 피드 교체(Ars Technica 등)·source 제거는 기각 — 정상 Verge 테크뉴스 손실. ADR-0013 source 셋 불변.

## Alternatives Considered (대안)

- **피드 교체 (Verge → Ars Technica 등)**: 커머스 적은 피드로 교체. 정상 Verge 뉴스(Pichai 인터뷰·Build·Computex) 손실 + source 셋 변경 파급. 기각.
- **스펙 불용어 보강 (battery·speaker·bluetooth…)**: 두더지잡기 + 브랜드 오탐(ring=Oura Ring). ADR-0014 가 경계한 누적 땜질. 기각.
- **Verge 제거**: 최단순이나 정상 테크뉴스 전량 손실. 과함. 기각.
- **가중치 down (weight < 1)**: 키워드 추출(extractDerivedKeywords)이 weight 를 안 쓰므로 코드 변경 없이는 무효. 기각.

## Implementation Notes

- `src/scraper/source-filter.ts` — `extractCategoryTerms()`(문자열/Atom term 객체 정규화) + `isCommercePost()`. 순수 함수, 단위 테스트 8종(source-filter.test.ts): category·텍스트 포착, 정상 뉴스·리뷰·trade deal 비포착, category 정규화.
- `src/scraper/index.ts` — parser customField 에 category 추가, 정규화 루프에서 `raw.source.dropCommerce && isCommercePost(...)` 드롭 + 카운터/로그.
- `src/scraper/sources.ts` — `Source.dropCommerce?: boolean`, `verge-tech` 에 `true`.
- 검증은 `data/*.json` 오프라인 재추출(텍스트 패턴) + 라이브 피드 파싱(category+텍스트). 네트워크는 라이브 점검 1회만.

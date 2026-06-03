# ADR-0039: 일일 트렌드 브리핑 — 데이터 기반 원천 텍스트 요약

- Status: Accepted
- Date: 2026-06-04
- Deciders: yusik
- Related: [ADR-0007](./0007-content-policy-headline-curation.md), [ADR-0023](./0023-analytics-v1.md), [ADR-0037](./0037-keyword-extraction-v1-compound-merge.md)

## Context (배경)

AdSense 승인·수익화 준비 과정에서, 사이트가 **순수 헤드라인 집계(aggregator)** 로 보이면 "thin/low-value content" 거절 리스크가 있다. 기계적 게이트(개인정보처리방침·ads.txt)는 충족했으나, 남은 레버는 **우리만의 원천 가치를 텍스트로 전면화**하는 것이다.

사이트의 원천 자산은 *직접 계산한* 키워드/트렌드 분석(ADR-0014/0035~0037 키워드 추출, ADR-0023 Movers)이다. 이를 **사람이 읽는 요약 텍스트**로 메인에 노출하면 (1) AdSense 원천 콘텐츠 가치, (2) 체류·재방문, (3) 고유 텍스트로 SEO 까지 동시에 잡는다.

제약: [ADR-0007](./0007-content-policy-headline-curation.md) 은 기사 본문 재가공·자체 요약을 금지한다. 따라서 브리핑은 **기사 본문이 아니라 우리가 수집한 트렌드 데이터의 메타분석**이어야 한다(빈도·순위·카테고리 통계). 운영 비용 0·재현성 원칙상 **LLM 미사용, 결정적(deterministic) 계산**.

## Decision (결정)

> 운영자 결정 (2026-06-04, AskUserQuestion): **채택** — (1) **렌더타임 server 계산**(스키마·스크레이퍼 불변), (2) **메인 상단 섹션** 노출, (3) 내용 4종: **급상승 키워드(어제 대비)·국내·해외 톱 트렌드·카테고리 활동량·신규/교차 신호**.

- `buildBriefing(today, prev)` 순수 함수(`src/lib/briefing.ts`) — `loadLatest()` + `loadPrevious(date)` 로 빌드 시 계산. 결정적(Date/random 미사용, 동점은 키워드 문자열로 tie-break).
- 계산 항목:
  - **카테고리 활동량** — `top` 버킷 제외 노출 기사 수 합 + 최다 카테고리. (카테고리별 상한 적용된 *큐레이션* 수임을 문구로 정직히 반영.)
  - **국내·해외 톱** — `trends.kr` / `trends.global` 상위 5.
  - **급상승** — derived 빈도 클라우드(ADR-0037)의 어제 대비 delta. *어제도 있던* 키워드만(신규와 분리).
  - **신규** — 어제 클라우드에 없던 키워드.
  - **교차 신호** — `trends.kr` ∩ `trends.global`(대소문자 무시). 교집합 없으면 자동 생략.
- 렌더: `DailyBriefing` server 컴포넌트 — 원천 요약 한 문단(prose) + 하이라이트 행(`<dl>`). 키워드는 **plain text**(derived 키워드는 `/k` 페이지가 없을 수 있어 링크 미사용 → 404 회피).
- 단위 테스트 5종(급상승↔신규 분리·카테고리 합·교차 신호·prev 부재·top 5 cap).

## Consequences (결과)

**긍정**

- **원천 콘텐츠** — 매일 갱신되는 고유 텍스트 요약. AdSense "value-add" 보강 + 고유 텍스트 SEO.
- **무비용·재현성** — 결정적 계산, LLM·외부 호출 0. 같은 데이터 → 같은 브리핑.
- **ADR-0007 정합** — 기사 본문 무가공, 트렌드 통계 메타분석만.
- **최소 침습** — 스키마·스크레이퍼 불변. `/d/[date]` 도 같은 함수로 과거 브리핑 자동 생성 가능.

**부정**

- **요약 정보가 상한에 묶임** — 카테고리 수는 노출 상한(12/카테고리) 기준이라 실제 수집량과 다름. "주요 기사 N건"(큐레이션) 으로 문구 보정.
- **교차 신호 희소** — KR(한글)·global(영문) 키워드라 교집합이 드묾(대개 비어 생략). 향후 정규화(음차/브랜드 매핑) 여지.
- **템플릿 톤** — 결정적 문장이라 표현이 정형적. LLM 대비 다양성↓(비용·정책상 수용).

**중립**

- Movers(ADR-0023, Google 순위 변화 viz)와 **신호·형태 모두 다름**(derived 빈도 텍스트 요약) — 보완 관계.

## Alternatives Considered (대안)

- **스크레이프타임 저장** (snapshot JSON 에 briefing 필드): 데이터와 함께 동결되나 스키마+스크레이퍼 변경 필요. 렌더타임이 동일 결과에 더 가벼워 기각.
- **전용 `/briefing` 페이지만**: 색인 URL은 좋으나 최고 트래픽(메인) 노출이 AdSense·체류에 직접적. 메인 상단 우선(전용 페이지는 향후 Tier 2).
- **LLM 생성 요약**: 표현 풍부하나 비용·재현성·ADR-0007(본문 재가공) 경계 위험. 결정적 템플릿으로 기각.

## Implementation Notes

- `src/lib/briefing.ts`(`buildBriefing`/`Briefing`), `src/lib/briefing.test.ts`(5), `src/app/_components/DailyBriefing.tsx`(server), `src/app/page.tsx` 배선(`TrendingHero` 위).
- 빈 데이터(기사 0·트렌드 0) 시 컴포넌트 null 반환 — 빈 카드 방지.
- 실측(2026-06-04 빌드): "주요 기사 96건 가운데 ‘세계’ 12건… 국내/해외 톱·급상승·신규" 정상 렌더, 교차 신호 없어 자동 생략.

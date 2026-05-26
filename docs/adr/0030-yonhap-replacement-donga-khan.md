# ADR-0030: 연합뉴스 6 source 제거 + 동아·경향으로 분산 대체

- Status: Accepted
- Date: 2026-05-26
- Deciders: yusik
- Related: [ADR-0013](./0013-rss-sources-v1.md), [ADR-0027](./0027-ops-source-cleanup-dedupe.md)

## Context (배경)

ADR-0013 (RSS sources v1) + ADR-0027 (실패 매체 교체) 에서 연합뉴스 6개 카테고리(politics/business/world/society/culture/sports)를 한국 핵심 source 로 박았다.

2026-05-25/26 운영 발견:
- 로컬 `pnpm scrape` 와 GitHub Actions cron 양쪽에서 yonhap RSS 6개 모두 `ECONNRESET`:
  ```
  [scrape] yonhap-politics failed: connect ECONNRESET 211.33.130.21:443
  [scrape] yonhap-society failed: read ECONNRESET
  ...
  ```
- 로컬 macOS (KT 회선) + GitHub Actions ubuntu-latest (Azure 미국 IP) 둘 다 재현 → **Yonhap 측 서버 차단 또는 RSS 자체 폐지** 가능성.
- 한국 매체 12 source 중 6 source 결손 → 카테고리별 한국 시각 손상 (politics/business/world/society/culture/sports 모두 약해짐).

## Decision (결정)

연합뉴스 6 source 모두 제거. 동아일보 3 + 경향신문 3 으로 분산 대체. 한국 매체 총 source 수 12 유지.

**매핑** (운영자 결정):

| 기존 (yonhap)        | 대체 (donga/khan)       | category | 매체 성향 |
|---------------------|-------------------------|----------|-----------|
| yonhap-politics     | **donga-politics**      | politics | 보수      |
| yonhap-society      | **donga-society**       | world*   | 보수      |
| yonhap-culture      | **donga-culture**       | culture  | 보수      |
| yonhap-world        | **khan-world**          | world    | 진보      |
| yonhap-business     | **khan-business**       | business | 진보      |
| yonhap-sports       | **khan-sports**         | sports   | 진보      |

\* `society` 는 ADR-0008 8 카테고리에 없어 `world` 로 매핑 (yonhap-society 와 동일 hack). ADR-0008 변경은 별도 ADR.

**대체 후 한국 매체 정치 성향 분포:**
- politics: 한겨레(진보)·조선(보수)·동아(보수) — 보수2 + 진보1
- business: 한경(중도)·조선(보수)·경향(진보) — 균형
- world: 한겨레 없음·조선 없음·동아society·경향world — 보수1+진보1
- culture: 한겨레(진보)·동아(보수) — 균형
- sports: 경향만 — 1개
- tech: 전자(중도) — 1개

검증된 RSS URL (모두 200 + 50 items):
- donga-politics: `https://rss.donga.com/politics.xml`
- donga-society: `https://rss.donga.com/national.xml`
- donga-culture: `https://rss.donga.com/culture.xml`
- khan-world: `https://www.khan.co.kr/rss/rssdata/kh_world.xml`
- khan-business: `https://www.khan.co.kr/rss/rssdata/economy_news.xml`
- khan-sports: `https://www.khan.co.kr/rss/rssdata/kh_sports.xml`

`src/lib/stopwords.ts` 매체명: '동아일보' + '경향신문' 이미 포함. '연합뉴스' 는 인용 가능성 고려해 유지.

## Consequences (결과)

**긍정**
- 한국 매체 정체성 복원 — 모든 카테고리에 한국 시각 1개 이상 유지.
- 성향 분산 (한겨레/경향 진보 + 조선/동아 보수 + 한경/전자 중도) → 운영자 1인 사이트라도 정치적 편향 최소화.
- 동아·경향 RSS 50 items × 6 = 300 items/일 추가, dedupe 후 실질 +200~250 articles 추정.
- 단일 매체 의존 회피 — Yonhap 처럼 한 매체가 죽어도 카테고리당 다른 source 살아있음.

**부정**
- 매체 수가 6 → 4 (한겨레/조선/한경/전자) + 동아3 + 경향3 = **6 매체 12 source** 그대로지만, 각 매체 가중치 차이로 워드클라우드의 매체별 stopword 노이즈 가능성 (운영하며 추가 stopword 보강 필요).
- ADR-0008 의 카테고리 8개 (top/world/politics/business/tech/science/sports/culture) 에 `society` 가 없어 한국 사회 뉴스가 `world` 로 들어가는 hack 유지. UX 상 어색하지만 categories.ts 변경은 큰 영향이라 별도 ADR로 분리.
- yonhap 의 cron 실패 모드 분석 미해결 — 차단인지, RSS 폐지인지, 일시적 장애인지 운영자 추가 확인 필요 (yna.co.kr 사이트 자체는 정상 작동).

**중립**
- ADR-0027 의 dedupe v1 (Jaccard 0.8) 그대로 적용 — 동아/경향과 다른 한국 매체의 중복 기사가 자연스럽게 정리됨.

## Alternatives Considered (대안)

- **6개 모두 제거 (대체 없음)**: 한국 매체 6개로 감소 → 카테고리당 한국 시각 약해짐. 운영자 거절.
- **SBS section RSS 6개**: SBS sectionId 01/02/03/07/08/09 만 활성 (04~06 빈 응답). 6 카테고리 매핑 어렵고 단일 매체.
- **MBC / JTBC / 노컷 / 뉴스1 / 한국일보**: curl 검증 시 모두 404 / SPA(HTML) / 빈 응답 → 부적합.
- **단일 매체 (동아 6 또는 경향 6)**: 매체 의존성 증가. 동아만 박으면 보수 편향 강해짐. 경향만 박으면 진보 편향. 분산이 정직.
- **`society` 카테고리 신규 추가**: ADR-0008 변경 + UI 8 → 9 카테고리 + sidebar/sitemap 영향. 본 ADR 의 책임 범위 밖, 별도 ADR 후보로 남김.

## Implementation Discovery (2026-05-26)

- 검증 시도 11개 RSS 매체 중 **살아있는 한국 매체 RSS** = 동아일보·경향신문·매일경제·머니투데이·SBS(일부 sectionId). MBC/JTBC/한국일보/노컷/뉴스1/중앙은 RSS 미지원 또는 SPA.
- yonhap 차단 원인 미확정 — KT 회선 로컬 + Azure GitHub IP 둘 다 동일 ECONNRESET 이라 IP 차단보다는 **RSS 엔드포인트 자체 폐지** 가능성 큼. 본 ADR 은 차단/폐지 양쪽 모두에 대응하는 결정.
- 동아 RSS 는 `rss.donga.com` 서브도메인, 경향 RSS 는 `www.khan.co.kr/rss/rssdata/` 경로. 둘 다 안정적 publishing 패턴.

# ADR-0008: 카테고리 체계 — 영문 매체 기준 8분류 + top 자동 집계 + 단일 분류

- Status: Accepted
- Date: 2026-05-21
- Deciders: yusik
- Related: [ADR-0005](./0005-data-sources-rss-google-trends.md), [ADR-0007](./0007-content-policy-headline-curation.md), PLAN §5

## Context (배경)

ADR-0005에서 국내·해외 RSS를 함께 받기로 결정했다. 그런데 매체별 RSS의 카테고리 분류가 제각각이다.

- **영문 매체**(BBC, Reuters, AP, Guardian, NYT 등): `world / politics / business / tech / science / sports / culture / health` 식으로 비교적 표준화돼 있고 RSS도 카테고리별로 분리해 제공.
- **국내 매체**(연합·조선·중앙·한겨레 등): `종합 / 정치 / 경제 / 사회 / 문화 / IT / 스포츠` 식이지만 매체별 편차가 큼. "사회" 항목의 정의가 매체마다 다름.

사이트 UI 일관성과 RSS → 우리 카테고리 매핑 룰의 단순화를 위해 통합 분류 체계가 필요하다.

또한 결정해야 할 부수 항목:
- 메인 페이지의 "오늘의 종합(top)" 카테고리를 어떻게 채울 것인가.
- 한 기사가 여러 카테고리에 동시 노출되는 다중 분류를 허용할 것인가.

## Decision (결정)

> 운영자 결정 (2026-05-21):
> 1. 카테고리 셋 → 영문 매체 기준 재구성
> 2. `top` 카테고리 → 각 카테고리 상위 N건 자동 집계
> 3. 다중 분류 → 단일 분류만

### 카테고리 셋 (총 8개)

| id          | label (KR) | label (EN) | 비고                                          |
| ----------- | ---------- | ---------- | --------------------------------------------- |
| `top`       | 종합       | Top        | 자동 집계 (아래 §"top 구성" 참조)             |
| `world`     | 세계       | World      | 국제 일반                                     |
| `politics`  | 정치       | Politics   | 국내·국제 정치 통합                           |
| `business`  | 경제       | Business   | 산업·금융·시장                                |
| `tech`      | 기술       | Tech       | 빅테크·AI·SW                                  |
| `science`   | 과학       | Science    | 연구·환경·기후 포함                           |
| `sports`    | 스포츠     | Sports     | 국내·해외                                     |
| `culture`   | 문화       | Culture    | 예술·연예·라이프스타일                        |

- ID는 영어 소문자 케밥 케이스로 고정 (`scraper/sources.ts`, URL 경로 `/c/[category]`에 그대로 사용).
- KR/EN 라벨은 UI 렌더 시점에 i18n 매핑.

### top 카테고리 구성

- `top`은 매체 RSS에서 직접 받지 않는다. **각 도메인 카테고리(`world`, `politics`, `business`, `tech`, `science`, `sports`, `culture`)에서 상위 N건을 가중 집계해 자동 생성**한다.
- 가중치 시그널 (초기 v0):
  1. 매체 가중치 (`sources.ts`의 `weight`).
  2. 같은 사건을 보도한 매체 수 (URL 정규화·제목 유사도로 그룹핑).
  3. Google Trends RSS 키워드와 헤드라인 매칭 점수.
- 운영자 수동 큐레이션은 두지 않는다 (1인 운영, 자동화 우선).

### 다중 분류 정책

- **한 기사 = 한 카테고리** (단일 분류).
- 매체 RSS 분류가 우리 카테고리 둘 이상에 걸칠 때는 **우선순위 룰**로 단일 카테고리에 귀속:

  ```
  politics > business > world > tech > science > sports > culture
  ```

- 우선순위는 "이슈성/시사성 ↑ → 우선" 원칙. 운영하며 조정 가능 (룰 변경은 ADR 신규 작성 없이 코드 변경으로 처리, 단 변경 사유는 PR 본문에 명시).

### 매체 RSS → 우리 카테고리 매핑 원칙

- `scraper/sources.ts`의 각 source 항목에 우리 카테고리 ID를 1:1로 박는다.
- 매체가 카테고리별 RSS를 분리 제공하면 그대로 매핑 (예: `bbc.com/news/world` → `world`).
- 매체가 통합 RSS만 제공하면 두 가지 옵션:
  - (a) `top` 후보군으로만 사용 (가중 집계 입력).
  - (b) 룰 기반 분류 — 제목/요약 키워드 매칭으로 카테고리 추정 (v1 이후 도입).

## Consequences (결과)

**긍정**
- 영문 매체(BBC, Reuters, AP, Guardian 등) RSS와 1:1 매핑이 깔끔해 초기 소스 확보 비용 ↓.
- `top` 자동 집계로 운영자 개입 0, 1인 운영 원칙(ADR-0004 흐름)과 일치.
- 단일 분류 → 메인/카테고리 페이지 중복 노출 없음, dedupe·정렬 룰 단순.

**부정**
- 국내 매체의 "사회" 카테고리가 빠짐. 사건사고/재난성 기사는 `politics`(정책 관련) 또는 `world`(국제 사건)로 흘러가는데, 어디에도 깔끔히 안 맞는 사례 발생. → 운영하며 보완. 필요하면 `society` 카테고리 추가 ADR로 supersede.
- 카테고리가 8개라 모바일 가로 탭이 빠듯함. UI에서 가로 스크롤 또는 2열 그리드로 흡수.
- 통합 RSS만 주는 매체는 v1에서 사실상 `top` 후보로만 들어감 → 다양한 카테고리에서 그 매체가 안 보일 수 있음.

**중립**
- 우선순위 룰 변경은 ADR을 새로 박지 않는다 — 운영 튜닝 영역. 다만 PR 본문에 변경 사유는 남긴다.
- 후일 `society / opinion / health / environment` 등이 필요해지면 새 ADR로 supersede.

## Alternatives Considered (대안)

- **국내 매체 분류 우선 8개** (`종합/정치/경제/사회/IT/세계/문화/스포츠`): 한국 사용자에겐 자연스럽지만, 영문 매체와 매핑하는 데 매번 변환 비용이 들어감. 영문 RSS가 더 잘게 나눠 제공되므로 영문 기준이 매핑 비용을 줄임.
- **슬림 6개** (`top/world/politics/business/tech/society`): 단순화엔 좋지만 영문 매체가 sports/culture/science RSS를 잘 제공하므로 굳이 줄일 이유 약함.
- **확장 10개+** (`+ opinion / environment / health / lifestyle`): 다양성 ↑ 그러나 RSS 매체 확보 부담 + 모바일 탭 압박.
- **다중 분류 허용**: 노출 폭은 ↑이지만 메인이 중복으로 채워지는 단점이 더 컸음.
- **`top`을 매체 자체 'top stories' RSS로 충당**: BBC Top Stories, 연합 주요뉴스 식으로 매체 의도 존중. 그러나 매체별 편차를 그대로 노출하게 되어 우리 사이트의 가치(선별·정렬)가 약해짐.
- **`top` 없이 메인 = 카드 그리드 직접 표시**: 단순하지만 메인 페이지의 "오늘의 시그니처" 영역이 사라짐. top은 첫인상이라 두는 게 낫다고 판단.

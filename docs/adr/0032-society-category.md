# ADR-0032: society 카테고리 추가 (ADR-0008 부분 supersede)

- Status: Accepted
- Date: 2026-05-27
- Deciders: yusik
- Related: [ADR-0008](./0008-category-taxonomy.md), [ADR-0030](./0030-yonhap-replacement-donga-khan.md)

## Context (배경)

ADR-0008 에서 카테고리 8개 (top / world / politics / business / tech / science / sports / culture) 박음. 영문 매체(BBC/Guardian/Reuters 등)의 분류 컨벤션 기준.

운영 발견:
- 한국 매체의 "사회" 카테고리 RSS (yonhap-society → donga-society) 가 8 카테고리에 없어 `world` 로 매핑되는 hack 사용 중. ADR-0030 §Consequences 에 부정점 명시.
- 한국 사회 뉴스 (사건·사고·교육·복지 등) 가 해외 뉴스(world) 와 같은 페이지에 섞이는 UX 어색.
- `donga-society` RSS 는 한국 국내 사회 뉴스 전용 — `national.xml` 경로명에서도 명확.

## Decision (결정)

`society` 카테고리 신설. 8 → 9 카테고리.

```ts
// src/lib/categories.ts
export const CATEGORY_IDS = [
  'top', 'world', 'politics', 'society',
  'business', 'tech', 'science', 'sports', 'culture',
] as const;

export const CATEGORY_LABELS = {
  ...
  society: { ko: '사회', en: 'Society' },
};

// CATEGORY_PRIORITY — politics 다음 위치 (한국 매체에서 society 빈도 높음).
export const CATEGORY_PRIORITY = [
  'politics', 'society', 'business', 'world',
  'tech', 'science', 'sports', 'culture',
] as const;
```

**UI 매핑 (자율 default, 운영자 수정 가능):**
- Icon (lucide-react): `Users` — 사람 그룹, 사회 직관적.
- Color: `#14b8a6` (teal-500) — 다른 8 카테고리 색과 겹치지 않음, 인디고 액센트와 어울리는 채도.

**sources.ts 매핑 변경:**
- `donga-society`: `category: 'world'` → `category: 'society'` (ADR-0030 hack 해소).

**자동 파급 (코드 변경 없음):**
- `src/scraper/auto-categorize.ts` — CATEGORY_PRIORITY loop 사용 → 자동 society 인식.
- `src/app/sitemap.ts` — CATEGORY_IDS loop → `/c/society/` 자동 생성.
- Sidebar — categories 자동 loop → society 항목 자동 노출.
- `/headlines` / `/c/[category]` — 자동.

## Consequences (결과)

**긍정**
- ADR-0030 의 society→world hack 해소. donga-society 가 정직하게 society 카테고리.
- 한국 사회 뉴스가 별도 페이지 (`/c/society`) 로 분리 → 사이트 정체성 (한국·해외 균형) 더 명확.
- 매체별 카테고리 분포 차트 (MediaCategorySection) 에 society 컬럼 추가 → 한국 매체 vs 외국 매체의 society 비중 가시화.

**부정**
- 데이터 history 의 불일치 — 2026-05-26 이전 snapshot 의 `donga-society` (현재 latest.json 에 채워진) 는 `world` 카테고리로 박혀있음. 과거 snapshot 재처리 없음 (raw data 무관, UI 가 latest.json 만 사용). `/d/2026-05-26` 같은 historical 페이지는 그날 분류 그대로 노출 — 의도된 동작.
- 카테고리 추가는 UI 폭에 영향 (sidebar 1줄 추가, 사이트맵 페이지 +1). 미미.
- 외국 매체엔 society 카테고리 RSS 박힌 게 없어 한국 매체 (현재 donga-society 1개) 만 society 컬럼 — 데이터 빈약 가능성. 추후 다른 한국 매체 society RSS 추가 후보.

**중립**
- ADR-0008 의 "영문 매체 기준 8분류" 명시 — 한국 사회를 영문 매체의 어느 카테고리로도 매핑 못 함이 hack의 근본. society 추가로 한·영 매체 공통 분류 가능 — 외국 매체에 society 매핑된 source는 0개 (현재 BBC/Guardian RSS에 사회 전용 카테고리 없음).
- ADR-0008 의 "단일 분류" 원칙 유지 — society 도 다른 카테고리와 동등.

## Alternatives Considered (대안)

- **society 카테고리 추가 없이 yonhap/donga-society 제거**: 한국 매체 사회 뉴스 손실. 일부 카테고리 (world) 의 한국 시각 약해짐. ADR-0030 운영자 결정 ("동아 3 + 경향 3") 과 충돌.
- **9분류 → 10분류 (society + local)**: 국내·해외 society 분리. 외국 매체에 society RSS 박힌 게 없어 local만 채워짐. 현재 1 source로 충분 — over-engineering.
- **society → national 이름**: 'national' 은 외국 매체에도 흔한 이름 (BBC News, Guardian National). 보편적이지만 한·영 의미 약간 다름 ('national' = 국내 = local). society 가 한·영 의미 정합.
- **categories.ts 만 수정, donga-society 매핑 안 바꿈**: society 카테고리 빈 페이지. 의미 없음 — sources.ts 같이 수정 필수.

## Implementation Notes

- `CATEGORY_PRIORITY` 에서 society 위치를 politics 다음 (society > business > world > ...) — 한국 매체의 society 빈도가 business 보다 높은 경향. 추후 운영 데이터로 재조정 가능.
- 다음 cron 부터 새 snapshot 의 donga-society 가 `category: 'society'` 로 박힘. 같은 날 첫 cron 후 두 번째 cron 은 ADR-0031 의 skip 가드로 즉시 종료.
- 외국 매체 society RSS 후보 — 향후 검증: Guardian Society section, BBC News (Education/Social Affairs) 등. v2 후보.

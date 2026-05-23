# ADR-0027: 운영성 — 실패 매체 교체 + dedupe 강화

- Status: Accepted
- Date: 2026-05-23
- Deciders: yusik
- Related: [ADR-0013](./0013-rss-sources-v1.md) (supersede 부분), [ADR-0014](./0014-keyword-extraction-v0.md) (dedupe 부분)

## Context (배경)

운영 중 5 매체가 지속 실패 (M1 검증 시점 + 이후 cron 로그):

| 매체 | URL | 상태 |
| - | - | - |
| ap-world | `apnews.com/hub/world-news.rss` | 404 |
| reuters-world | `reutersagency.com/feed/?...world...` | 404 |
| reuters-business | `reutersagency.com/feed/?...business-finance...` | 404 |
| yonhap-tech | `yna.co.kr/rss/itscience.xml` | 404 |
| kbs-top | `world.kbs.co.kr/rss/rss_news.htm?lang=k` | 200 빈 응답 (XML 파싱 실패) |

직접 검증 결과:
- AP·Reuters: 공식 RSS 폐지 또는 endpoint 변경 — 안정적 대안 없음.
- Yonhap: `news.xml`(전체)·`industry.xml`·`society.xml`·`culture.xml`·`sports.xml` 모두 200. `it/itscience/science` 404 (해당 카테고리 RSS 폐지).
- KBS World: 응답은 200이지만 본문 비어있음. RSS 폐지로 추정.

또 ADR-0014 dedupe v0(URL 정규화 + 제목 정확 일치)은 매체 간 같은 사건을 다른 헤드라인으로 보도할 때 중복으로 못 잡음.

## Decision (결정)

### 1. 매체 셋 교체

**제거 (3)**: `kbs-top`, `reuters-business`, `yonhap-tech`
- KBS World RSS 폐지.
- Reuters business는 BBC business + Bloomberg가 이미 커버.
- Yonhap IT 카테고리 폐지.

**교체 (2)**: `ap-world → al-jazeera-world`, `reuters-world → npr-world`
- `https://www.aljazeera.com/xml/rss/all.xml` (Al Jazeera, world)
- `https://feeds.npr.org/1004/rss.xml` (NPR, world)

**추가 (3)**: Yonhap의 살아있는 카테고리 활용
- `yonhap-society` (사회 → society 카테고리 없으므로 우리 `world`로 매핑)
- `yonhap-culture` (문화 → culture)
- `yonhap-sports` (스포츠 → sports)

**결과**: 매체 정의 24 → 26개 (Yonhap 6, 다른 매체는 그대로).

### 2. dedupe v1 — 제목 유사도

`dedupeArticles`를 강화:

1. 기존: URL ID + 제목 정확 일치 (대소문자 무시).
2. 추가: **정규화 제목 Jaccard 유사도 ≥ 0.8** 이면 같은 기사로 간주, 먼저 발견된 것 유지.

정규화:
```
title → toLowerCase → 유니코드 letter/digit/공백 외 모두 공백 → 공백 1개로 정규화 → trim → tokenize
```

Jaccard = `|A ∩ B| / |A ∪ B|` (단어 집합 기준).

임계값 0.8 → 완전히 다른 헤드라인은 안 잡고, "G7 leaders agree on tariff plan" vs "G7 nations agree tariff plan" 같은 변종은 같은 기사로 합침.

### 3. 운영 정책 명시

- 매체 헬스 체크: 매일 cron 로그에서 `failed:` 로그 카운트. 3일 연속 실패하면 PR로 보정.
- dedupe 임계값 0.8은 운영 튜닝 영역 — 실측 후 조정 가능 (ADR 갱신 없이 코드 변경).

## Consequences (결과)

**긍정**
- cron 로그 정리 — 매일 5건 fail 메시지가 0건으로.
- Al Jazeera·NPR로 영문 매체 다양성 ↑ (BBC·Guardian·Bloomberg·Verge 외).
- Yonhap 사회·문화·스포츠 카테고리 추가 → 한국 매체 커버리지 ↑ (특히 sports·culture에서 비어있던 카테고리 채워짐).
- 제목 유사도 dedupe로 "같은 사건 중복 헤드라인" 감소.

**부정**
- Reuters 제거 — 통신사 신호 ↓. AP도 사라짐. Al Jazeera·NPR는 통신사 아님(미디어).
- Jaccard 0.8은 단어 집합 기준 — 어순·문법 차이는 무시. 의미 다른데 단어 비슷한 케이스(False positive) 가능.
- Yonhap 매체가 6개로 늘어 한 매체 비중 ↑ — 동일 사건 다중 보도 시 dedupe로 흡수되지만 모니터링 필요.

**중립**
- 새 매체(Al Jazeera·NPR)의 RSS 안정성은 운영하며 확인. 다시 실패하면 추가 ADR.
- dedupe 임계값 0.8은 첫 출발 — 0.7·0.85 등으로 조정 가능.

## Alternatives Considered (대안)

- **Reuters/AP 미러 사이트 사용**: feedburner·rsshub 등. 안정성·법적 회색지대. 정직히 매체 변경.
- **dedupe v2 — Levenshtein 또는 임베딩**: 의미 유사도까지 잡지만 v1 비용 ↑. 0.8 Jaccard로 시작.
- **KBS 다른 endpoint 시도**: `news.kbs.co.kr/rss/...` 등 — 공식 RSS 확인 어려움. 제거 후 추후 발견 시 추가.
- **실패 매체 그대로 두기**: cron 로그 노이즈·운영 부담 ↑. 정리 필요.

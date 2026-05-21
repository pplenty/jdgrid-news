# ADR-0015: UI 구현 디테일 — Pretendard + lucide-react + 16:9 카드

- Status: Accepted
- Date: 2026-05-22
- Deciders: yusik
- Related: [ADR-0009](./0009-ui-layout-sidebar.md), [ADR-0010](./0010-dev-environment.md)

## Context (배경)

[ADR-0009](./0009-ui-layout-sidebar.md)에서 사이드바 레이아웃·테마 follow·가독성 우선 타이포 톤은 박혔지만, 구체 폰트·아이콘·카드 디테일은 "구현 단계 결정"으로 남겨두었다. M3 UI 구현 직전에 이 디테일들을 박는다.

남은 결정 포인트:
1. **폰트**: Pretendard 단일 vs Inter+Noto Sans KR vs 시스템 폰트.
2. **아이콘 시스템**: lucide-react vs emoji vs heroicons.
3. **카드 썸네일 비율**: 16:9 vs 4:3 vs 1:1.

## Decision (결정)

> 운영자 결정 (2026-05-22):
> 1. 폰트 → **Pretendard 단일**
> 2. 아이콘 → **lucide-react**
> 3. 썸네일 비율 → **16:9 와이드**

### 폰트 — Pretendard

- 한국어+영문 통합 단일 폰트.
- 로드 방식: **CDN(`cdn.jsdelivr.net/gh/orioncactus/pretendard`)** 의 dynamic-subset woff2 우선. 첫 로드 지연이 신경 쓰이면 자체 호스팅(public/fonts/)으로 이관.
- `font-display: swap` — FOIT 없이 시스템 폰트로 폴백 후 Pretendard로 교체.
- 폴백 체인: `Pretendard, system-ui, -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif`.
- 본문 16~17px / line-height 1.55+ / letter-spacing -0.005em (ADR-0009 가독성 가이드 유지).

### 아이콘 — lucide-react

- `lucide-react` 패키지(MIT, tree-shakable).
- 사용 아이콘만 import → 번들에 필요한 SVG만 포함 (~5kb 추가).
- 사이드바 카테고리는 텍스트 라벨만 + 액티브 인디케이터(좌측 라인). 카테고리별 아이콘은 v2 이후 검토.
- 시스템 표지 아이콘은 lucide 표준 사용 (Sun, Moon, Monitor, Menu, X, ArrowRight, ExternalLink 등).

### 카드 썸네일 — 16:9

- Tailwind `aspect-video` 클래스(`16/9`).
- 이미지가 없거나 핫링크 실패 시 placeholder(중성 배경 + 매체 이니셜 또는 lucide `ImageOff` 아이콘).
- 이미지는 `loading="lazy"` + `decoding="async"`. Next.js `next/image`는 static export + `unoptimized: true`라 큰 이득 없음 → 일반 `<img>` 사용.

## Consequences (결과)

**긍정**
- Pretendard 단일 → 폰트 로드 1회. 한국어/영문 어디서도 톤 일관.
- lucide-react는 React 19 + Next 15와 잘 맞고 yutils 등 자매 프로젝트와도 동일 패턴 잡기 좋음.
- 16:9는 영문 매체(BBC/Guardian/Verge 등) RSS 썸네일 표준 비율 → 재단 없이 그대로 노출.

**부정**
- Pretendard CDN 의존 → CDN 장애 시 폴백 폰트로 표시(시스템 폰트). FOUT 약간 발생 가능.
- lucide-react는 ESM. SSR/RSC 환경에서 client 컴포넌트로만 사용해야 안전 (서버 컴포넌트에서도 동작은 하지만 일부 wrapper가 client 표시 필요).
- 16:9 → 한국 매체 일부가 4:3 썸네일을 주면 위/아래 letterbox 또는 좌우 crop 필요. `object-cover`로 흡수.

**중립**
- 폰트 자체 호스팅 전환은 운영하면서 결정. 본 ADR은 CDN 우선만 명시.
- lucide의 어떤 아이콘을 어디에 쓰는지는 코드 영역. ADR로 박지 않음.

## Alternatives Considered (대안)

- **Inter (영문) + Noto Sans KR (한국어)**: 구글 폰트 정석 조합이지만 2 파일 로드 + 한·영 폰트 weight 매칭 추가 작업.
- **시스템 폰트만**: 로드 지연 0이지만 OS별 인상 편차(macOS Apple SD Gothic Neo vs Windows Malgun Gothic)가 커서 사이트 정체성 약함.
- **emoji 아이콘 그대로**: 의존성 0이지만 OS·브라우저 렌더링 편차 큼. yutils와의 일관성에도 약함.
- **heroicons (Tailwind 계열)**: Tailwind 스택과 친화적이지만 lucide 대비 아이콘 종류가 적음.
- **4:3 비율**: 정보 밀도는 좋지만 RSS 썸네일 표준이 아니라 재단 비용.
- **1:1 정사각형**: 그리드 리듬은 좋지만 뉴스 이미지에는 과도한 crop.

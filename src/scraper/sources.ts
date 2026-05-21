// RSS 매체 마스터 리스트 — ADR-0013.
// URL은 변동성이 있으므로 운영 중 헬스체크로 검증·갱신. 매체 추가/제거는 PR로.
// 카테고리 매핑·우선순위 룰은 ADR-0008.

import type { CategoryId } from '@/lib/categories';

export type Source = {
  /** 고유 ID. `{매체}-{카테고리}` 컨벤션. */
  id: string;
  /** 매체명. UI 표시용. */
  name: string;
  /** RSS 피드 URL. */
  url: string;
  /** 우리 카테고리(ADR-0008) ID 1:1 매핑. */
  category: CategoryId;
  /** 본문 언어. */
  lang: 'ko' | 'en';
  /** 가중치 v1은 모두 1.0 (균등). 운영 튜닝 영역. */
  weight: number;
};

// M1에서 실제 RSS URL 검증과 함께 채움. URL 검증 절차:
//  1) 200 OK + 유효한 XML
//  2) 최근 항목 1주 내 갱신
//  3) RSS description 필드 존재 (ADR-0007의 summary 5필드 정책)
export const SOURCES: readonly Source[] = [
  // ─── 해외 (영문, 6개 매체) ───
  // BBC News — world/business/tech/science 분리
  // Reuters — world/business
  // AP News — world
  // The Guardian — world/politics/culture/science
  // Bloomberg — business
  // The Verge — tech

  // ─── 국내 (한국어, 6개 매체) ───
  // 연합뉴스 — politics/business/world/tech
  // 한겨레 — politics/culture
  // 조선일보 — politics/business
  // 한국경제 — business
  // 전자신문 — tech
  // KBS — top/world
];

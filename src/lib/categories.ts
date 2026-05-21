// ADR-0008: 영문 매체 기준 8분류 + top 자동 집계 + 단일 분류.

export const CATEGORY_IDS = [
  'top',
  'world',
  'politics',
  'business',
  'tech',
  'science',
  'sports',
  'culture',
] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

export const CATEGORY_LABELS: Record<CategoryId, { ko: string; en: string }> = {
  top: { ko: '종합', en: 'Top' },
  world: { ko: '세계', en: 'World' },
  politics: { ko: '정치', en: 'Politics' },
  business: { ko: '경제', en: 'Business' },
  tech: { ko: '기술', en: 'Tech' },
  science: { ko: '과학', en: 'Science' },
  sports: { ko: '스포츠', en: 'Sports' },
  culture: { ko: '문화', en: 'Culture' },
};

// 우선순위 — 단일 분류 충돌 시 상위 카테고리에 귀속.
// top은 자동 집계 카테고리이므로 우선순위 룰의 대상이 아니다.
export const CATEGORY_PRIORITY = [
  'politics',
  'business',
  'world',
  'tech',
  'science',
  'sports',
  'culture',
] as const satisfies readonly Exclude<CategoryId, 'top'>[];

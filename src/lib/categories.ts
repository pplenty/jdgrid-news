// ADR-0008 + ADR-0032: 9분류 + top 자동 집계 + 단일 분류.
// society 카테고리는 ADR-0032 에서 추가 (한국 사회 뉴스가 'world' 로 매핑되던 hack 해소).

export const CATEGORY_IDS = [
  'top',
  'world',
  'politics',
  'society',
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
  society: { ko: '사회', en: 'Society' },
  business: { ko: '경제', en: 'Business' },
  tech: { ko: '기술', en: 'Tech' },
  science: { ko: '과학', en: 'Science' },
  sports: { ko: '스포츠', en: 'Sports' },
  culture: { ko: '문화', en: 'Culture' },
};

// 우선순위 — 단일 분류 충돌 시 상위 카테고리에 귀속.
// top은 자동 집계 카테고리이므로 우선순위 룰의 대상이 아니다.
// society는 정치 다음으로 한국 매체에서 빈도 높음.
export const CATEGORY_PRIORITY = [
  'politics',
  'society',
  'business',
  'world',
  'tech',
  'science',
  'sports',
  'culture',
] as const satisfies readonly Exclude<CategoryId, 'top'>[];

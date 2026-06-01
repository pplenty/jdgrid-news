// EN source 품질 — 커머스/딜 글 수집 단계 필터 (ADR-0038).
//
// 일부 매체(The Verge)는 가젯 딜·바이어스가이드를 일반 테크 RSS 에 섞어 보내 자체 키워드
// 추출·트렌드를 가젯 스펙·커머스 쪽으로 끌어내린다. 7일 실측(오프라인 재추출): The Verge =
// EN 기사의 26%, 그중 35% 가 딜/가이드("…on sale", "30 percent off", "gift guide"). 키워드
// 클라우드엔 battery·speaker·bluetooth·walmart 류가 부상 — 시사 트렌드로선 저정보.
//
// 대응: source.dropCommerce 가 켜진 매체에 한해, RSS category(1순위·매체 직접 태깅) 또는
// 고정밀 딜/세일/가이드 제목 패턴(2순위·미태깅 보조)으로 커머스 글을 인입 단계에서 제거.
// 'review'·비교(vs) 글은 정상 테크 콘텐츠이므로 타깃 아님 — 딜/세일/가이드만.

/** Verge 등이 커머스 글에 다는 RSS category term (소문자 비교). 실측 피드 기준. */
const COMMERCE_CATEGORIES = new Set([
  'deals',
  'verge shopping',
  'commerce',
  'buying guide',
  'gift guide',
  'shopping',
]);

/**
 * 고정밀 딜/세일/가이드 제목·요약 패턴 — category 미태깅 글 보조 포착.
 * 오탐 최소화 위해 *명백한 커머스 신호*만 (가격·% off·세일 이벤트·가이드). 단독 'deal'/'sale'
 * 명사는 뉴스 문맥(trade deal 등) 오탐 위험이라 제외하고, category 'Deals' 에 맡긴다.
 */
const COMMERCE_TEXT_RE =
  /\b\d{1,3}\s*(?:percent|%)\s*off\b|\bhalf off\b|\bon sale\b|\bgift guide\b|\bbuying guide\b|\bprime day\b|\bblack friday\b|\bcyber monday\b|\$\d[\d,.]*\s+(?:right now|or less|off)\b/i;

/** rss-parser category 원소: 문자열(RSS) 또는 Atom term 객체 `{ $: { term } }`. */
type RssCategory = string | { $?: { term?: string }; _?: string } | null | undefined;

/** rss-parser 의 categories(문자열 또는 Atom term 객체 혼재)를 소문자 term 배열로 정규화. */
export function extractCategoryTerms(categories: readonly RssCategory[] | undefined): string[] {
  if (!categories) return [];
  const out: string[] = [];
  for (const c of categories) {
    if (!c) continue;
    const term = typeof c === 'string' ? c : (c.$?.term ?? c._);
    if (term) out.push(term.toLowerCase().trim());
  }
  return out;
}

/**
 * 커머스/딜/가이드 글 판별. RSS category 가 1순위(매체 직접 태깅 — 고정밀),
 * 제목·요약 고정밀 패턴이 2순위(미태깅 보조). review·비교글은 정상 콘텐츠라 미포착.
 */
export function isCommercePost(args: {
  title?: string;
  summary?: string;
  categories?: readonly RssCategory[];
}): boolean {
  const terms = extractCategoryTerms(args.categories);
  if (terms.some((t) => COMMERCE_CATEGORIES.has(t))) return true;
  return COMMERCE_TEXT_RE.test(`${args.title ?? ''} ${args.summary ?? ''}`);
}

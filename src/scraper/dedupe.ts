// 중복 제거 v0 — URL 정규화 + 제목 정확 일치 (대소문자 무시).
// 더 정교한 dedupe (제목 유사도, 같은 사건 그룹핑)는 v2 이후.

import type { Article } from '@/lib/types';

export function dedupeArticles(articles: ReadonlyArray<Article>): Article[] {
  const seenById = new Set<string>();
  const seenByTitle = new Set<string>();
  const out: Article[] = [];
  for (const a of articles) {
    if (seenById.has(a.id)) continue;
    const titleKey = a.title.trim().toLowerCase();
    if (titleKey && seenByTitle.has(titleKey)) continue;
    seenById.add(a.id);
    if (titleKey) seenByTitle.add(titleKey);
    out.push(a);
  }
  return out;
}

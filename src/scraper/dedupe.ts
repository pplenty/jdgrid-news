// 중복 제거 v1 — ADR-0014 + ADR-0027.
// URL 정규화(id) + 제목 정규화 → 토큰 집합 Jaccard 유사도 ≥ 0.8이면 같은 기사로 간주.

import type { Article } from '@/lib/types';

const SIMILARITY_THRESHOLD = 0.8;
const MIN_TOKENS_FOR_FUZZY = 3; // 너무 짧은 제목은 fuzzy 매칭 안 함 (false positive 위험)

export function dedupeArticles(articles: ReadonlyArray<Article>): Article[] {
  const out: Article[] = [];
  const seenById = new Set<string>();
  /** 이전에 통과한 article들의 토큰 집합 (Jaccard 비교용). */
  const seenTitleSets: Set<string>[] = [];

  for (const a of articles) {
    if (seenById.has(a.id)) continue;

    const tokens = titleTokens(a.title);

    let isDup = false;
    if (tokens.size >= MIN_TOKENS_FOR_FUZZY) {
      for (const existing of seenTitleSets) {
        if (jaccard(tokens, existing) >= SIMILARITY_THRESHOLD) {
          isDup = true;
          break;
        }
      }
    } else if (tokens.size > 0) {
      // 짧은 제목은 정확 일치만 (이전 ADR-0014 동작 유지)
      const key = [...tokens].sort().join(' ');
      for (const existing of seenTitleSets) {
        if ([...existing].sort().join(' ') === key) {
          isDup = true;
          break;
        }
      }
    }
    if (isDup) continue;

    seenById.add(a.id);
    seenTitleSets.push(tokens);
    out.push(a);
  }
  return out;
}

function titleTokens(title: string): Set<string> {
  const normalized = title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!normalized) return new Set();
  return new Set(normalized.split(' ').filter((t) => t.length > 0));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const x of a) {
    if (b.has(x)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

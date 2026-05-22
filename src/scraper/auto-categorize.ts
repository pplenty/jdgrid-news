// 자체 분류 — ADR-0018.
// Daily Trend의 relatedUrls(우리 매체 매칭, ADR-0014)에서 카테고리 majority + ADR-0008 우선순위 tie-break.

import { CATEGORY_PRIORITY, type CategoryId } from '@/lib/categories';
import type { Article, Trend, TrendArticle, TrendStory } from '@/lib/types';

const MAX_ARTICLES_PER_STORY = 5;

export function inferCategory(
  trend: Trend,
  articlesByUrl: ReadonlyMap<string, Article>,
): CategoryId | undefined {
  if (trend.relatedUrls.length === 0) return undefined;
  const counts = new Map<CategoryId, number>();
  for (const url of trend.relatedUrls) {
    const a = articlesByUrl.get(url);
    if (!a) continue;
    counts.set(a.category, (counts.get(a.category) ?? 0) + 1);
  }
  if (counts.size === 0) return undefined;
  // CATEGORY_PRIORITY 순으로 tie-break (politics > business > world > ...)
  let best: CategoryId | undefined;
  let bestCount = 0;
  for (const cat of CATEGORY_PRIORITY) {
    const c = counts.get(cat) ?? 0;
    if (c > bestCount) {
      best = cat;
      bestCount = c;
    }
  }
  // top 카테고리에 매칭된 article은 매우 드물지만 보존.
  const topCount = counts.get('top') ?? 0;
  if (topCount > bestCount) {
    best = 'top';
    bestCount = topCount;
  }
  return best;
}

export function trendsToInferredStories(
  trends: ReadonlyArray<Trend>,
  articles: ReadonlyArray<Article>,
  geo: 'KR' | 'global',
): TrendStory[] {
  const articlesByUrl = new Map(articles.map((a) => [a.url, a]));
  const stories: TrendStory[] = [];
  for (const t of trends) {
    const category = inferCategory(t, articlesByUrl);
    if (!category) continue;
    const matched = t.relatedUrls
      .map((url) => articlesByUrl.get(url))
      .filter((a): a is Article => a !== undefined)
      .slice(0, MAX_ARTICLES_PER_STORY);
    stories.push({
      title: t.keyword,
      entityNames: undefined,
      imageUrl: t.picture,
      shareUrl: undefined,
      category,
      geo,
      source: 'inferred',
      articles: matched.map(toTrendArticle),
    });
  }
  return stories;
}

function toTrendArticle(a: Article): TrendArticle {
  return {
    title: a.title,
    url: a.url,
    source: a.source.name,
    imageUrl: a.imageUrl,
    publishedAt: a.publishedAt,
    snippet: a.summary || undefined,
  };
}

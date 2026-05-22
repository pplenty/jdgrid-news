// Trend story card — ADR-0018 (Google realtime + 자체 분류 통합 모델).

import { ExternalLink } from 'lucide-react';

import type { TrendArticle, TrendStory } from '@/lib/types';
import { cn } from '@/lib/utils';

export function TrendStoryCard({ story }: { story: TrendStory }) {
  const lead = story.articles[0];
  const href = lead?.url ?? story.shareUrl ?? '#';

  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-border-subtle bg-bg transition-all hover:border-border hover:shadow-sm">
      <a href={href} target="_blank" rel="noreferrer noopener" className="flex flex-1 flex-col">
        {story.imageUrl && (
          <div className="relative aspect-video overflow-hidden bg-bg-subtle">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={story.imageUrl}
              alt=""
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          </div>
        )}
        <div className={cn('flex flex-1 flex-col gap-2', story.imageUrl ? 'p-3.5' : 'p-4')}>
          <h3 className="font-bold leading-snug tracking-tight line-clamp-3 group-hover:text-accent-fg">
            {story.title}
          </h3>
          {story.entityNames && story.entityNames.length > 0 && (
            <ul className="flex flex-wrap gap-1">
              {story.entityNames.slice(0, 4).map((name) => (
                <li
                  key={name}
                  className="rounded-full bg-bg-subtle px-2 py-0.5 text-[11px] font-medium text-fg-muted"
                >
                  {name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </a>
      {story.articles.length > 0 && (
        <ul className="border-t border-border-subtle">
          {story.articles.slice(0, 3).map((a) => (
            <li key={a.url}>
              <ArticleRow article={a} />
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

function ArticleRow({ article }: { article: TrendArticle }) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noreferrer noopener"
      className="group flex items-center gap-2 border-t border-border-subtle px-3 py-2 first:border-t-0 hover:bg-bg-subtle"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-fg-muted group-hover:text-fg">
          {article.title}
        </p>
        <p className="text-[11px] text-fg-subtle">
          {article.source}
          {article.publishedAt && ` · ${article.publishedAt}`}
        </p>
      </div>
      <ExternalLink size={12} className="shrink-0 text-fg-subtle" />
    </a>
  );
}

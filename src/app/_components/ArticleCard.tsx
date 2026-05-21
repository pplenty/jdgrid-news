// 헤드라인 카드 — ADR-0007 5필드 + ADR-0015 16:9 썸네일.
// 이미지가 없는 경우 placeholder 대신 텍스트 중심 레이아웃으로 자연스럽게 전환.

import { ExternalLink } from 'lucide-react';

import type { Article } from '@/lib/types';
import { cn, relativeTime } from '@/lib/utils';

type Props = {
  article: Article;
  variant?: 'default' | 'hero' | 'compact';
};

export function ArticleCard({ article, variant = 'default' }: Props) {
  const isHero = variant === 'hero';
  const isCompact = variant === 'compact';
  const hasImage = !!article.imageUrl && !isCompact;

  return (
    <article
      className={cn(
        'group flex flex-col overflow-hidden rounded-lg border border-border-subtle bg-bg transition-all hover:border-border hover:shadow-sm',
        isHero && 'md:col-span-2 md:row-span-2',
      )}
    >
      <a href={article.url} target="_blank" rel="noreferrer noopener" className="flex h-full flex-col">
        {hasImage && (
          <div className="relative aspect-video overflow-hidden bg-bg-subtle">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.imageUrl}
              alt=""
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          </div>
        )}

        <div
          className={cn(
            'flex flex-1 flex-col gap-2',
            hasImage ? 'p-3.5' : 'p-4',
            !hasImage && (isHero ? 'min-h-[16rem] justify-between' : 'min-h-[10rem] justify-between'),
          )}
        >
          {!hasImage && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">
              {article.source.name}
            </span>
          )}

          <h3
            className={cn(
              'font-bold leading-snug tracking-tight transition-colors group-hover:text-accent-fg',
              isHero
                ? hasImage
                  ? 'text-xl line-clamp-3'
                  : 'text-2xl line-clamp-4'
                : hasImage
                  ? 'text-base line-clamp-3'
                  : 'text-lg line-clamp-4',
            )}
          >
            {article.title}
          </h3>

          {article.summary && !isCompact && (
            <p
              className={cn(
                'text-sm text-fg-muted',
                isHero
                  ? hasImage
                    ? 'line-clamp-3'
                    : 'line-clamp-6'
                  : hasImage
                    ? 'line-clamp-2'
                    : 'line-clamp-4',
              )}
            >
              {article.summary}
            </p>
          )}

          <div className="mt-auto flex items-center gap-1.5 pt-1.5 text-xs text-fg-subtle">
            {hasImage && <span className="font-medium text-fg-muted">{article.source.name}</span>}
            {hasImage && <span>·</span>}
            <time dateTime={article.publishedAt}>{relativeTime(article.publishedAt)}</time>
            <ExternalLink size={11} className="ml-auto opacity-0 transition-opacity group-hover:opacity-60" />
          </div>
        </div>
      </a>
    </article>
  );
}

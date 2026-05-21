// 헤드라인 카드 — ADR-0007 5필드 + ADR-0015 16:9 썸네일.
// 핫링크 실패 시 placeholder는 CSS bg + ImageOff 아이콘.

import { ExternalLink, ImageOff } from 'lucide-react';

import type { Article } from '@/lib/types';
import { cn, relativeTime } from '@/lib/utils';

type Props = {
  article: Article;
  variant?: 'default' | 'hero' | 'compact';
};

export function ArticleCard({ article, variant = 'default' }: Props) {
  const isHero = variant === 'hero';
  const isCompact = variant === 'compact';

  return (
    <article
      className={cn(
        'group flex flex-col overflow-hidden rounded-lg border border-border-subtle bg-bg transition-colors hover:border-border',
        isHero && 'md:col-span-2 md:row-span-2',
      )}
    >
      <a
        href={article.url}
        target="_blank"
        rel="noreferrer noopener"
        className="flex h-full flex-col"
      >
        <Thumbnail src={article.imageUrl} alt={article.title} compact={isCompact} />
        <div className="flex flex-1 flex-col gap-1.5 p-3.5">
          <h3
            className={cn(
              'font-bold leading-snug tracking-tight transition-colors group-hover:text-accent-fg',
              isHero ? 'text-xl line-clamp-3' : 'text-base line-clamp-3',
            )}
          >
            {article.title}
          </h3>
          {article.summary && !isCompact && (
            <p className={cn('text-sm text-fg-muted', isHero ? 'line-clamp-3' : 'line-clamp-2')}>
              {article.summary}
            </p>
          )}
          <div className="mt-auto flex items-center gap-1.5 pt-1.5 text-xs text-fg-subtle">
            <span className="font-medium text-fg-muted">{article.source.name}</span>
            <span>·</span>
            <time dateTime={article.publishedAt}>{relativeTime(article.publishedAt)}</time>
            <ExternalLink size={11} className="ml-auto opacity-0 transition-opacity group-hover:opacity-60" />
          </div>
        </div>
      </a>
    </article>
  );
}

function Thumbnail({ src, alt, compact }: { src?: string; alt: string; compact?: boolean }) {
  if (compact) return null;
  if (!src) {
    return (
      <div className="flex aspect-video items-center justify-center bg-bg-subtle text-fg-subtle">
        <ImageOff size={28} aria-hidden />
      </div>
    );
  }
  return (
    <div className="relative aspect-video overflow-hidden bg-bg-subtle">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
      />
    </div>
  );
}

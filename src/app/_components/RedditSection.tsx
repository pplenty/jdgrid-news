// Reddit r/all/top — ADR-0026. 작은 썸네일 + 제목 + subreddit + score.

import { ArrowUp, MessageSquare } from 'lucide-react';

import type { RedditPost } from '@/lib/types';
import { relativeTime } from '@/lib/utils';

import { RedditIcon } from './icons';

type Props = {
  posts: RedditPost[];
};

export function RedditSection({ posts }: Props) {
  if (posts.length === 0) return null;

  return (
    <section className="border-b border-border-subtle px-4 py-8 lg:px-8">
      <header className="mb-3 flex items-center gap-2">
        <RedditIcon size={18} className="text-[#ff4500]" />
        <h2 className="text-base font-bold tracking-tight">Reddit</h2>
        <span className="text-xs text-fg-subtle">r/all top · last 24h</span>
      </header>
      <ol className="space-y-1.5">
        {posts.slice(0, 10).map((p, idx) => (
          <li key={p.id}>
            <Row rank={idx + 1} post={p} />
          </li>
        ))}
      </ol>
    </section>
  );
}

function Row({ rank, post }: { rank: number; post: RedditPost }) {
  return (
    <a
      href={post.url}
      target="_blank"
      rel="noreferrer noopener"
      className="group flex items-center gap-3 rounded-md border border-border-subtle p-2 transition-colors hover:border-border hover:bg-bg-subtle"
    >
      <span className="w-5 shrink-0 text-center text-xs font-semibold tabular-nums text-fg-subtle">
        {rank}
      </span>
      {post.thumbnail && (
        <div className="hidden h-12 w-12 shrink-0 overflow-hidden rounded sm:block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.thumbnail}
            alt=""
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-medium text-fg group-hover:text-accent-fg">
          {post.title}
        </p>
        <p className="mt-0.5 flex items-center gap-x-2 text-[11px] text-fg-subtle">
          <span className="font-medium text-fg-muted">r/{post.subreddit}</span>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center tabular-nums">
            <ArrowUp size={10} className="mr-0.5" aria-hidden />
            {post.score}
          </span>
          <span className="inline-flex items-center tabular-nums">
            <MessageSquare size={10} className="mr-0.5" aria-hidden />
            {post.numComments}
          </span>
          {post.createdAt && <span>· {relativeTime(post.createdAt)}</span>}
        </p>
      </div>
    </a>
  );
}

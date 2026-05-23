// Hacker News Top — ADR-0025. front_page top 10 list.

import { ArrowUpRight, MessageSquare } from 'lucide-react';

import type { HackerNewsStory } from '@/lib/types';
import { relativeTime } from '@/lib/utils';

type Props = {
  stories: HackerNewsStory[];
};

export function HackerNewsSection({ stories }: Props) {
  if (stories.length === 0) return null;

  return (
    <section className="border-b border-border-subtle px-4 py-8 lg:px-8">
      <header className="mb-3 flex items-center gap-2">
        <span
          aria-hidden
          className="inline-flex h-5 w-5 items-center justify-center rounded-sm bg-[#ff6600] text-[10px] font-black text-white"
        >
          Y
        </span>
        <h2 className="text-base font-bold tracking-tight">Hacker News</h2>
        <span className="text-xs text-fg-subtle">front page · via Algolia</span>
      </header>
      <ol className="space-y-1">
        {stories.slice(0, 10).map((s, idx) => (
          <li key={s.id}>
            <Row rank={idx + 1} story={s} />
          </li>
        ))}
      </ol>
    </section>
  );
}

function Row({ rank, story }: { rank: number; story: HackerNewsStory }) {
  return (
    <a
      href={story.url}
      target="_blank"
      rel="noreferrer noopener"
      className="group flex items-baseline gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-bg-subtle"
    >
      <span className="w-5 shrink-0 text-center text-xs font-semibold tabular-nums text-fg-subtle">
        {rank}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-fg group-hover:text-accent-fg">
        {story.title}
      </span>
      <span className="shrink-0 text-xs tabular-nums text-fg-subtle">
        {story.points}
        <span aria-hidden className="mx-1">·</span>
        <MessageSquare size={10} className="inline -mt-0.5 mr-0.5" aria-hidden />
        {story.numComments}
      </span>
      <span className="hidden shrink-0 text-[11px] text-fg-subtle sm:inline">
        {story.author} · {relativeTime(story.createdAt)}
      </span>
      <ArrowUpRight
        size={12}
        className="shrink-0 text-fg-subtle opacity-0 transition-opacity group-hover:opacity-100"
        aria-hidden
      />
    </a>
  );
}

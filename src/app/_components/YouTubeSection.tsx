// YouTube Korea Trending — ADR-0026. 16:9 썸네일 카드 그리드.

import type { YouTubeTrend } from '@/lib/types';
import { relativeTime } from '@/lib/utils';

import { YouTubeIcon } from './icons';

type Props = {
  videos: YouTubeTrend[];
};

export function YouTubeSection({ videos }: Props) {
  if (videos.length === 0) return null;

  return (
    <section className="border-b border-border-subtle px-4 py-8 lg:px-8">
      <header className="mb-3 flex items-center gap-2">
        <YouTubeIcon size={16} className="text-[#ff0000]" />
        <h2 className="text-base font-bold tracking-tight">YouTube Korea Trending</h2>
        <span className="text-xs text-fg-subtle">via YouTube Data API</span>
      </header>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {videos.slice(0, 8).map((v, idx) => (
          <Card key={v.id} rank={idx + 1} video={v} />
        ))}
      </div>
    </section>
  );
}

function Card({ rank, video }: { rank: number; video: YouTubeTrend }) {
  return (
    <a
      href={video.url}
      target="_blank"
      rel="noreferrer noopener"
      className="group flex flex-col overflow-hidden rounded-lg border border-border-subtle bg-bg transition-all hover:border-border hover:shadow-sm"
    >
      <div className="relative aspect-video overflow-hidden bg-bg-subtle">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={video.thumbnail}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
        <span className="absolute left-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-bg/90 text-xs font-black tabular-nums text-fg shadow-sm">
          {rank}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm font-bold leading-snug tracking-tight group-hover:text-accent-fg">
          {video.title}
        </h3>
        <p className="truncate text-xs text-fg-muted">{video.channelTitle}</p>
        <p className="mt-auto pt-1 text-[11px] text-fg-subtle tabular-nums">
          조회 {formatCount(video.viewCount)}
          {video.publishedAt && ` · ${relativeTime(video.publishedAt)}`}
        </p>
      </div>
    </a>
  );
}

function formatCount(n: number): string {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000) return `${(n / 10_000).toFixed(1)}만`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

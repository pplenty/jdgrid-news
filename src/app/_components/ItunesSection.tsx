// Apple iTunes Korea — ADR-0022. 음악 + 앱 두 컬럼.

import { Music, Smartphone } from 'lucide-react';

import type { ItunesTrend } from '@/lib/types';

type Props = {
  music: ItunesTrend[];
  apps: ItunesTrend[];
};

export function ItunesSection({ music, apps }: Props) {
  if (music.length === 0 && apps.length === 0) return null;

  return (
    <section className="border-b border-border-subtle px-4 py-8 lg:px-8">
      <header className="mb-3 flex items-center gap-2">
        <h2 className="text-base font-bold tracking-tight">🇰🇷 Korea Music & Apps</h2>
        <span className="text-xs text-fg-subtle">via Apple iTunes · 24h</span>
      </header>
      <div className="grid gap-x-6 gap-y-6 md:grid-cols-2">
        <Column icon={Music} label="음악 Top" items={music} />
        <Column icon={Smartphone} label="앱 Top (무료)" items={apps} />
      </div>
    </section>
  );
}

function Column({
  icon: Icon,
  label,
  items,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  items: ItunesTrend[];
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-fg-muted">
        <Icon size={12} />
        {label}
      </p>
      <ol className="space-y-1">
        {items.slice(0, 10).map((t, idx) => (
          <li key={t.url}>
            <Row rank={idx + 1} trend={t} />
          </li>
        ))}
      </ol>
    </div>
  );
}

function Row({ rank, trend }: { rank: number; trend: ItunesTrend }) {
  return (
    <a
      href={trend.url}
      target="_blank"
      rel="noreferrer noopener"
      className="group flex items-center gap-3 rounded-md px-1.5 py-1.5 transition-colors hover:bg-bg-subtle"
    >
      <span className="w-5 shrink-0 text-center text-xs font-semibold tabular-nums text-fg-subtle">
        {rank}
      </span>
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={trend.artworkUrl}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-fg group-hover:text-accent-fg">
          {trend.name}
        </p>
        {trend.artistName && (
          <p className="truncate text-[11px] text-fg-subtle">{trend.artistName}</p>
        )}
      </div>
    </a>
  );
}

// ADR-0023: Movers — 어제↔오늘 비교 (new + rising).

import Link from 'next/link';
import { Sparkles, TrendingUp } from 'lucide-react';

import type { Mover } from '@/lib/movers';

type Props = {
  kr: Mover[];
  global: Mover[];
};

export function MoversSection({ kr, global }: Props) {
  if (kr.length === 0 && global.length === 0) return null;

  return (
    <section className="border-b border-border-subtle px-4 py-8 lg:px-8">
      <header className="mb-4 flex items-center gap-2">
        <Sparkles size={16} className="text-accent" />
        <h2 className="text-base font-bold tracking-tight">오늘 새로 뜬 트렌드</h2>
        <span className="text-xs text-fg-subtle">어제 대비 신규·급상승</span>
      </header>
      <div className="grid gap-x-6 gap-y-4 md:grid-cols-2">
        <Column label="🇰🇷 한국" movers={kr} />
        <Column label="🌐 글로벌" movers={global} />
      </div>
    </section>
  );
}

function Column({ label, movers }: { label: string; movers: Mover[] }) {
  if (movers.length === 0) return null;
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-fg-muted">{label}</p>
      <ol className="space-y-1">
        {movers.slice(0, 5).map((m) => (
          <li key={`${m.kind}-${m.trend.keyword}`}>
            <MoverRow mover={m} />
          </li>
        ))}
      </ol>
    </div>
  );
}

function MoverRow({ mover }: { mover: Mover }) {
  const { trend, kind, delta, todayRank } = mover;
  return (
    <Link
      href={`/k/${encodeURIComponent(trend.keyword)}/`}
      className="group flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-bg-subtle"
    >
      <Badge kind={kind} delta={delta} />
      <span className="w-5 shrink-0 text-center text-xs font-semibold tabular-nums text-fg-subtle">
        {todayRank + 1}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-fg group-hover:text-accent-fg">
        {trend.keyword}
      </span>
      {trend.traffic && (
        <span className="shrink-0 text-xs tabular-nums text-fg-subtle">{trend.traffic}</span>
      )}
    </Link>
  );
}

function Badge({ kind, delta }: { kind: 'new' | 'rising'; delta?: number }) {
  if (kind === 'new') {
    return (
      <span className="inline-flex shrink-0 items-center rounded-full bg-accent-subtle px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent-fg">
        New
      </span>
    );
  }
  return (
    <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-bg-subtle px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-fg-muted">
      <TrendingUp size={9} className="text-accent" />↑{delta}
    </span>
  );
}

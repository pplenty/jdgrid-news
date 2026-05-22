// /trends — ADR-0017 카테고리별 realtime 트렌드 상세 페이지.

import { TrendingUp } from 'lucide-react';

import { RealtimeStoryCard } from '@/app/_components/RealtimeStoryCard';
import {
  REALTIME_CATEGORY_LABELS,
  REALTIME_CATEGORY_ORDER,
} from '@/app/_components/realtimeCategoryMeta';
import { loadLatest } from '@/lib/data';
import type { RealtimeCategory, RealtimeTrendStory } from '@/lib/types';
import { formatDateLabel } from '@/lib/utils';

export const metadata = {
  title: '트렌드 상세 — news',
  description: '카테고리별 실시간 검색 트렌드 (via Google Realtime Trends).',
};

export default function TrendsPage() {
  const snapshot = loadLatest();
  const realtime = snapshot.trends.realtime;

  return (
    <div className="px-4 py-8 lg:px-8">
      <header className="mb-8 border-b border-border-subtle pb-4">
        <div className="flex items-center gap-2">
          <TrendingUp size={18} className="text-fg-muted" />
          <h1 className="text-2xl font-bold tracking-tight">트렌드 상세</h1>
          <span className="text-xs text-fg-subtle">via Google Realtime Trends</span>
        </div>
        <p className="mt-2 text-sm text-fg-muted">{formatDateLabel(snapshot.date)}</p>
      </header>

      {!realtime || (realtime.kr.length === 0 && realtime.global.length === 0) ? (
        <p className="py-12 text-center text-fg-subtle">
          실시간 트렌드 데이터가 없습니다. Google API 응답이 일시 차단됐을 수 있어요.
        </p>
      ) : (
        <div className="space-y-12">
          <GeoSection label="🇰🇷 국내" stories={realtime?.kr ?? []} />
          <GeoSection label="🌐 글로벌" stories={realtime?.global ?? []} />
        </div>
      )}
    </div>
  );
}

function GeoSection({ label, stories }: { label: string; stories: RealtimeTrendStory[] }) {
  if (stories.length === 0) return null;
  const byCategory = groupByCategory(stories);

  return (
    <section>
      <h2 className="mb-4 text-lg font-bold tracking-tight">{label}</h2>
      <div className="space-y-8">
        {REALTIME_CATEGORY_ORDER.map((cat) => {
          const items = byCategory.get(cat) ?? [];
          if (items.length === 0) return null;
          return <CategoryBlock key={cat} category={cat} stories={items} />;
        })}
      </div>
    </section>
  );
}

function CategoryBlock({
  category,
  stories,
}: {
  category: RealtimeCategory;
  stories: RealtimeTrendStory[];
}) {
  const meta = REALTIME_CATEGORY_LABELS[category];
  const Icon = meta.icon;
  return (
    <section>
      <header className="mb-3 flex items-baseline gap-2">
        <Icon size={16} className="self-center text-fg-muted" />
        <h3 className="text-base font-bold tracking-tight">{meta.ko}</h3>
        <span className="text-xs text-fg-subtle">{meta.en}</span>
        <span className="ml-auto text-xs text-fg-subtle">{stories.length}건</span>
      </header>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {stories.map((s) => (
          <RealtimeStoryCard key={`${s.geo}-${s.category}-${s.title}`} story={s} />
        ))}
      </div>
    </section>
  );
}

function groupByCategory(stories: RealtimeTrendStory[]): Map<RealtimeCategory, RealtimeTrendStory[]> {
  const map = new Map<RealtimeCategory, RealtimeTrendStory[]>();
  for (const s of stories) {
    const arr = map.get(s.category) ?? [];
    arr.push(s);
    map.set(s.category, arr);
  }
  return map;
}

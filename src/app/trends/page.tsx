// /trends — ADR-0017 + ADR-0018. 카테고리별 trend story 그리드.
// 데이터 source 우선순위: Google realtime(있으면) > 자체 분류. 둘 다 같은 TrendStory 모델.

import { TrendingUp } from 'lucide-react';

import { CATEGORY_ICONS } from '@/app/_components/categoryIcons';
import { TrendStoryCard } from '@/app/_components/TrendStoryCard';
import { CATEGORY_IDS, CATEGORY_LABELS, type CategoryId } from '@/lib/categories';
import { loadLatest } from '@/lib/data';
import type { TrendStory } from '@/lib/types';
import { formatDateLabel } from '@/lib/utils';

export const metadata = {
  title: '트렌드 상세 — news',
  description: '카테고리별 트렌드 (Google realtime + 자체 분류).',
};

export default function TrendsPage() {
  const snapshot = loadLatest();
  const stories = snapshot.trends.stories;

  return (
    <div className="px-4 py-8 lg:px-8">
      <header className="mb-8 border-b border-border-subtle pb-4">
        <div className="flex items-center gap-2">
          <TrendingUp size={18} className="text-fg-muted" />
          <h1 className="text-2xl font-bold tracking-tight">트렌드 상세</h1>
        </div>
        <p className="mt-2 text-sm text-fg-muted">
          {formatDateLabel(snapshot.date)} · Google realtime이 살아있을 땐 그것 우선, 아니면 우리
          매체 매칭 기반 자체 분류.
        </p>
      </header>

      {!stories || (stories.kr.length === 0 && stories.global.length === 0) ? (
        <p className="py-12 text-center text-fg-subtle">
          오늘은 카테고리별 트렌드가 잡히지 않았어요. Daily 키워드가 우리 매체와 매칭되지 않은 경우입니다.
        </p>
      ) : (
        <div className="space-y-12">
          <GeoSection label="🇰🇷 국내" stories={stories.kr} />
          <GeoSection label="🌐 글로벌" stories={stories.global} />
        </div>
      )}
    </div>
  );
}

function GeoSection({ label, stories }: { label: string; stories: TrendStory[] }) {
  if (stories.length === 0) return null;
  const byCategory = groupByCategory(stories);

  return (
    <section>
      <h2 className="mb-4 text-lg font-bold tracking-tight">{label}</h2>
      <div className="space-y-8">
        {CATEGORY_IDS.map((id) => {
          const items = byCategory.get(id) ?? [];
          if (items.length === 0) return null;
          return <CategoryBlock key={id} category={id} stories={items} />;
        })}
      </div>
    </section>
  );
}

function CategoryBlock({
  category,
  stories,
}: {
  category: CategoryId;
  stories: TrendStory[];
}) {
  const Icon = CATEGORY_ICONS[category];
  const label = CATEGORY_LABELS[category];
  return (
    <section>
      <header className="mb-3 flex items-baseline gap-2">
        <Icon size={16} className="self-center text-fg-muted" />
        <h3 className="text-base font-bold tracking-tight">{label.ko}</h3>
        <span className="text-xs text-fg-subtle">{label.en}</span>
        <span className="ml-auto text-xs text-fg-subtle">{stories.length}건</span>
      </header>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {stories.map((s, idx) => (
          <TrendStoryCard key={`${s.geo}-${s.category}-${s.title}-${idx}`} story={s} />
        ))}
      </div>
    </section>
  );
}

function groupByCategory(stories: TrendStory[]): Map<CategoryId, TrendStory[]> {
  const map = new Map<CategoryId, TrendStory[]>();
  for (const s of stories) {
    const arr = map.get(s.category) ?? [];
    arr.push(s);
    map.set(s.category, arr);
  }
  return map;
}

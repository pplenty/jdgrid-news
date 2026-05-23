// /analytics — ADR-0024. 메타 분석 모음 (워드클라우드 + 매체×카테고리).
// 향후 분석 추가 시 이쪽에 누적.

import { BarChart3 } from 'lucide-react';

import { MediaCategorySection } from '@/app/_components/MediaCategorySection';
import { WordCloudSection } from '@/app/_components/WordCloudSection';
import { computeMediaCategoryMatrix, loadLatest } from '@/lib/data';
import { formatDateLabel } from '@/lib/utils';

export const metadata = {
  title: 'Analytics — trends',
  description: '매체·카테고리·키워드 분포 분석. 우리가 수집한 헤드라인 기반.',
};

export default function AnalyticsPage() {
  const snapshot = loadLatest();
  const derived = snapshot.trends.derived;
  const mediaMatrix = computeMediaCategoryMatrix(snapshot);

  return (
    <>
      <header className="border-b border-border-subtle bg-bg-subtle/40 px-4 py-6 lg:px-8 lg:py-8">
        <div className="flex items-center gap-2">
          <BarChart3 size={18} className="text-fg-muted" />
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        </div>
        <p className="mt-1 text-sm text-fg-muted">
          {formatDateLabel(snapshot.date)} · 우리가 수집한 헤드라인의 단어 빈도·매체×카테고리 분포
        </p>
      </header>

      {derived && <WordCloudSection ko={derived.ko} en={derived.en} />}

      {mediaMatrix.length > 0 && <MediaCategorySection rows={mediaMatrix} />}

      {!derived && mediaMatrix.length === 0 && (
        <p className="px-4 py-16 text-center text-sm text-fg-subtle lg:px-8">
          분석 데이터가 아직 없습니다.
        </p>
      )}
    </>
  );
}

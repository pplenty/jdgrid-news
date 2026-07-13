// /d/[date] 페이지별 동적 OG 이미지 (ADR-0043) — 날짜 다이제스트.

import { listSnapshotDates } from '@/lib/data';
import { OG_SIZE, renderOgImage } from '@/lib/og-template';
import { formatDateLabel } from '@/lib/utils';

export const dynamic = 'force-static';
export const alt = '트렌드 다이제스트 — trends';
export const size = OG_SIZE;
export const contentType = 'image/png';

export function generateStaticParams() {
  return listSnapshotDates()
    .slice(0, 90)
    .map((date) => ({ date }));
}

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  return renderOgImage({
    badge: '트렌드 다이제스트',
    title: formatDateLabel(date),
    subtitle: '국내·해외 검색·뉴스·트렌드 스냅샷',
  });
}

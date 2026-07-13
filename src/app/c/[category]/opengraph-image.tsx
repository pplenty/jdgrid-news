// /c/[category] 페이지별 동적 OG 이미지 (ADR-0043) — 카테고리 라벨.

import { CATEGORY_IDS, CATEGORY_LABELS, type CategoryId } from '@/lib/categories';
import { OG_SIZE, renderOgImage } from '@/lib/og-template';

export const dynamic = 'force-static';
export const alt = '카테고리 트렌드 — trends';
export const size = OG_SIZE;
export const contentType = 'image/png';

export function generateStaticParams() {
  return CATEGORY_IDS.map((id) => ({ category: id }));
}

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const id = (await params).category as CategoryId;
  const label = CATEGORY_IDS.includes(id) ? CATEGORY_LABELS[id] : { ko: '카테고리', en: '' };
  return renderOgImage({
    badge: '카테고리 트렌드',
    title: label.ko,
    subtitle: [label.en, '오늘의 헤드라인'].filter(Boolean).join(' · '),
  });
}

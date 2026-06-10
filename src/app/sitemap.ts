// Next.js 15 sitemap.ts — 빌드 시 /sitemap.xml 정적 생성.

import type { MetadataRoute } from 'next';

import { CATEGORY_IDS } from '@/lib/categories';
import { listSnapshotDates, loadLatest } from '@/lib/data';

// output: 'export' 호환 — force-static으로 빌드 시점에 정적 생성.
export const dynamic = 'force-static';

const BASE = 'https://trends.jdgrid.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const snapshot = loadLatest();
  const lastModified = snapshot.date;

  const staticPages: MetadataRoute.Sitemap = (
    ['/', '/about/', '/privacy/', '/headlines/', '/trends/', '/analytics/', '/search/'] as const
  ).map((p) => ({
    url: `${BASE}${p}`,
    lastModified,
    changeFrequency: p === '/' ? 'daily' : 'weekly',
    priority: p === '/' ? 1.0 : 0.7,
  }));

  const categoryPages: MetadataRoute.Sitemap = CATEGORY_IDS.map((id) => ({
    url: `${BASE}/c/${id}/`,
    lastModified,
    changeFrequency: 'daily',
    priority: 0.6,
  }));

  const datePages: MetadataRoute.Sitemap = listSnapshotDates()
    .slice(0, 90)
    .map((d) => ({
      url: `${BASE}/d/${d}/`,
      lastModified: d,
      changeFrequency: 'never',
      priority: 0.3,
    }));

  const keywords = new Set<string>();
  for (const t of [...snapshot.trends.kr, ...snapshot.trends.global]) {
    if (t.keyword) keywords.add(t.keyword);
  }
  const keywordPages: MetadataRoute.Sitemap = [...keywords].map((k) => ({
    url: `${BASE}/k/${encodeURIComponent(k)}/`,
    lastModified,
    changeFrequency: 'daily',
    priority: 0.4,
  }));

  return [...staticPages, ...categoryPages, ...datePages, ...keywordPages];
}

// Next.js 15 sitemap.ts — 빌드 시 /sitemap.xml 정적 생성.

import type { MetadataRoute } from 'next';

import { CATEGORY_IDS } from '@/lib/categories';
import { listSnapshotDates, loadLatest } from '@/lib/data';
import { listKeywordEntries } from '@/lib/keyword-index';

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

  // 보존 창(90일) 안의 키워드 전부 등재 — 페이지가 살아있는 범위와 일치시킨다 (ADR-0044).
  // lastModified 는 마지막 등장일이라 과거 키워드는 자연히 낮은 신선도로 신호된다.
  const keywordPages: MetadataRoute.Sitemap = listKeywordEntries().map((entry) => ({
    url: `${BASE}/k/${encodeURIComponent(entry.keyword)}/`,
    lastModified: entry.dates[0],
    changeFrequency: entry.dates[0] === lastModified ? 'daily' : 'monthly',
    priority: entry.dates[0] === lastModified ? 0.4 : 0.3,
  }));

  return [...staticPages, ...categoryPages, ...datePages, ...keywordPages];
}

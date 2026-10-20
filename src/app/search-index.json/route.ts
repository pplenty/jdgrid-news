// /search-index.json — 사이트 검색 인덱스 정적 파일 (ADR-0045).
// /search HTML 에 임베드하면 RSC 이스케이프로 인덱스 크기의 ~2배가 페이지에 실린다 →
// 빌드타임에 별도 JSON 으로 내보내고 SearchClient 가 fetch(?v=날짜 캐시버스터).

import { listSnapshotDates, loadByDate } from '@/lib/data';
import { listKeywordEntries } from '@/lib/keyword-index';
import { buildSearchIndex, SEARCH_ARTICLE_DAYS, type SearchIndex } from '@/lib/search';
import type { DailySnapshot } from '@/lib/types';

export const dynamic = 'force-static';

export function GET() {
  const dates = listSnapshotDates();
  const articleSnapshots = dates
    .slice(0, SEARCH_ARTICLE_DAYS)
    .map(loadByDate)
    .filter((s): s is DailySnapshot => s !== null);
  const index: SearchIndex = {
    date: dates[0] ?? '',
    docs: buildSearchIndex({ keywords: listKeywordEntries(), articleSnapshots }),
  };
  return Response.json(index);
}

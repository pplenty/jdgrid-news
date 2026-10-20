// /search — 사이트 내 검색 (ADR-0042 · ADR-0045). 인덱스는 /search-index.json 으로 따로
// 내보내고 클라이언트가 fetch. q 는 클라이언트가 마운트 시 ?q= 에서 읽음(Suspense 불요).

import type { Metadata } from 'next';
import { preload } from 'react-dom';

import { listSnapshotDates } from '@/lib/data';
import { breadcrumb, SITE_BASE } from '@/lib/jsonld';
import { KEYWORD_RETENTION_DAYS } from '@/lib/keyword-index';
import { SEARCH_ARTICLE_DAYS } from '@/lib/search';

import { JsonLd } from '../_components/JsonLd';
import { SearchClient } from '../_components/SearchClient';

export const metadata: Metadata = {
  title: '검색 — trends',
  description: `최근 ${KEYWORD_RETENTION_DAYS}일 트렌드 키워드·카테고리·최근 ${SEARCH_ARTICLE_DAYS}일 수집 뉴스를 사이트 내에서 검색.`,
  alternates: { canonical: '/search/' },
};

export default function SearchPage() {
  // 인덱스는 매일 바뀌므로 최신 스냅샷 일자를 캐시버스터로 — 파일 자체는 장기 캐시(_headers).
  const indexUrl = `/search-index.json?v=${listSnapshotDates()[0] ?? ''}`;
  // ?q= 랜딩(SearchAction·공유 링크)에서 하이드레이션을 기다리지 않고 인덱스를 미리 받는다.
  preload(indexUrl, { as: 'fetch', crossOrigin: 'anonymous' });

  return (
    <>
      <JsonLd
        data={breadcrumb([
          { name: '홈', url: `${SITE_BASE}/` },
          { name: '검색', url: `${SITE_BASE}/search/` },
        ])}
      />
      <SearchClient
        indexUrl={indexUrl}
        keywordDays={KEYWORD_RETENTION_DAYS}
        articleDays={SEARCH_ARTICLE_DAYS}
      />
    </>
  );
}

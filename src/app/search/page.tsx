// /search — 사이트 내 검색 (ADR-0042). 빌드타임에 최신 스냅샷으로 인덱스를 만들어
// 클라이언트 컴포넌트에 임베드. q 는 클라이언트가 마운트 시 ?q= 에서 읽음(Suspense 불요).

import type { Metadata } from 'next';

import { loadLatest } from '@/lib/data';
import { breadcrumb, SITE_BASE } from '@/lib/jsonld';
import { buildSearchIndex } from '@/lib/search';

import { JsonLd } from '../_components/JsonLd';
import { SearchClient } from '../_components/SearchClient';

export const metadata: Metadata = {
  title: '검색 — trends',
  description: '오늘의 트렌드 키워드·카테고리·수집 뉴스를 사이트 내에서 검색.',
  alternates: { canonical: '/search/' },
};

export default function SearchPage() {
  const index = buildSearchIndex(loadLatest());

  return (
    <>
      <JsonLd
        data={breadcrumb([
          { name: '홈', url: `${SITE_BASE}/` },
          { name: '검색', url: `${SITE_BASE}/search/` },
        ])}
      />
      <SearchClient index={index} />
    </>
  );
}

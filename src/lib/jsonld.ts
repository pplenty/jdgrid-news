// JSON-LD 구조화 데이터 빌더 (ADR-0040). 순수 함수 — 결정적, 테스트 가능.
// 렌더는 _components/JsonLd.tsx ( `<` 이스케이프로 </script> 주입 차단).

export const SITE_BASE = 'https://trends.jdgrid.com';

/** 사이트 전역 @graph — Organization(발행자) + WebSite. 루트 layout 에 1회. */
export function siteGraph() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_BASE}/#organization`,
        name: 'trends',
        url: `${SITE_BASE}/`,
        logo: `${SITE_BASE}/favicon.svg`,
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_BASE}/#website`,
        name: 'trends',
        url: `${SITE_BASE}/`,
        description: '국내·해외 검색·뉴스·지식·쇼핑·문화 트렌드를 한 페이지에서.',
        inLanguage: 'ko-KR',
        publisher: { '@id': `${SITE_BASE}/#organization` },
        // ADR-0042: 사이트 내 검색(/search) 도입 → ADR-0040 에서 보류했던 SearchAction 활성화.
        // sitelinks 검색창 후보. trailingSlash 정합으로 /search/?q= 사용.
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${SITE_BASE}/search/?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };
}

export type LdItem = { name: string; url?: string };

/** ItemList — 트렌드/헤드라인 등 목록 콘텐츠. url 은 선택. */
export function itemList(name: string, items: LdItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      ...(it.url ? { url: it.url } : {}),
    })),
  };
}

export type Crumb = { name: string; url: string };

/** BreadcrumbList — 카테고리/키워드 등 하위 페이지. */
export function breadcrumb(crumbs: Crumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: c.url,
    })),
  };
}

/** 정적 생성된 /k/[keyword] 절대 URL (generateStaticParams 와 동일 인코딩). */
export function keywordUrl(keyword: string): string {
  return `${SITE_BASE}/k/${encodeURIComponent(keyword)}/`;
}

/** /c/[category] 절대 URL. */
export function categoryUrl(id: string): string {
  return `${SITE_BASE}/c/${id}/`;
}

import { describe, expect, it } from 'vitest';

import { breadcrumb, categoryUrl, itemList, keywordUrl, siteGraph } from './jsonld';

describe('siteGraph', () => {
  it('links WebSite.publisher to the Organization @id', () => {
    const g = siteGraph() as { '@graph': Array<Record<string, unknown>> };
    const org = g['@graph'].find((n) => n['@type'] === 'Organization')!;
    const site = g['@graph'].find((n) => n['@type'] === 'WebSite')!;
    expect((site.publisher as { '@id': string })['@id']).toBe(org['@id']);
    expect(site['@context']).toBeUndefined(); // @context는 graph 루트에만
  });
});

describe('itemList', () => {
  it('numbers positions from 1 and omits url when absent', () => {
    const ld = itemList('트렌드', [{ name: 'AI', url: 'https://x/k/AI/' }, { name: '선거' }]);
    expect(ld.numberOfItems).toBe(2);
    expect(ld.itemListElement[0]).toMatchObject({ position: 1, name: 'AI', url: 'https://x/k/AI/' });
    expect(ld.itemListElement[1]).toMatchObject({ position: 2, name: '선거' });
    expect('url' in ld.itemListElement[1]).toBe(false);
  });
});

describe('breadcrumb', () => {
  it('builds positioned crumbs with item URLs', () => {
    const ld = breadcrumb([
      { name: '홈', url: 'https://x/' },
      { name: '세계', url: 'https://x/c/world/' },
    ]);
    expect(ld.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: '홈', item: 'https://x/' },
      { '@type': 'ListItem', position: 2, name: '세계', item: 'https://x/c/world/' },
    ]);
  });
});

describe('url builders', () => {
  it('encodes keyword path like generateStaticParams', () => {
    expect(keywordUrl('AI 반도체')).toBe('https://trends.jdgrid.com/k/AI%20%EB%B0%98%EB%8F%84%EC%B2%B4/');
    expect(categoryUrl('world')).toBe('https://trends.jdgrid.com/c/world/');
  });
});

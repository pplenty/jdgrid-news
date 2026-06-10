'use client';

// 사이트 내 검색 결과 UI (ADR-0042). 빌드타임 인덱스(prop)를 클라이언트에서 필터.
// useSearchParams 로 ?q= 진입값을 받고(=SearchAction 랜딩), 입력 시 URL 동기화(공유 가능).

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ExternalLink, Hash, Layers, Newspaper, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { searchDocs, type SearchDoc, type SearchDocType } from '@/lib/search';

const GROUPS: { type: SearchDocType; label: string; icon: typeof Hash }[] = [
  { type: 'keyword', label: '키워드', icon: Hash },
  { type: 'category', label: '카테고리', icon: Layers },
  { type: 'article', label: '뉴스', icon: Newspaper },
];

export function SearchClient({ index }: { index: SearchDoc[] }) {
  const router = useRouter();
  // 정적 HTML 에 검색 UI 가 그대로 들어가도록 q 는 빈값으로 시작 → 마운트 시 ?q= 반영.
  // (useSearchParams 는 Suspense·fallback 을 강제해 정적 출력이 비어버림.)
  const [q, setQ] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => searchDocs(index, q, 60), [index, q]);

  // 진입 시 ?q= 반영(SearchAction·공유 링크 랜딩) + 자동 포커스.
  useEffect(() => {
    const initial = new URLSearchParams(window.location.search).get('q');
    if (initial) setQ(initial);
    inputRef.current?.focus();
  }, []);

  // 주소창 동기화 (디바운스) — 공유/SearchAction 랜딩 재현.
  useEffect(() => {
    const t = setTimeout(() => {
      const next = q.trim() ? `/search/?q=${encodeURIComponent(q.trim())}` : '/search/';
      router.replace(next, { scroll: false });
    }, 250);
    return () => clearTimeout(t);
  }, [q, router]);

  const grouped = GROUPS.map((g) => ({
    ...g,
    items: results.filter((d) => d.type === g.type),
  })).filter((g) => g.items.length > 0);

  const trimmed = q.trim();

  return (
    <div className="mx-auto max-w-prose px-4 py-8 lg:px-8">
      <h1 className="mb-4 flex items-center gap-2 text-2xl font-bold tracking-tight">
        <Search size={22} className="text-fg-subtle" /> 검색
      </h1>

      <div className="relative">
        <Search
          size={18}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle"
        />
        <input
          ref={inputRef}
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="키워드·카테고리·뉴스 제목 검색"
          aria-label="사이트 검색"
          autoComplete="off"
          className="w-full rounded-lg border border-border bg-bg py-2.5 pl-10 pr-3 text-base outline-none transition-colors placeholder:text-fg-subtle focus:border-accent"
        />
      </div>

      {!trimmed && (
        <p className="mt-6 text-sm text-fg-subtle">
          오늘의 트렌드 키워드, 9개 카테고리, 수집된 뉴스 제목을 한 번에 찾아보세요.
        </p>
      )}

      {trimmed && results.length === 0 && (
        <p className="mt-6 text-sm text-fg-muted">
          <span className="font-semibold">&ldquo;{trimmed}&rdquo;</span> 에 대한 결과가 없어요.
        </p>
      )}

      {grouped.length > 0 && (
        <div className="mt-6 space-y-6">
          {grouped.map((g) => (
            <section key={g.type}>
              <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-fg-subtle">
                <g.icon size={13} /> {g.label}
                <span className="font-normal normal-case text-fg-subtle/70">{g.items.length}</span>
              </h2>
              <ul className="space-y-1">
                {g.items.map((d) => (
                  <li key={`${d.type}:${d.url}`}>
                    <ResultRow doc={d} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function ResultRow({ doc }: { doc: SearchDoc }) {
  const inner = (
    <>
      <span className="min-w-0 flex-1 truncate font-medium group-hover:text-accent-fg">
        {doc.title}
      </span>
      {doc.subtitle && (
        <span className="shrink-0 text-xs text-fg-subtle">{doc.subtitle}</span>
      )}
      {doc.external && (
        <ExternalLink size={13} className="shrink-0 text-fg-subtle opacity-0 group-hover:opacity-70" />
      )}
    </>
  );

  const className =
    'group flex items-center gap-2 rounded-md border border-border-subtle px-3 py-2 transition-colors hover:border-border hover:bg-bg-subtle';

  if (doc.external) {
    return (
      <a href={doc.url} target="_blank" rel="noreferrer noopener" className={className}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={doc.url} className={className}>
      {inner}
    </Link>
  );
}

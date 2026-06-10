'use client';

// 헤더 검색 진입 (ADR-0042). 데스크탑 인라인 폼 — 제출 시 /search?q= 로 이동.
// 모바일 아이콘 링크는 Header 우측 그룹에서 별도 렌더.

import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { useState } from 'react';

export function SearchBox() {
  const router = useRouter();
  const [q, setQ] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = q.trim();
    router.push(t ? `/search/?q=${encodeURIComponent(t)}` : '/search/');
  }

  return (
    <form
      role="search"
      onSubmit={submit}
      className="relative hidden w-full max-w-md md:block"
    >
      <Search
        size={16}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle"
      />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="검색"
        aria-label="사이트 검색"
        autoComplete="off"
        className="w-full rounded-full border border-border bg-bg-subtle py-1.5 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-fg-subtle focus:border-accent focus:bg-bg"
      />
    </form>
  );
}

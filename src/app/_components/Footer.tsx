// 사이트 푸터 — 브랜드 + 데이터 source + 매체 + About/Contact.
// Server 컴포넌트 (SOURCES 직접 import).

import Link from 'next/link';
import { Mail } from 'lucide-react';

import { SOURCES } from '@/scraper/sources';

import { ConstellationMark } from './icons';

const SISTER_SITES = [
  { name: 'jdgrid', url: 'https://jdgrid.com' },
  { name: 'yutils', url: 'https://yutils.jdgrid.com' },
  { name: 'trading', url: 'https://trading.jdgrid.com' },
];

const DATA_SOURCES = [
  { label: 'Google Trends', icon: '🔍', note: 'Daily + Realtime API' },
  { label: 'Wikipedia Pageviews', icon: '📚', note: 'ko · en, 7일 추이' },
  { label: 'Naver DataLab', icon: '🛍', note: '쇼핑 카테고리·키워드' },
  { label: 'Apple iTunes Korea', icon: '🎵', note: '음악·앱 차트' },
  { label: '매체 RSS', icon: '📰', note: '국내외 12곳' },
];

export function Footer() {
  const uniqueMedia = [...new Map(SOURCES.map((s) => [s.name, s])).values()];
  const year = new Date().getFullYear();

  return (
    <footer className="mt-8 border-t border-border-subtle bg-bg-subtle/50 px-4 py-10 text-sm text-fg-muted lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2 lg:grid-cols-12">
        {/* Brand */}
        <div className="lg:col-span-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-base font-bold tracking-tight text-fg"
          >
            <ConstellationMark size={18} />
            trends
          </Link>
          <p className="mt-2 max-w-xs text-xs leading-relaxed text-fg-subtle">
            국내·해외 검색·뉴스·지식·쇼핑·문화 트렌드를 한 페이지에서.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-subtle">
            <span className="font-medium text-fg-muted">jdgrid family</span>
            <span aria-hidden>·</span>
            {SISTER_SITES.map((s, i) => (
              <span key={s.url} className="flex items-center gap-x-3">
                {i > 0 && <span aria-hidden>·</span>}
                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="hover:text-fg"
                >
                  {s.name}
                </a>
              </span>
            ))}
          </div>
        </div>

        {/* Data Sources */}
        <div className="lg:col-span-3">
          <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-fg">
            Data Sources
          </h3>
          <ul className="space-y-1.5 text-xs">
            {DATA_SOURCES.map((s) => (
              <li key={s.label} className="flex items-baseline gap-2">
                <span aria-hidden className="text-sm">
                  {s.icon}
                </span>
                <div>
                  <span className="font-medium text-fg-muted">{s.label}</span>
                  <span className="ml-1 text-fg-subtle">— {s.note}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Media */}
        <div className="lg:col-span-4">
          <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-fg">Media</h3>
          <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
            {uniqueMedia.map((m) => (
              <li key={m.name}>
                <a
                  href={m.homepage}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="hover:text-fg"
                >
                  {m.name}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* About */}
        <div className="lg:col-span-2">
          <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-fg">About</h3>
          <ul className="space-y-1.5 text-xs">
            <li>
              <Link href="/about/" className="hover:text-fg">
                소개·면책
              </Link>
            </li>
            <li>
              <Link href="/headlines/" className="hover:text-fg">
                Headlines
              </Link>
            </li>
            <li>
              <Link href="/trends/" className="hover:text-fg">
                트렌드 상세
              </Link>
            </li>
            <li className="flex items-center gap-1.5 pt-1">
              <Mail size={11} aria-hidden />
              <a href="mailto:support@jdgrid.com" className="hover:text-fg">
                support@jdgrid.com
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-6xl border-t border-border-subtle pt-4 text-[11px] leading-relaxed text-fg-subtle">
        © {year} trends.jdgrid.com · 기사 본문·이미지의 저작권은 각 매체에 있습니다. 매체 클레임
        수신 시 해당 소스를 즉시 제거합니다.
      </div>
    </footer>
  );
}

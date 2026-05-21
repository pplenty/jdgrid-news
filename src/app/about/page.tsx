// About 페이지 — 출처·면책·운영 정보. ADR-0007 §운영 원칙 반영.

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

import { SOURCES } from '@/scraper/sources';

import { GithubIcon } from '../_components/icons';

export const metadata = {
  title: 'About — jdgrid·news',
  description: '데이터 출처, 면책, 운영 정보.',
};

export default function AboutPage() {
  const uniqueSources = [...new Map(SOURCES.map((s) => [s.name, s])).values()];

  return (
    <div className="mx-auto max-w-prose px-4 py-10 lg:px-8">
      <header className="mb-8 border-b border-border-subtle pb-4">
        <h1 className="text-2xl font-bold tracking-tight">About</h1>
        <p className="mt-2 text-sm text-fg-muted">
          jdgrid·news는 국내·해외 RSS를 매일 1회 모아 카테고리별 헤드라인과 트렌딩 키워드를 보여주는
          뉴스 인덱스입니다.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">콘텐츠 정책</h2>
        <p className="text-fg-muted">
          이 사이트는 <strong>매체가 RSS에 공개한 헤드라인·짧은 요약·썸네일·출처·원문 링크</strong>만
          노출합니다. 본문 전문은 저장·재게시하지 않으며, 자체 요약을 만들지 않습니다. 모든 기사는
          매체 원문으로 연결되며, 썸네일은 매체 서버에서 직접 로드합니다.
        </p>
        <p className="text-sm text-fg-subtle">
          자세한 정책은 ADR-0007에 정리되어 있습니다 — 본 사이트 운영의 헌법 역할을 합니다.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-lg font-semibold">데이터 출처</h2>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          {uniqueSources.map((s) => (
            <li key={s.name} className="text-fg-muted">
              <a
                href={s.homepage}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 hover:text-fg"
              >
                {s.name}
                <ExternalLink size={11} className="opacity-60" />
              </a>
            </li>
          ))}
        </ul>
        <p className="text-sm text-fg-subtle">
          글로벌·국내 트렌딩 키워드는 Google Trends RSS와 우리가 수집한 헤드라인의 단어 빈도를 함께
          사용합니다.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-lg font-semibold">면책 / 클레임</h2>
        <p className="text-fg-muted">
          기사 본문·이미지의 저작권은 각 매체에 있습니다. 매체로부터 RSS 제거·이미지 핫링크 중단
          요청을 받으면 해당 매체의 소스를 즉시 제거합니다.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-lg font-semibold">운영</h2>
        <p className="text-fg-muted">
          매일 KST 06:00에 GitHub Actions가 RSS를 수집해 정적 사이트를 다시 빌드합니다.
        </p>
        <p className="flex items-center gap-2 text-sm">
          <GithubIcon size={14} />
          <a
            href="https://github.com/pplenty/jdgrid-news"
            target="_blank"
            rel="noreferrer noopener"
            className="text-fg-muted hover:text-fg"
          >
            github.com/pplenty/jdgrid-news
          </a>
        </p>
      </section>

      <div className="mt-12 border-t border-border-subtle pt-4">
        <Link href="/" className="text-sm text-fg-muted hover:text-fg">
          ← 홈으로
        </Link>
      </div>
    </div>
  );
}

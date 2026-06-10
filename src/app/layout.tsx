import type { Metadata } from 'next';

import { loadLatest, toSidebarData } from '@/lib/data';
import { siteGraph } from '@/lib/jsonld';

import { ClientShell } from './_components/ClientShell';
import { JsonLd } from './_components/JsonLd';
import { Footer } from './_components/Footer';
import { ThemeProvider, THEME_INIT_SCRIPT } from './_components/ThemeProvider';
import './globals.css';

const PRETENDARD_CSS =
  'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css';

// ADR-0041 — 렌더 블로킹 회피: 외부 폰트 CSS 를 print 미디어로 비동기 첨부 후 'all' 로 스왑.
// 첫 페인트는 시스템 폴백(Apple SD Gothic Neo / 맑은 고딕)으로 즉시 → Pretendard 로 교체(FOUT).
// 폰트 실제 로드 완료 시 body.fonts-loaded → globals.css 자간 보정 해제로 reflow 완화.
const FONT_LOAD_SCRIPT = `
(function(){try{
  var l=document.createElement('link');
  l.rel='stylesheet';l.href=${JSON.stringify(PRETENDARD_CSS)};
  l.crossOrigin='anonymous';l.media='print';
  l.onload=function(){
    this.media='all';
    if(document.fonts&&document.fonts.ready){
      document.fonts.ready.then(function(){
        if(document.body)document.body.classList.add('fonts-loaded');
      });
    }
  };
  document.head.appendChild(l);
}catch(_){}})();
`.trim();

export const metadata: Metadata = {
  title: 'trends — 오늘의 인사이트',
  description:
    '국내·해외 검색·뉴스·지식·쇼핑·문화 트렌드를 한 페이지에서. https://trends.jdgrid.com',
  metadataBase: new URL('https://trends.jdgrid.com'),
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
  },
  openGraph: {
    title: 'trends',
    description: '국내·해외 검색·뉴스·지식·쇼핑·문화 트렌드를 한 페이지에서.',
    url: 'https://trends.jdgrid.com',
    siteName: 'trends',
    locale: 'ko_KR',
    type: 'website',
  },
  // 네이버 서치어드바이저 사이트 소유확인. <meta name="naver-site-verification" …> 렌더.
  verification: {
    other: {
      'naver-site-verification': '676cdee75060a19cff222b057697f849ec0f2425',
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const sidebarData = toSidebarData(loadLatest());
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        {/* ADR-0041: 폰트 CSS 비차단 로드 — 파서가 일찍 다운로드 시작(preload) + 스크립트로 스왑 첨부 */}
        <link rel="preload" as="style" href={PRETENDARD_CSS} crossOrigin="anonymous" />
        {/* eslint-disable-next-line react/no-danger */}
        <script dangerouslySetInnerHTML={{ __html: FONT_LOAD_SCRIPT }} />
        <noscript>
          {/* JS 비활성 환경 폴백 — 동기 로드 */}
          {/* eslint-disable-next-line @next/next/no-page-custom-font */}
          <link rel="stylesheet" href={PRETENDARD_CSS} crossOrigin="anonymous" />
        </noscript>
        {/* eslint-disable-next-line react/no-danger */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <JsonLd data={siteGraph()} />
      </head>
      <body className="font-sans">
        <ThemeProvider>
          <ClientShell sidebarData={sidebarData} footer={<Footer />}>
            {children}
          </ClientShell>
        </ThemeProvider>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';

import { loadLatest, toSidebarData } from '@/lib/data';

import { ClientShell } from './_components/ClientShell';
import { ThemeProvider, THEME_INIT_SCRIPT } from './_components/ThemeProvider';
import './globals.css';

const PRETENDARD_CSS =
  'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css';

export const metadata: Metadata = {
  title: 'jdgrid·news — 오늘의 헤드라인',
  description: '국내·해외 주요 뉴스와 트렌딩 키워드를 한눈에. https://news.jdgrid.com',
  metadataBase: new URL('https://news.jdgrid.com'),
  openGraph: {
    title: 'jdgrid·news',
    description: '국내·해외 주요 뉴스와 트렌딩 키워드를 한눈에.',
    url: 'https://news.jdgrid.com',
    siteName: 'jdgrid·news',
    locale: 'ko_KR',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const sidebarData = toSidebarData(loadLatest());
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="stylesheet" href={PRETENDARD_CSS} />
        {/* eslint-disable-next-line react/no-danger */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="font-sans">
        <ThemeProvider>
          <ClientShell sidebarData={sidebarData}>{children}</ClientShell>
        </ThemeProvider>
      </body>
    </html>
  );
}

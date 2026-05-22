import type { Metadata } from 'next';

import { loadLatest, toSidebarData } from '@/lib/data';

import { ClientShell } from './_components/ClientShell';
import { ThemeProvider, THEME_INIT_SCRIPT } from './_components/ThemeProvider';
import './globals.css';

const PRETENDARD_CSS =
  'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css';

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

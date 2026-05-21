import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'jdgrid·news — 오늘의 헤드라인',
  description: '국내·해외 주요 뉴스와 트렌딩 키워드를 한눈에. https://news.jdgrid.com',
  metadataBase: new URL('https://news.jdgrid.com'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="font-sans antialiased text-neutral-900 dark:text-neutral-100 bg-white dark:bg-neutral-950">
        {children}
      </body>
    </html>
  );
}

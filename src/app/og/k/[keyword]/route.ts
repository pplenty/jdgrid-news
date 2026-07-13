// /og/k/[keyword] — 키워드 OG 이미지 정적 라우트 핸들러 (ADR-0043).
// /k 는 파일 컨벤션(opengraph-image.tsx)을 못 쓴다: Next 가 인코딩 필요한 동적 파라미터
// (한글·공백)의 og:image URL 을 이중 인코딩(%25EA…)해 크롤러가 404 를 받는다.
// 라우트 핸들러 + generateMetadata 수동 참조로 URL 인코딩을 우리가 제어(단일 인코딩).

import { decodeKeyword, keywordStaticParams } from '@/app/k/[keyword]/params';
import { findTrendByKeyword, loadLatest } from '@/lib/data';
import { renderOgImage } from '@/lib/og-template';
import { formatDateLabel } from '@/lib/utils';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return keywordStaticParams();
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ keyword: string }> },
) {
  const keyword = decodeKeyword((await params).keyword);
  const snapshot = loadLatest();
  const trend = findTrendByKeyword(snapshot, keyword);
  const subtitle = [
    trend?.traffic ? `검색량 ${trend.traffic}` : null,
    formatDateLabel(snapshot.date),
  ]
    .filter(Boolean)
    .join(' · ');
  return renderOgImage({ badge: '오늘의 검색 트렌드', title: keyword, subtitle });
}
